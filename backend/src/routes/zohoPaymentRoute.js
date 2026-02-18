import { Router } from 'express';
import express from 'express'; 
import crypto from 'crypto'; 
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import https from 'https';
import config from '../config/config.js';

const router = Router();

// Used for local dev if self-signed certs are involved
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

let cachedToken = { token: null, expiry: 0 };

async function getAccessToken() {
    const currentTime = Date.now();
    if (cachedToken.token && currentTime < cachedToken.expiry) {
        return cachedToken.token;
    }

    // 1. Ensure the URL is just the endpoint
    const tokenUrl = "https://accounts.zoho.in/oauth/v2/token"; 

    // 2. Move parameters into the body (Form Data)
    const params = new URLSearchParams();
    params.append('refresh_token', config.zoho_refresh_token);
    params.append('client_id', config.zoho_client_id);
    params.append('client_secret', config.zoho_client_secret);
    params.append('grant_type', 'refresh_token');

    try {
        // 3. POST params in the body, NOT the URL
        const response = await axios.post(tokenUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, expires_in } = response.data;
        
        if (!access_token) {
            throw new Error("Zoho did not return an access token: " + JSON.stringify(response.data));
        }

        cachedToken = { 
            token: access_token, 
            expiry: currentTime + (expires_in - 300) * 1000 
        };
        return access_token;
    } catch (error) {
        // This will now show the actual JSON error from Zoho instead of an HTML page
        console.error("Zoho Auth Error:", error.response?.data || error.message);
        throw new Error("Failed to refresh Zoho Access Token");
    }
}

const createPaymentSession = asyncHandler(async (req, res) => {
    const { amount, currency, description, customer_details } = req.body;
    try {
        const accessToken = await getAccessToken();
        
        const response = await axios.post(
            `${process.env.ZOHO_API_BASE_URL}/paymentsessions`,
            {
                amount: amount.toString(), // Zoho expects string or double
                currency: currency || 'INR',
                description: description || 'Order Payment',
                customer_id: customer_details?.id // Optional
            },
            {
                params: { account_id: config.zoho_account_id },
                headers: { 
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Correct key: payments_session_id
        res.status(200).json({ 
            success: true,
            sessionId: response.data.payments_session_id 
        }); 
    } catch (error) {
        console.error("Session Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || "Session creation failed" });
    }
});

const zohoWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-zoho-signature'];
    
    // Ensure body is handled as a buffer then string for verification
    const bodyString = req.body.toString('utf-8');

    // Verification Logic
    const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
    const expectedSignature = hmac.update(bodyString).digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
        Buffer.from(signature || ""),
        Buffer.from(expectedSignature)
    );

    if (!isValid) {
        console.error("Invalid Webhook Signature detected.");
        return res.status(401).send('Unauthorized');
    }

    const event = JSON.parse(bodyString);
    
    // Handle the specific payment success event
    if (event.event_type === 'payment.succeeded') {
        const { payment_id, payments_session_id, amount } = event.data;
        console.log(`Payment Verified: ${payment_id} for Session: ${payments_session_id}`);
        
        // UPDATE YOUR DATABASE HERE
        // await MyPaymentModel.update({ status: 'paid' }, { where: { sessionId: payments_session_id } });
    }

    res.status(200).send('OK');
});

/**
 * ROUTES
 */

// IMPORTANT: Webhook must use express.raw to keep the signature valid
router.post('/webhook', express.raw({ type: 'application/json' }), zohoWebhook);

// Standard JSON route for frontend
router.post('/create-payment-session', createPaymentSession);

export default router;