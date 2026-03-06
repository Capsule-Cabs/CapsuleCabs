import { Schema, model } from 'mongoose';

const phonePePaymentSchema = new Schema(
  {
    // Link to user (optional but recommended)
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Basic info
    phone: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Merchant order id you send to PhonePe
    merchantOrderId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },

    // Data returned from PhonePe when creating order
    phonePeOrderId: {
      type: String,
      index: true,
    },
    phonePeToken: {
      type: String,
    },

    // Status tracking
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    statusReason: {
      type: String,
    },

    // Raw payloads for debugging/audit
    requestPayload: {
      type: Schema.Types.Mixed,
    },
    phonePeResponse: {
      type: Schema.Types.Mixed,
    },
    lastStatusResponse: {
      type: Schema.Types.Mixed,
    },

    // Meta info you are already sending
    metaInfo: {
      udf1: String,
      udf2: Date,
    },

    // Additional fields
    paymentMode: {
      type: String,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    pendingBookingData: {
        type: Object,
        required: true
    },
    bookingRefId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking'
    },
    bookingId: {
        type: String,
    } 
  },
  {
    timestamps: true,
  }
);

export default model('PhonePePayment', phonePePaymentSchema);
