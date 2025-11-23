import mongoose from 'mongoose';

const seatAvailabilitySchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  travelDate: {
    type: Date,
    required: true
  },
  seatsAvailable: [{
    _id: false,
    seatNumber: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'locked', 'booked', 'blocked'],
      default: 'available'
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lockedAt: Date,
    lockExpiry: Date,
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bookedAt: Date,
    bookingId: String,
    price: {
      type: Number,
      required: true,
      min: 0
    },
    seatType: {
      type: String,
      enum: ['window', 'aisle', 'middle', 'back-seats'],
      required: true
    }
  }],
  summary: {
    totalSeats: {
      type: Number,
      required: true
    },
    availableCount: {
      type: Number,
      default: 0
    },
    lockedCount: {
      type: Number,
      default: 0
    },
    bookedCount: {
      type: Number,
      default: 0
    },
    blockedCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound index for route and date
seatAvailabilitySchema.index({ routeId: 1, travelDate: 1 }, { unique: true });
seatAvailabilitySchema.index({ 'seatsAvailable.lockedBy': 1 });
seatAvailabilitySchema.index({ 'seatsAvailable.lockExpiry': 1 });

// Method to lock seats
seatAvailabilitySchema.methods.lockSeats = async function(seatNumbers, userId, lockDurationMinutes = 15) {
  const lockExpiry = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
  
  // Check if seats are available
  const unavailableSeats = [];
  seatNumbers.forEach(seatNumber => {
    const seat = this.seatsAvailable.find(s => s.seatNumber === seatNumber);
    if ((!seat || seat.status !== 'available') && !seat.lockedBy.equals(userId)) {
      unavailableSeats.push(seatNumber);
    }
  });
  
  if (unavailableSeats.length > 0) {
    throw new Error(`Seats ${unavailableSeats.join(', ')} are not available`);
  }
  
  // Lock the seats
  seatNumbers.forEach(seatNumber => {
    const seat = this.seatsAvailable.find(s => s.seatNumber === seatNumber);
    if (seat) {
      seat.status = 'locked';
      seat.lockedBy = userId;
      seat.lockedAt = new Date();
      seat.lockExpiry = lockExpiry;
    }
  });
  
  // Update counts
  this.summary.lockedCount += seatNumbers.length;
  this.summary.availableCount -= seatNumbers.length;
  
  await this.save();
  return { success: true, lockExpiry };
};

// Method to confirm booking (convert locked to booked)
seatAvailabilitySchema.methods.confirmBooking = async function(seatNumbers, userId, bookingId) {
  console.log('Seats Available: ', this.seatsAvailable);
  const lockedSeats = this.seatsAvailable.filter(
    s => seatNumbers.includes(s.seatNumber) && 
        s.status === 'locked' && 
        s.lockedBy.toString() === userId.toString()
  );
  console.log('Locked Seats: ', lockedSeats);
  
  if (lockedSeats.length !== seatNumbers.length) {
    throw new Error('Some seats are not properly locked by this user');
  }
  
  // Convert to booked
  lockedSeats.forEach(seat => {
    seat.status = 'booked';
    seat.bookedBy = userId;
    seat.bookedAt = new Date();
    seat.bookingId = bookingId;
    seat.lockedBy = undefined;
    seat.lockedAt = undefined;
    seat.lockExpiry = undefined;
  });
  
  // Update counts
  this.summary.bookedCount += seatNumbers.length;
  this.summary.lockedCount -= seatNumbers.length;
  
  await this.save();
  return { success: true };
};

// Method to release locks
seatAvailabilitySchema.methods.releaseLocks = async function(seatNumbers, userId = null) {
  let releasedCount = 0;
  
  this.seatsAvailable.forEach(seat => {
    if (seatNumbers.includes(seat.seatNumber) && 
        seat.status === 'locked' && 
        (!userId || seat.lockedBy.toString() === userId.toString())) {
      seat.status = 'available';
      seat.lockedBy = undefined;
      seat.lockedAt = undefined;
      seat.lockExpiry = undefined;
      releasedCount++;
    }
  });
  
  // Update counts
  this.summary.availableCount += releasedCount;
  this.summary.lockedCount -= releasedCount;
  
  if (releasedCount > 0) {
    await this.save();
  }
  
  return { success: true, releasedCount };
};

// Method to cancel booking (convert booked back to available)
seatAvailabilitySchema.methods.cancelBooking = async function(bookingId) {
  const bookedSeats = this.seatsAvailable.filter(
    s => s.bookingId === bookingId && s.status === 'booked'
  );
  
  if (bookedSeats.length === 0) {
    throw new Error('No booked seats found for this booking');
  }
  
  // Convert back to available
  bookedSeats.forEach(seat => {
    seat.status = 'available';
    seat.bookedBy = undefined;
    seat.bookedAt = undefined;
    seat.bookingId = undefined;
  });
  
  // Update counts
  this.summary.availableCount += bookedSeats.length;
  this.summary.bookedCount -= bookedSeats.length;
  
  await this.save();
  return { success: true, releasedSeats: bookedSeats.length };
};

// Static method to release expired locks
seatAvailabilitySchema.statics.releaseExpiredLocks = async function() {
  const now = new Date();
  
  const result = await this.updateMany(
    { 'seatsAvailable.lockExpiry': { $lt: now }, 'seatsAvailable.status': 'locked' },
    {
      $set: {
        'seatsAvailable.$.status': 'available',
        'seatsAvailable.$.lockedBy': null,
        'seatsAvailable.$.lockedAt': null,
        'seatsAvailable.$.lockExpiry': null
      }
    }
  );
  
  // Update counts for affected documents
  const expiredLockDocs = await this.find({
    'seatsAvailable': {
      $elemMatch: {
        lockExpiry: { $lt: now },
        status: 'locked'
      }
    }
  });
  
  for (const doc of expiredLockDocs) {
    const expiredSeats = doc.seatsAvailable.filter(
      s => s.lockExpiry && s.lockExpiry < now && s.status === 'locked'
    );
    
    if (expiredSeats.length > 0) {
      doc.summary.availableCount += expiredSeats.length;
      doc.summary.lockedCount -= expiredSeats.length;
      await doc.save();
    }
  }
  
  return result;
};

// Static method to initialize seat availability for a route and date
seatAvailabilitySchema.statics.initializeForRoute = async function(routeId, travelDate, routeData) {
  const existingAvailability = await this.findOne({ routeId, travelDate });
  
  if (existingAvailability) {
    return existingAvailability;
  }
  
  // Create new availability record
  const seatsAvailable = routeData.seating.seatMap.map(seat => ({
    seatNumber: seat.seatNumber,
    status: seat.isBlocked ? 'blocked' : 'available',
    price: seat.price.base + (seat.type === 'window' ? seat.price.premium : 0),
    seatType: seat.type
  }));
  
  const summary = {
    totalSeats: seatsAvailable.length,
    availableCount: seatsAvailable.filter(s => s.status === 'available').length,
    lockedCount: 0,
    bookedCount: 0,
    blockedCount: seatsAvailable.filter(s => s.status === 'blocked').length
  };
  
  const availability = new this({
    routeId,
    travelDate,
    seatsAvailable,
    summary
  });
  
  return await availability.save();
};

const SeatAvailability = mongoose.model('SeatAvailability', seatAvailabilitySchema);

export default SeatAvailability;