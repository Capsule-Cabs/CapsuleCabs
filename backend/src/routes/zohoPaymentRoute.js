import { Router } from 'express';
import express from 'express';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import config from '../config/config.js';
import ZohoPayment from '../models/zohoPayment.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { createInternalBooking } from './bookingRoutes.js';
import authMiddleware from '../middleware/auth.middleware.js'; // Import auth middleware
const { protect } = authMiddleware;

const router = Router();

// Cache for OAuth token
let cachedToken = { token: null, expiry: 0 };

/**
 * IDEMPOTENT HELPER: processZohoPayment
 * Aligned with PhonePe logic: uses (user, payload, paymentId)
 */
const processZohoPayment = async (paymentSessionId, statusData) => {
    const zohoStatus = statusData.status || statusData.state;
    const isSuccess = zohoStatus === 'succeeded';

    // 1. Find and Update with populated user
    const paymentRecord = await ZohoPayment.findOneAndUpdate(
        { 
            paymentSessionId,
            status: { $ne: 'succeeded' } 
        },
        {
            $set: {
                status: isSuccess ? 'succeeded' : 'failed',
                paymentId: statusData.payment_id,
                webhookData: statusData
            }
        },
        { new: true }
    ).populate('user'); // Matches schema requirement

    if (!paymentRecord) {
        return await ZohoPayment.findOne({ paymentSessionId }).populate('user');
    }

    if (paymentRecord.status === 'succeeded' && paymentRecord.bookingId) {
        return paymentRecord;
    }

    // 2. Trigger Booking Logic (Identical argument structure to PhonePe)
    if (isSuccess && paymentRecord.pendingBookingData) {
        try {
            if (!paymentRecord.user) {
                throw new Error('Payment record has no associated User ID');
            }

            // Matches PhonePe pattern: (UserObject, BookingPayload, GatewayID)
            const newBooking = await createInternalBooking(
                paymentRecord.user,
                paymentRecord.pendingBookingData,
                paymentRecord.paymentId || paymentSessionId
            );

            paymentRecord.bookingId = newBooking.bookingId;
            paymentRecord.bookingRefId = newBooking._id;
            await paymentRecord.save();

            console.log(`[ZOHO] Booking ${newBooking.bookingId} created successfully.`);
        } catch (error) {
            console.error("[CRITICAL ERROR] Zoho Booking failed:", error.message);
        }
    }

    return paymentRecord;
};

async function getAccessToken() {
    const currentTime = Date.now();
    if (cachedToken.token && currentTime < cachedToken.expiry) {
        return cachedToken.token;
    }

    const tokenUrl = config.zoho_token_url;
    const params = new URLSearchParams();
    params.append('refresh_token', config.zoho_refresh_token);
    params.append('client_id', config.zoho_client_id);
    params.append('client_secret', config.zoho_client_secret);
    params.append('grant_type', 'refresh_token');
    params.append('soid', 'zohopaysandbox.60065063065');

    try {
        const response = await axios.post(tokenUrl, params);
        cachedToken = {
            token: response.data.access_token,
            expiry: Date.now() + (response.data.expires_in - 300) * 1000
        };
        return cachedToken.token;
    } catch (error) {
        console.error("Error refreshing Zoho Token:", error.response?.data || error.message);
        throw new Error("Failed to authenticate with Zoho");
    }
}

/**
 * 1. CREATE PAYMENT SESSION
 * UPDATED: Now requires 'protect' and saves 'user' + 'bookingPayload'
 */
router.post('/create-payment-session', protect, asyncHandler(async (req, res) => {
    const { amount, currency, description, bookingPayload } = req.body; // Extract bookingPayload
    const token = await getAccessToken();

    const url = `${config.zoho_api_base_url}/paymentsessions`;
    const numericAccountId = config?.zoho_account_id;

    try {
        const response = await axios.post(url, {
            amount: amount,
            currency: currency || 'INR',
            description: description || 'Order Payment'
        }, {
            params: { account_id: numericAccountId },
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const sessionData = response.data.payments_session;

        // FIXED: Aligning with required fields in zohoPayment.model.js
        await ZohoPayment.create({
            user: req.user._id, // Required by schema
            paymentSessionId: sessionData.payments_session_id,
            amount: sessionData.amount,
            currency: sessionData.currency,
            description: sessionData.description,
            status: 'initiated',
            pendingBookingData: bookingPayload // Stored for later booking creation
        });

        res.status(200).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data);
    }
}));

/**
 * 2. VERIFY PAYMENT (HANDSHAKE)
 */
router.post('/verify-payment', protect, asyncHandler(async (req, res) => {
    const { payment_id, payments_session_id, signature } = req.body;

    const payload = `${payment_id}|${payments_session_id}`;
    const expectedSignature = crypto.createHmac('sha256', config.zoho_signing_key)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

    const token = await getAccessToken();
    const response = await axios.get(`${config.zoho_api_base_url}/payments/${payment_id}`, {
        params: { account_id: config.zoho_account_id },
        headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });

    const updatedPayment = await processZohoPayment(payments_session_id, response.data.payment);

    res.json({
        success: updatedPayment.status === 'succeeded',
        status: updatedPayment.status,
        bookingId: updatedPayment.bookingId,
        data: updatedPayment
    });
}));

/**
 * 3. WEBHOOK HANDLER
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signatureHeader = req.headers['x-zoho-webhook-signature'];
    if (!signatureHeader) return res.status(401).send('Missing Signature');

    const parts = signatureHeader.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const receivedSignature = parts.find(p => p.startsWith('v='))?.split('=')[1];

    if (!timestamp || !receivedSignature) return res.status(401).send('Invalid Signature Format');

    const payload = req.body.toString('utf-8');
    const signedPayload = `${timestamp}.${payload}`;

    const hmac = crypto.createHmac('sha256', config.zoho_webhook_secret);
    const expectedSignature = hmac.update(signedPayload).digest('hex');

    if (receivedSignature !== expectedSignature) {
        return res.status(401).send('Unauthorized');
    }

    const event = JSON.parse(payload);

    if (event.event_type === 'payment.succeeded' || event.event_type === 'payment.failed') {
        const paymentData = event.event_object.payment;
        await processZohoPayment(paymentData.payments_session_id, paymentData);
    }

    res.status(200).send('OK');
});

export default router;