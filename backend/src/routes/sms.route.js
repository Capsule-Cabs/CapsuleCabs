import { Router } from 'express';
import nodemailer from 'nodemailer';
import { ApiResponse } from '../utils/apiResponse.js';
import smsService from '../services/sms.service.js';

const router = Router();

const transporter = nodemailer.createTransport({
  host: "email-smtp.ap-south-1.amazonaws.com",
  port: 587,
  secure: false,
  auth: {
    user: 'AKIAQGSPTQNZECRQJF5C',
    pass: 'BDDj2R8T64hXfRepSMx+bHdhIPpjLozbEk+e/leEOTSM', 
  },
});

const sendOTP = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    const response = await smsService.sendOTP(mobileNumber, otp);

    console.log('OTP SMS RESPONSE:', response);
    res.json(ApiResponse.success(response));

  } catch (error) {
    console.error('OTP SMS ERROR:', error);
    res.status(500).json(
      ApiResponse.error({
        error: error?.message || 'Failed to send OTP sms'
      })
    );
  }
};

const sendConfirmationMessage = async (req, res) => {
  try {
    const response = await smsService.sendTripConfirmation(req.body);

    console.log('TRIP CONFIRMATION SMS RESPONSE:', response);
    res.json(ApiResponse.success(response));

  } catch (error) {
    console.error('TRIP CONFIRMATION SMS ERROR:', error);
    res.status(500).json(
      ApiResponse.error({
        error: error?.message || 'Failed to send trip confirmation sms'
      })
    );
  }
};

const sendEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(
        ApiResponse.error({ error: "Email and OTP are required" })
      );
    }

    const info = await transporter.sendMail({
      from: '"CapsuleCabs" <no-reply@capsulecabs.com>',
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP Code</h2>
        <p>Your verification code is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `,
    });

    console.log("EMAIL SENT:", info.messageId);

    res.json(
      ApiResponse.success({
        message: "Email sent successfully",
        messageId: info.messageId
      })
    );

  } catch (error) {
    console.error("EMAIL ERROR:", error);
    res.status(500).json(
      ApiResponse.error({
        error: error?.message || "Failed to send email"
      })
    );
  }
};

router.post('/sendOTP', sendOTP);
router.post('/sendConfirmationMessage', sendConfirmationMessage);
router.post('/sendEmail', sendEmail);

export default router;