import dotenv from 'dotenv';
dotenv.config();

export default {
    paymentUrl: process.env.PHONE_PE_PAYMENT_URL,
    client_id: process.env.PHONE_PE_CLIENT_ID,
    client_version: process.env.PHONE_PE_VERSION,
    client_secret: process.env.PHONE_PE_CLIENT_SECRET,
    phonePe_redirectURL: process.env.PHONE_PE_REDIRECT_URL,
    sms_api_key: process.env.DLT_API_KEY,
    trip_confirm_key: process.env.CPSLGO_ID,
    trip_confirm_value: process.env.CPSLGO_VALUE,
    otp_key: process.env.OTP_KEY,
    otp_value: process.env.OTP_VALUE,
    zoho_token_url: process.env.ZOHO_API_BASE_TOKEN_URL,
    zoho_refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    zoho_client_id: process.env.ZOHO_CLIENT_ID,
    zoho_client_secret: process.env.ZOHO_CLIENT_SECRET,
    zoho_account_id: process.env.ZOHO_ACCOUNT_ID,
    trip_sequences: {
        "AGRA-GUR-TRIP": ["Agra", "Mathura", "Gurugram"]
    },
    smtp_creds: {
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD
    }
}