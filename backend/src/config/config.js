import dotenv from 'dotenv';
dotenv.config();

export default {
    paymentUrl: process.env.PHONE_PE_PAYMENT_URL,
    client_id: process.env.PHONE_PE_CLIENT_ID,
    client_version: process.env.PHONE_PE_VERSION,
    client_secret: process.env.PHONE_PE_CLIENT_SECRET,
    sms_api_key: process.env.DLT_API_KEY,
    trip_confirm_key: process.env.CPSLGO_KEY,
    trip_confirm_value: process.env.CPSLGO_VALUE,
    otp_key: process.env.OTP_KEY,
    otp_value: process.env.OTP_VALUE
}