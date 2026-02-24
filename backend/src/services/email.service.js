import nodemailer from 'nodemailer';
import ical from 'ical-generator';
import QRCode from 'qrcode';
import config from '../config/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: "email-smtp.ap-south-1.amazonaws.com",
            port: 2525,
            secure: false, // true for 465, false for other ports
            auth: {
                user: config?.smtp_creds?.user,
                pass: config?.smtp_creds?.password
            },
        });

        // Verify connection configuration
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('Email Server Error (Check SES Credentials/Region):', error);
            } else {
                console.log('Email Server is ready to take messages');
            }
        });
    }

    /**
     * Generic send email method with CID support for QR codes
     */
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: '"CapsuleCabs" <no-reply@capsulecabs.com>',
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: []
            };

            // 1. Handle QR Code Attachment (CID for inline display)
            if (options.qrBuffer) {
                mailOptions.attachments.push({
                    filename: 'ticket-qr.png',
                    content: options.qrBuffer,
                    cid: 'qrimage' // This matches <img src="cid:qrimage"> in your HTML
                });
            }

            // 2. Handle Calendar Invite
            if (options.icalEvent) {
                const calendarAttachment = {
                    filename: options.icalEvent.filename,
                    content: options.icalEvent.content,
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST'
                };
                
                mailOptions.attachments.push(calendarAttachment);
                
                // For Outlook/Gmail calendar integration
                mailOptions.alternatives = [{
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST',
                    content: options.icalEvent.content
                }];
            }

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('CRITICAL: Email Send Error on Production:', error.message);
            // This error will help identify if DigitalOcean is blocking the port or AWS rejected the verified sender
            throw new Error(`Email failed: ${error.message}`);
        }
    }

    /**
     * Sends the booking confirmation with QR and Calendar Invite
     */
    async sendBookingEmail(userEmail, bookingDetails) {
        try {
            // 1. Generate QR Code with Brand Colors
            const qrData = `https://capsulecabs.com/verify/${bookingDetails.bookingId}`;
            const qrCodeBase64 = await QRCode.toDataURL(qrData, {
                color: { dark: '#9dec75', light: '#000000' },
                margin: 1,
                width: 300
            });

            // Convert Base64 string to a Buffer
            const qrImageBuffer = Buffer.from(qrCodeBase64.split(',')[1], 'base64');

            // 2. Load and Prepare HTML Template
            const templatePath = path.join(__dirname, '../templates/booking-email.html');
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template not found at ${templatePath}`);
            }
            
            let html = fs.readFileSync(templatePath, 'utf8');

            const travelDate = new Date(bookingDetails.travelDate);
            const istDate = new Intl.DateTimeFormat('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
            }).format(travelDate);

            const placeholders = {
                bookingId: bookingDetails.bookingId,
                origin: bookingDetails.origin,
                destination: bookingDetails.destination,
                travelDate: istDate,
                vehicleNumber: bookingDetails.vehicleNumber || 'Assigned Soon',
                passengerList: bookingDetails.passengers?.map(p => `${p.name} (Seat ${p.seatNumber})`).join(', ') || 'N/A',
                totalAmount: bookingDetails.totalAmount,
                pickupPoint: bookingDetails.pickupPoint,
                dropPoint: bookingDetails.dropPoint,
                departureTime: bookingDetails.departureTime,
                arrivalTime: bookingDetails.arrivalTime
            };

            // 3. Inject Placeholders into HTML
            Object.keys(placeholders).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                html = html.replace(regex, placeholders[key] || '');
            });

            // 4. Create iCal Event
            const calendar = ical({ name: 'CapsuleCabs Trip' });
            calendar.createEvent({
                start: travelDate,
                end: new Date(travelDate.getTime() + 4 * 60 * 60 * 1000), // Approx 4 hour trip
                summary: `Trip to ${bookingDetails.destination}`,
                description: `Your CapsuleCabs trip from ${bookingDetails.origin} to ${bookingDetails.destination}. Ticket ID: ${bookingDetails.bookingId}`,
                location: bookingDetails.pickupPoint,
                method: 'REQUEST'
            });

            // 5. Trigger the email send
            return await this.sendEmail({
                to: userEmail,
                subject: `Trip Confirmed! Ticket #${placeholders.bookingId}`,
                html: html,
                text: `Booking confirmed for Ticket #${placeholders.bookingId}. Please check the attached QR code.`,
                icalEvent: {
                    method: 'REQUEST',
                    content: calendar.toString(),
                    filename: 'trip-invite.ics'
                },
                qrBuffer: qrImageBuffer
            });
        } catch (error) {
            console.error('Booking Email Service Error:', error);
            throw error;
        }
    }
}

export default new EmailService();