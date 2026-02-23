import { Schema, model as _model } from 'mongoose';

const routeSchema = new Schema({
  routeCode: {
    type: String,
    required: [true, 'Route code is required'],
    unique: true,
    uppercase: true,
    match: [/^[A-Z0-9-]+$/, 'Route code must contain only uppercase letters, numbers, and hyphens']
  },
  tripId: {
    type: String,
    required: true,
    index: true
  },
  segmentStartOrder: { 
    type: Number,
    required: true
  },
  segmentEndOrder: {
    type: Number,
    required: true
  },
  operator: {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    licenseNumber: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  origin: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
      validate: {
        validator: function(v) {
          return v && v.length === 2;
        },
        message: 'Coordinates must be an array of [longitude, latitude]'
      }
    },
    pickupPoints: [{
      _id: false,
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      coordinates: {
        type: [Number],
      },
      landmark: String,
      contactNumber: String
    }]
  },
  destination: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
      validate: {
        validator: function(v) {
          return v && v.length === 2;
        },
        message: 'Coordinates must be an array of [longitude, latitude]'
      }
    },
    dropPoints: [{
      _id: false,
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      coordinates: {
        type: [Number],
      },
      landmark: String,
      contactNumber: String
    }]
  },
  vehicle: {
    vehicleType: {
      type: String,
      enum: ['ertiga-cab'],
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true
    },
    model: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      min: 2000,
      max: new Date().getFullYear() + 1
    },
    amenities: [{
      type: String,
      enum: ['wifi', 'ac', 'charging', 'meals', 'blanket', 'pillow', 'entertainment', 'water']
    }],
    images: [String], // URLs to vehicle images
    capacity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  seating: {
    layout: {
      type: String,
      enum: ['1x1', '1x2', '2x1', '2x2', '2x3'],
      required: true
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1
    },
    seatMap: [{
      _id: false,
      seatNumber: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['window', 'aisle', 'middle', 'back-seats'],
        required: true
      },
      position: {
        row: {
          type: Number,
          required: true,
          min: 1
        },
        column: {
          type: Number,
          required: true,
          min: 1
        },
        level: {
          type: String,
          enum: ['lower', 'upper'],
          default: 'lower'
        }
      },
      price: {
        base: {
          type: Number,
          required: true,
          min: 0
        },
        premium: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      isAccessible: {
        type: Boolean,
        default: false
      },
      isBlocked: {
        type: Boolean,
        default: false
      }
    }]
  },
  schedule: [{
    _id: false,
    departureTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Departure time must be in HH:MM format']
    },
    arrivalTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Arrival time must be in HH:MM format']
    },
    duration: {
      type: Number, // Duration in minutes
      required: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekdays', 'weekends', 'specific-dates'],
      required: true
    },
    activeDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    validFrom: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  pricing: {
    baseFare: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR'
    },
    taxes: [{
      _id: false,
      name: {
        type: String,
        required: true
      },
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      isApplicable: {
        type: Boolean,
        default: true
      }
    }],
    dynamicPricing: {
      enabled: {
        type: Boolean,
        default: false
      },
      peakMultiplier: {
        type: Number,
        default: 1.5,
        min: 1
      },
      lowDemandMultiplier: {
        type: Number,
        default: 0.8,
        min: 0.1
      }
    },
    discounts: [{
      _id: false,
      type: {
        type: String,
        enum: ['early-bird', 'student', 'senior-citizen', 'group', 'loyalty']
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },
  policies: {
    cancellation: {
      allowCancellation: {
        type: Boolean,
        default: true
      },
      cancellationRules: [{
        _id: false,
        timeBeforeDeparture: {
          type: Number, // Hours before departure
          required: true
        },
        refundPercentage: {
          type: Number,
          min: 0,
          max: 100,
          required: true
        }
      }]
    },
    modification: {
      allowModification: {
        type: Boolean,
        default: true
      },
      modificationFee: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    baggage: {
      allowance: {
        type: String,
        default: '20kg'
      },
      extraBaggageFee: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'under-maintenance'],
    default: 'active'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  analytics: {
    totalTrips: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    occupancyRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
routeSchema.index({ routeCode: 1 });
routeSchema.index({ 'origin.city': 1, 'destination.city': 1 });
routeSchema.index({ 'operator.operatorId': 1 });
routeSchema.index({ status: 1 });
routeSchema.index({ 'origin.coordinates': '2dsphere' });
routeSchema.index({ 'destination.coordinates': '2dsphere' });
routeSchema.index({ 'schedule.validFrom': 1, 'schedule.validUntil': 1 });

// Virtual for route display name
routeSchema.virtual('routeName').get(function() {
  return `${this.origin.city} to ${this.destination.city}`;
});

// Method to check if route is available on a specific date
routeSchema.methods.isAvailableOnDate = function(date) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  return this.schedule.some(schedule => {
    const isDateInRange = date >= schedule.validFrom && date <= schedule.validUntil;
    const isDayActive = schedule.frequency === 'daily' || 
                       (schedule.frequency === 'weekdays' && !['saturday', 'sunday'].includes(dayName)) ||
                       (schedule.frequency === 'weekends' && ['saturday', 'sunday'].includes(dayName)) ||
                       (schedule.frequency === 'specific-dates' && schedule.activeDays.includes(dayName));
    
    return isDateInRange && isDayActive && schedule.isActive;
  });
};

// Method to get available seats for a date
routeSchema.methods.getAvailableSeats = function(date) {
  // This would typically query the SeatAvailability collection
  // For now, return all seats as available
  return this.seating.seatMap.filter(seat => !seat.isBlocked);
};

// Method to calculate fare with dynamic pricing
routeSchema.methods.calculateFare = function(seatNumbers, date) {
  let totalFare = 0;
  
  seatNumbers.forEach(seatNumber => {
    const seat = this.seating.seatMap.find(s => s.seatNumber === seatNumber);
    if (seat) {
      let fare = seat.price.base;
      
      // Add premium if window seat
      if (seat.type === 'window') {
        fare += seat.price.premium;
      }
      
      // Apply dynamic pricing if enabled
      if (this.pricing.dynamicPricing.enabled) {
        // Simple demand-based pricing logic
        const daysUntilTravel = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilTravel < 1) {
          fare *= this.pricing.dynamicPricing.peakMultiplier;
        } else if (daysUntilTravel > 30) {
          fare *= this.pricing.dynamicPricing.lowDemandMultiplier;
        }
      }
      
      totalFare += fare;
    }
  });
  
  // Apply taxes
  let taxAmount = 0;
  this.pricing.taxes.forEach(tax => {
    if (tax.isApplicable) {
      taxAmount += (totalFare * tax.percentage) / 100;
    }
  });
  
  return {
    baseFare: totalFare,
    taxAmount,
    totalFare: totalFare + taxAmount
  };
};

export default _model('Route', routeSchema);