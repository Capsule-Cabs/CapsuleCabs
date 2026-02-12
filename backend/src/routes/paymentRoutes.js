import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
const { protect, authorize } = authMiddleware;
import { ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import https from 'https';
import config from '../config/config.js';

const { paymentUrl, client_id, client_version, client_secret } = config;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});


const router = Router();

const getOAuthToken = async () => {

  const params = new URLSearchParams({
    client_id,
    client_version,
    client_secret,
    grant_type: "client_credentials"
  });

  const response = await axios.post(
    `${paymentUrl}/v1/oauth/token`,
    params,
    {
      httpsAgent,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  return response.data.access_token;
};

const fetchOAuthToken = asyncHandler(async (req, res) => {
  try {
    const token = await getOAuthToken();

    return res.json(
      ApiResponse.success({ access_token: token })
    );
  } catch (error) {
    return res.status(500).json(ApiResponse.error({
      message: error?.message,
    }, 'Failed to process payment'));
  }
});

const createOrder = asyncHandler(async (req, res) => {
  try {
    const { amount, phone, merchantOrderId } = req?.body;
    if (!amount) {
      return res.status(500).json(
        ApiResponse.error("PhonePe credentials not configured")
      );
    }

    const orderPayload = {
      "merchantOrderId": merchantOrderId,
      "amount": amount,
      "expireAfter": 1200,
      "metaInfo": {
        "udf1": phone,
        "udf2": new Date()
      },
      "paymentFlow": {
        "type": "PG_CHECKOUT",
        "message": "Collecting payment for ticket booking",
        "merchantUrls": {
          "redirectUrl": "http://localhost:8080/booking-status"
        }
      }
    };

    const authToken = await getOAuthToken();
    console.log('PAYLOAD: ', orderPayload);
    console.log('token: ', authToken);

    const response = await axios.post(`${paymentUrl}/checkout/v2/pay`,
      orderPayload,
      {
        httpsAgent,
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${authToken}`
        }
      }
    );
    console.log("Response: ", response);
    return res.json(
      ApiResponse.success(response.data, "Checkout link created")
    )

  } catch (error) {
    console.log(
      "PhonePe Checkout Error:",
      error?.response?.data || error.message
    );

    return res.status(500).json(
      ApiResponse.error(
        error?.response?.data || error.message,
        "PhonePe checkout failed"
      )
    );
  }
});

const fetchPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { merchantOrderId } = req?.body;
    if(!merchantOrderId) {
      return res.status(500).json(
        ApiResponse.error("Merchant OrderId is required")
      );
    }
    const authToken = await getOAuthToken();
    console.log('token: ', authToken);

    const response = await axios.get(`${paymentUrl}/checkout/v2/order/${merchantOrderId}/status`, {
        httpsAgent,
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${authToken}`
        }
      });
    console.log('Payment Status Response: ', response);

    return res.json(
      ApiResponse.success(response.data, "Payment Status")
    );

  } catch (error) {
    console.log(
      "Payment Status error: ",
      error?.response?.data || error.message
    );

    return res.status(500).json(
      ApiResponse.error(
        error?.response?.data || error.message,
        "PhonePe payment status failed."
      )
    );
  }
});


// @desc    Get payment history
// @route   GET /api/v1/payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Placeholder - implement actual payment logic
    res.json(ApiResponse.success([], 'Payment history retrieved successfully'));
  } catch (error) {
    res.status(500).json(ApiResponse.error('Failed to retrieve payment history'));
  }
});

// @desc    Process payment
// @route   POST /api/v1/payments
// @access  Private
router.post('/authToken', protect, fetchOAuthToken);
router.post('/createOrder', createOrder);
router.post('/orderStatus', fetchPaymentStatus);

export default router; 