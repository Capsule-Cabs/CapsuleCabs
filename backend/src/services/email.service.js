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
            port: 587,
            secure: false,
            auth: {
                user: config?.smtp_creds?.user,
                pass: config?.smtp_creds?.password
            },
        });

        // Verify connection configuration
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('Email Server Error:', error);
            } else {
                console.log('Email Server is ready to take messages');
            }
        });
    }

    /**
     * Generic send email method
     */
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: '"CapsuleCabs" <no-reply@capsulecabs.com>',
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                alternatives: options.icalEvent ? [{
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST',
                    content: options.icalEvent.content
                }] : [],
                attachments: options.icalEvent ? [{
                    filename: options.icalEvent.filename,
                    content: options.icalEvent.content,
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST'
                }] : []
            };

            const log = await this.transporter.sendMail(mailOptions);
            return log;
        } catch (error) {
            console.error('Email Send Error:', error);
            throw new Error('Email could not be sent');
        }
    }

    /**
     * Updated method to use the HTML template
     */
    /**
   * Updated method to use the HTML template with safety checks
   */
    async sendBookingEmail(userEmail, bookingDetails) {
        try {
            // 1. Generate QR Code
            const qrData = `https://capsulecabs.com/verify/${bookingDetails.bookingId}`;
            const qrCodeBase64 = await QRCode.toDataURL(qrData, {
                color: { dark: '#9dec75', light: '#000000' },
                margin: 0,
                width: 300
            });

            // Convert Base64 string to a Buffer for attachment
            const qrImageBuffer = Buffer.from(qrCodeBase64.split(',')[1], 'base64');

            const templatePath = path.join(__dirname, '../templates/booking-email.html');
            let html = fs.readFileSync(templatePath, 'utf8');

            // 2. Date/Passenger Logic
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
                passengerList: bookingDetails.passengers?.map(p => `${p.name} (${p.seatNumber})`).join(', '),
                totalAmount: bookingDetails.totalAmount,
                pickupPoint: bookingDetails.pickupPoint,
                dropPoint: bookingDetails.dropPoint,
                departureTime: bookingDetails.departureTime,
                arrivalTime: bookingDetails.arrivalTime
            };

            // 3. Inject Placeholders
            Object.keys(placeholders).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                html = html.replace(regex, placeholders[key] || '');
            });

            // 4. Create Calendar
            const calendar = ical({ name: 'CapsuleCabs Trip' });
            calendar.createEvent({
                start: travelDate,
                end: new Date(travelDate.getTime() + 4 * 60 * 60 * 1000),
                summary: `Trip to ${bookingDetails.destination}`,
                location: bookingDetails.pickupPoint,
                method: 'REQUEST'
            });

            // 5. Send with BOTH QR and Calendar
            return await this.sendEmail({
                to: userEmail,
                subject: `Trip Confirmed! #${placeholders.bookingId}`,
                html: html,
                text: `Booking confirmed for #${placeholders.bookingId}`,
                icalEvent: {
                    method: 'REQUEST',
                    content: calendar.toString(),
                    filename: 'invite.ics'
                },
                qrBuffer: qrImageBuffer // Pass the buffer here
            });
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Updated Generic Method to handle CID attachments
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: '"CapsuleCabs" <no-reply@capsulecabs.com>',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: [],
                alternatives: []
            };

            // Attach QR Code as a CID (Content-ID)
            if (options.qrBuffer) {
                mailOptions.attachments.push({
                    filename: 'ticket-qr.png',
                    content: options.qrBuffer,
                    cid: 'qr-code' // This MUST match <img src="cid:qr-code"> in HTML
                });
            }

            // Attach Calendar Invite
            if (options.icalEvent) {
                mailOptions.alternatives.push({
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST',
                    content: options.icalEvent.content
                });
            }

            return await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('SMTP Error:', error);
            throw error;
        }
    }
}

export default new EmailService();