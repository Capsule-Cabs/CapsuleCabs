import dotenv from 'dotenv';
dotenv.config();

export default {
    paymentUrl: process.env.PHONE_PE_PAYMENT_URL,
    client_id: process.env.PHONE_PE_CLIENT_ID,
    client_version: process.env.PHONE_PE_VERSION,
    client_secret: process.env.PHONE_PE_CLIENT_SECRET
}