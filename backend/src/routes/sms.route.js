import { Router } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import smsService from '../services/sms.service.js';

const router = Router();

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

router.post('/sendOTP', sendOTP);
router.post('/sendConfirmationMessage', sendConfirmationMessage);

export default router;