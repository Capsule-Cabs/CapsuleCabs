import mongoose from 'mongoose';

const zohoPaymentSchema = new mongoose.Schema({
    // Add the user reference (Missing this causes your error)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentSessionId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'initiated' },
    // Store the booking payload here so it's available for the helper
    pendingBookingData: { type: Object }, 
    bookingId: { type: String },
    bookingRefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    webhookData: { type: Object }
}, { timestamps: true });

const ZohoPayment = mongoose.model('ZohoPayment', zohoPaymentSchema);
export default ZohoPayment;