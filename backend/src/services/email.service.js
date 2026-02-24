import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
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
        // Initialize the AWS SES Client
        // This uses HTTPS (Port 443) which is NOT blocked by DigitalOcean
        this.sesClient = new SESClient({
            region: "ap-south-1",
            credentials: {
                accessKeyId: config.smtp_creds.aws_access_key, // Ensure these are in your config/env
                secretAccessKey: config.smtp_creds.aws_secret_key
            }
        });

        console.log('Email Service: AWS SDK SES Client initialized (Using API/Port 443)');
    }

    /**
     * Generic send email method using AWS SDK
     */
    async sendEmail(options) {
        try {
            // We use nodemailer to BUILD the RFC822 message (it handles attachments/iCal easily)
            // But we do NOT provide SMTP transport settings here.
            const transporter = nodemailer.createTransport({
                SES: { ses: this.sesClient, aws: { SendRawEmailCommand } }
            });

            const mailOptions = {
                from: '"CapsuleCabs" <no-reply@capsulecabs.com>',
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: []
            };

            // Add QR Code Attachment
            if (options.qrBuffer) {
                mailOptions.attachments.push({
                    filename: 'ticket-qr.png',
                    content: options.qrBuffer,
                    cid: 'qrimage' // Matches <img src="cid:qrimage">
                });
            }

            // Add iCal Event
            if (options.icalEvent) {
                mailOptions.attachments.push({
                    filename: options.icalEvent.filename,
                    content: options.icalEvent.content,
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST'
                });

                mailOptions.alternatives = [{
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST',
                    content: options.icalEvent.content
                }];
            }

            // Send via AWS SDK
            const result = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully via SDK. MessageId:', result.messageId);
            return result;
        } catch (error) {
            console.error('AWS SDK Send Error:', error);
            throw new Error(`Email could not be sent: ${error.message}`);
        }
    }

    /**
     * Method to send booking confirmation
     */
    async sendBookingEmail(userEmail, bookingDetails) {
        try {
            // 1. Generate QR Code
            const qrData = `https://capsulecabs.com/verify/${bookingDetails.bookingId}`;
            const qrCodeBase64 = await QRCode.toDataURL(qrData, {
                color: { dark: '#9dec75', light: '#000000' },
                margin: 1,
                width: 300
            });

            const qrImageBuffer = Buffer.from(qrCodeBase64.split(',')[1], 'base64');

            // 2. Load Template
            const templatePath = path.join(__dirname, '../templates/booking-email.html');
            if (!fs.existsSync(templatePath)) throw new Error("Email template not found");
            
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

            // 3. Inject Placeholders
            Object.keys(placeholders).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                html = html.replace(regex, placeholders[key] || '');
            });

            // 4. Create Calendar Event
            const calendar = ical({ name: 'CapsuleCabs Trip' });
            calendar.createEvent({
                start: travelDate,
                end: new Date(travelDate.getTime() + 4 * 60 * 60 * 1000),
                summary: `Trip to ${bookingDetails.destination}`,
                description: `Ticket ID: ${bookingDetails.bookingId}`,
                location: bookingDetails.pickupPoint,
                method: 'REQUEST'
            });

            // 5. Send with SDK
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
                qrBuffer: qrImageBuffer
            });
        } catch (error) {
            console.error('Booking Email Service Error:', error);
            throw error;
        }
    }
}

export default new EmailService();