import { Schema, model } from 'mongoose';

const bookingSchema = new Schema({
  bookingId: {
    type: String,
    unique: true,
    // required: true
  },
  user: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    name: {
      type: String,
      required: true
    }
  },
  route: {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    routeCode: {
      type: String,
      required: true
    },
    origin: {
      type: String,
      required: true
    },
    destination: {
      type: String,
      required: true
    },
    operatorName: {
      type: String,
      required: true
    },
    vehicleNumber: String
  },
  journey: {
    travelDate: {
      type: Date,
      required: true
    },
    departureTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    estimatedArrivalTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    }
  },
  passengers: [{
    _id: false,
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    phone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
    },
    seatNumber: {
      type: String,
      required: true
    },
    fare: {
      type: Number,
      required: true,
      min: 0
    },
    isChild: {
      type: Boolean,
      default: false
    },
    idProof: {
      type: {
        type: String,
        enum: ['aadhar', 'passport', 'driving-license', 'voter-id', 'pan']
      },
      number: String
    },
    pickupPoint: String,
    dropPoint: String,
  }],
  payment: {
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    baseFare: {
      type: Number,
      required: true,
      min: 0
    },
    taxes: {
      type: Number,
      default: 0,
      min: 0
    },
    convenienceFee: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'upi', 'netbanking', 'cash'],
      required: true
    },
    paymentId: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially-refunded'],
      default: 'pending'
    },
    paidAt: Date,
    refundDetails: {
      amount: {
        type: Number,
        min: 0
      },
      reason: String,
      processedAt: Date,
      refundId: String,
      status: {
        type: String,
        enum: ['initiated', 'processing', 'completed', 'failed']
      }
    },
    gateway: {
      name: {
        type: String,
        enum: ['stripe', 'razorpay', 'paytm', 'phonepe']
      },
      transactionId: String,
      gatewayOrderId: String
    }
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'no-show', 'in-transit'],
    default: 'confirmed'
  },
  cancellation: {
    cancelledAt: Date,
    reason: {
      type: String,
      enum: ['user-request', 'operator-cancelled', 'weather', 'technical-issue', 'route-suspended', 'other']
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    refundAmount: {
      type: Number,
      min: 0
    },
    cancellationFee: {
      type: Number,
      min: 0
    },
    notes: String
  },
  modifications: [{
    _id: false,
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: {
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    },
    reason: String
  }],
  notifications: {
    bookingConfirmation: {
      sms: {
        sent: {
          type: Boolean,
          default: false
        },
        sentAt: Date,
        messageId: String
      },
      email: {
        sent: {
          type: Boolean,
          default: false
        },
        sentAt: Date,
        messageId: String
      },
      push: {
        sent: {
          type: Boolean,
          default: false
        },
        sentAt: Date
      }
    },
    reminderSent: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    cancellationSent: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }
  },
  reviews: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    reviewedAt: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    platform: {
      type: String,
      enum: ['web', 'mobile-app', 'api', 'admin-panel']
    },
    source: {
      type: String,
      enum: ['direct', 'partner', 'affiliate']
    },
    referenceId: String, // For partner bookings
    bookingChannel: {
      type: String,
      enum: ['website', 'mobile-app', 'call-center', 'walk-in']
    }
  },
  specialRequests: [{
    _id: false,
    type: {
      type: String,
      enum: ['wheelchair-accessible', 'extra-baggage', 'child-seat', 'assistance', 'dietary', 'other']
    },
    description: String,
    status: {
      type: String,
      enum: ['requested', 'acknowledged', 'fulfilled', 'unavailable'],
      default: 'requested'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ 'user.userId': 1 });
bookingSchema.index({ 'route.routeId': 1 });
bookingSchema.index({ 'journey.travelDate': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ 'payment.paymentId': 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for total passengers
bookingSchema.virtual('totalPassengers').get(function() {
  return this.passengers.length;
});

// Virtual for seat numbers
bookingSchema.virtual('seatNumbers').get(function() {
  return this.passengers.map(p => p.seatNumber);
});

// Pre-save hook to generate booking ID
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingId) {
    // Generate booking ID: SB + YYYYMMDD + Random 6 digits
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.bookingId = `SB${dateStr}${randomNum}`;
    console.log('Booking ID: ', this.bookingId);
    
    // Ensure uniqueness
    const existingBooking = await this.constructor.findOne({ bookingId: this.bookingId });
    if (existingBooking) {
      const newRandomNum = Math.floor(100000 + Math.random() * 900000);
      this.bookingId = `SB${dateStr}${newRandomNum}`;
    }
  }
  next();
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  if (this.status !== 'confirmed') {
    return { allowed: false, reason: 'Booking is not in confirmed status' };
  }
  
  const now = new Date();
  const travelDateTime = new Date(this.journey.travelDate);
  const [hours, minutes] = this.journey.departureTime.split(':').map(Number);
  travelDateTime.setHours(hours, minutes);
  
  const hoursUntilDeparture = (travelDateTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilDeparture < 2) {
    return { allowed: false, reason: 'Cannot cancel booking less than 2 hours before departure' };
  }
  
  return { allowed: true, hoursUntilDeparture };
};

// Method to calculate cancellation fee
bookingSchema.methods.calculateCancellationFee = function() {
  const cancellationCheck = this.canBeCancelled();
  
  if (!cancellationCheck.allowed) {
    return { refundAmount: 0, cancellationFee: this.payment.totalAmount };
  }
  
  const hoursUntilDeparture = cancellationCheck.hoursUntilDeparture;
  let refundPercentage = 0;
  
  if (hoursUntilDeparture >= 48) {
    refundPercentage = 90; // 10% cancellation fee
  } else if (hoursUntilDeparture >= 24) {
    refundPercentage = 75; // 25% cancellation fee
  } else if (hoursUntilDeparture >= 4) {
    refundPercentage = 50; // 50% cancellation fee
  } else {
    refundPercentage = 0; // 100% cancellation fee
  }
  
  const refundAmount = Math.round((this.payment.totalAmount * refundPercentage) / 100);
  const cancellationFee = this.payment.totalAmount - refundAmount;
  
  return { refundAmount, cancellationFee, refundPercentage };
};

// Method to update booking status
bookingSchema.methods.updateStatus = async function(newStatus, reason = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add modification record
  this.modifications.push({
    modifiedAt: new Date(),
    changes: {
      field: 'status',
      oldValue: oldStatus,
      newValue: newStatus
    },
    reason: reason
  });
  
  return await this.save();
};

// Method to add passenger
bookingSchema.methods.addPassenger = function(passengerData) {
  this.passengers.push(passengerData);
  this.payment.totalAmount += passengerData.fare;
  return this.save();
};

// Method to remove passenger
bookingSchema.methods.removePassenger = function(seatNumber) {
  const passengerIndex = this.passengers.findIndex(p => p.seatNumber === seatNumber);
  if (passengerIndex > -1) {
    const passenger = this.passengers[passengerIndex];
    this.payment.totalAmount -= passenger.fare;
    this.passengers.splice(passengerIndex, 1);
    return this.save();
  }
  throw new Error('Passenger not found');
};

// Static method to find bookings by date range
bookingSchema.statics.findByDateRange = function(startDate, endDate, status = null) {
  const query = {
    'journey.travelDate': {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query).populate('user.userId route.routeId');
};

// Static method to get booking analytics
bookingSchema.statics.getAnalytics = function(routeId, dateRange = null) {
  const matchQuery = { 'route.routeId': routeId };
  
  if (dateRange) {
    matchQuery['journey.travelDate'] = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$payment.totalAmount' },
        totalPassengers: { $sum: { $size: '$passengers' } }
      }
    },
    {
      $group: {
        _id: null,
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            revenue: '$totalRevenue',
            passengers: '$totalPassengers'
          }
        },
        totalBookings: { $sum: '$count' },
        totalRevenue: { $sum: '$totalRevenue' },
        totalPassengers: { $sum: '$totalPassengers' }
      }
    }
  ]);
};

export default model('Booking', bookingSchema);