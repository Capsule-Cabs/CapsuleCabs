import { Router } from 'express';
import express from 'express';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import config from '../config/config.js';

const router = Router();

// Cache for OAuth token
let cachedToken = { token: null, expiry: 0 };

async function getAccessToken() {
    const currentTime = Date.now();
    if (cachedToken.token && currentTime < cachedToken.expiry) {
        return cachedToken.token;
    }

    const tokenUrl = "https://accounts.zoho.in/oauth/v2/token";
    const params = new URLSearchParams();
    params.append('refresh_token', config.zoho_refresh_token);
    params.append('client_id', config.zoho_client_id);
    params.append('client_secret', config.zoho_client_secret);
    params.append('grant_type', 'refresh_token');

    try {
        const response = await axios.post(tokenUrl, params);
        // Access tokens usually last 3600 seconds. Buffer by 5 mins.
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
 * This returns the session_id you need for the Frontend Widget
 */
router.post('/create-payment-session', asyncHandler(async (req, res) => {
    const { amount, currency, description } = req.body;
    const token = await getAccessToken();

    const url = `https://payments.zoho.in/api/v1/payment_sessions`;
    const accountId = "zohopaysandbox.60065063065";
    console.log('TOKEN: ', token);
    try {
        const response = await axios.post(url, {
            amount: amount,
            currency: currency || 'INR',
            description: description || 'Order Payment'
        }, {
            params: { account_id: accountId },
            headers: { 
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // SUCCESS: Send the payment_session_id to the frontend
        res.status(200).json(response.data);

    } catch (error) {
        console.error("ZOHO ERROR:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data);
    }
}));

/**
 * 2. WEBHOOK HANDLER
 * Critical: Use express.raw({type: 'application/json'}) in your main app.js for this path!
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const signatureHeader = req.headers['x-zoho-webhook-signature'];
    
    if (!signatureHeader) return res.status(401).send('Missing Signature');

    // Zoho signature format: t=1734340423138,v=48f9cb56...
    const parts = signatureHeader.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const receivedSignature = parts.find(p => p.startsWith('v='))?.split('=')[1];

    if (!timestamp || !receivedSignature) return res.status(401).send('Invalid Signature Format');

    const payload = req.body.toString('utf-8');
    
    // Preparation: Combine timestamp and payload with a dot
    const signedPayload = `${timestamp}.${payload}`;

    const hmac = crypto.createHmac('sha256', config.zoho_webhook_secret);
    const expectedSignature = hmac.update(signedPayload).digest('hex');

    // Verify authenticity
    if (receivedSignature !== expectedSignature) {
        console.error("Webhook Verification Failed");
        return res.status(401).send('Unauthorized');
    }

    const event = JSON.parse(payload);
    
    // Handle specific events
    if (event.event_type === 'payment.succeeded') {
        const paymentData = event.event_object.payment; // Note the object structure
        console.log(`Payment Success: ${paymentData.payment_id}`);
        // UPDATE YOUR DATABASE HERE
    }

    res.status(200).send('OK');
});

export default router;