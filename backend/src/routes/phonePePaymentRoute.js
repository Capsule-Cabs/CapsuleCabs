import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
const { protect, authorize } = authMiddleware;
import { ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import https from 'https';
import config from '../config/config.js';
import PhonePePayment from '../models/payment.model.js';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import { createInternalBooking } from './bookingRoutes.js';


const { paymentUrl, client_id, client_version, client_secret } = config;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});


const router = Router();

const processSuccessfulPayment = async (merchantOrderId, statusData) => {
  const phonePeStatus = statusData?.status || statusData?.state || statusData?.data?.state;
  
  // 1. Map status to your internal enum
  let mappedStatus = (phonePeStatus === 'COMPLETED') ? 'SUCCESS' : (phonePeStatus === 'FAILED' ? 'FAILED' : 'PENDING');

  // 2. IDEMPOTENT UPDATE: Use .populate('user') to get full user details
  const paymentDoc = await PhonePePayment.findOneAndUpdate(
    { 
      merchantOrderId, 
      status: { $ne: 'SUCCESS' } 
    },
    { 
      $set: { 
        status: mappedStatus, 
        transactionId: statusData?.transactionId || statusData?.data?.transactionId 
      } 
    },
    { new: true }
  ).populate('user');
  // If record was already COMPLETED, fetch it with the user populated
  if (!paymentDoc) {
    return await PhonePePayment.findOne({ merchantOrderId }).populate('user');
  }

  console.log('Payment DOC: ', paymentDoc);

  // 3. TRIGGER BOOKING: Only if payment is successful and payload exists
  if (mappedStatus === 'SUCCESS' && paymentDoc.pendingBookingData) {
    try {
      // Check if booking already exists for this payment ID to prevent duplicates
      const existing = await Booking.findOne({ 'payment.paymentId': merchantOrderId });
      
      if (!existing) {
        if (!paymentDoc.user) {
          throw new Error("Payment record has no associated User ID");
        }

        // Call the shared helper from bookingRoutes.js
        const newBooking = await createInternalBooking(
          paymentDoc.user,           // Full user object
          paymentDoc.pendingBookingData, 
          merchantOrderId            // paymentId
        );
        console.log('NEW BOOKING: ', newBooking);
        // Link the booking ID back to the payment document
        paymentDoc.bookingRefId = newBooking._id;
        paymentDoc.bookingId = newBooking.bookingId;
        await paymentDoc.save();
        
        console.log(`[SYSTEM] Booking ${newBooking.bookingId} created successfully via payment process.`);
      }
    } catch (error) {
      // Log the error but don't crash the process (payment is already successful)
      console.error("[CRITICAL ERROR] Payment success but Booking failed:", error.message);
    }
  }
  
  return paymentDoc;
};

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
    const { amount, phone, merchantOrderId, bookingPayload } = req?.body;
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
          "redirectUrl": config?.phonePe_redirectURL
        }
      }
    };

    const authToken = await getOAuthToken();
    console.log('PAYLOAD: ', orderPayload);
    console.log('token: ', authToken);

    const response = await axios.post(
      `${paymentUrl}/checkout/v2/pay`,
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

    const phonePeData = response.data;

    // >>> DB LOGIC (no change to API response)
    await PhonePePayment.findOneAndUpdate(
      { merchantOrderId },
      {
        user: req.user?._id || undefined,
        phone,
        amount,
        merchantOrderId,
        phonePeOrderId: phonePeData?.orderId,
        phonePeToken: phonePeData?.token,
        status: 'PENDING',
        requestPayload: orderPayload,
        phonePeResponse: phonePeData,
        metaInfo: {
          udf1: phone,
          udf2: orderPayload.metaInfo.udf2,
        },
        paymentMode: 'PG_CHECKOUT',
        pendingBookingData: bookingPayload
      },
      { upsert: true, new: true }
    );
    // <<< DB LOGIC

    return res.json(
      ApiResponse.success(response.data, "Checkout link created")
    );

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


const createOrderForSDK = asyncHandler(async (req, res) => {
  try {
    const { amount, phone, merchantOrderId, bookingPayload } = req?.body;
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
      }
    };

    const authToken = await getOAuthToken();
    console.log('PAYLOAD for SDK: ', orderPayload);
    console.log('token: ', authToken);

    const response = await axios.post(
      `${paymentUrl}/checkout/v2/sdk/order`,
      orderPayload,
      {
        httpsAgent,
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${authToken}`
        }
      }
    );
    const phonePeData = response?.data;
    const sdkPayload = {
      orderId: phonePeData.orderId,
      merchantId: merchantOrderId,
      token: phonePeData.token,
      paymentMode: {
        type: "PAY_PAGE"
      }
    };

    const base64Request = Buffer.from(
      JSON.stringify(sdkPayload)
    ).toString("base64");

    // >>> DB LOGIC (no change to API response)
    await PhonePePayment.findOneAndUpdate(
      { merchantOrderId },
      {
        user: req.user?._id || undefined,
        phone,
        amount,
        merchantOrderId,
        phonePeOrderId: phonePeData?.orderId,
        phonePeToken: phonePeData?.token,
        status: 'PENDING',
        requestPayload: orderPayload,
        phonePeResponse: phonePeData,
        metaInfo: {
          udf1: phone,
          udf2: orderPayload.metaInfo.udf2,
        },
        paymentMode: 'PAY_PAGE',
        pendingBookingData: bookingPayload
      },
      { upsert: true, new: true }
    );
    // <<< DB LOGIC

    return res.json(
      ApiResponse.success({ request: base64Request }, "Checkout data generated")
    );

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
  const { merchantOrderId } = req.params;
  const authToken = await getOAuthToken();
  const response = await axios.get(
    `${paymentUrl}/checkout/v2/order/${merchantOrderId}/status`,
    { httpsAgent, headers: { Authorization: `O-Bearer ${authToken}` } }
  );

  // Note: For polling, the bookingPayload might be stored in the Payment model 
  // during the initial "createOrder" step so it's available here.
  const updatedDoc = await processSuccessfulPayment(merchantOrderId, response.data);
  console.log("Updated DOC: ", updatedDoc);
  return res.json(ApiResponse.success({
    state: updatedDoc.status,
    bookingId: updatedDoc.bookingId, // Pass this back to frontend
    ...response.data
  }, "Status synced"));
});

const paymentDetailsFromWebhook = asyncHandler(async (req, res) => {
  const base64Response = req.body.response;
  const decodedString = Buffer.from(base64Response, 'base64').toString('utf-8');
  const paymentData = JSON.parse(decodedString);

  console.log('Webhook Received:', paymentData);

  // Call the SAME idempotent helper
  await processSuccessfulPayment(paymentData.data.merchantOrderId, paymentData.data);

  // Always return 200 to PhonePe
  return res.status(200).send('OK');
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
router.post('/createOrder', protect, createOrder);
router.get('/orderStatus/:merchantOrderId', protect, fetchPaymentStatus);

router.post('/createOrderForSDK', protect, createOrderForSDK);

// Webhook
router.post('/paymentWebhook', protect, paymentDetailsFromWebhook);

export default router; 