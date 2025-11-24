import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
const { genSalt, hash, compare } = bcrypt;

const userSchema = new Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
  },
  email: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['passenger', 'operator', 'admin', 'driver'],
    default: 'passenger'
  },
  profileImage: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: [0, 'Wallet balance cannot be negative']
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi', 'te', 'ta', 'bn'],
      default: 'en'
    },
    notifications: {
      sms: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR'
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pinCode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  refreshToken: {
    token: { type: String },
    expiresAt: { type: Date }
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  phoneVerificationToken: {
    type: String,
    select: false
  },
  phoneVerificationExpires: {
    type: Date,
    select: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ refreshToken: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  console.log('🔍 Pre-save hook triggered');
  console.log('🔍 Password modified:', this.isModified('password'));
  console.log('🔍 Password value:', this.password);
  console.log('🔍 Password type:', typeof this.password);
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await genSalt(12);
    this.password = await hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await compare(candidatePassword, this.password);
};

// Generate phone verification token
userSchema.methods.generatePhoneVerificationToken = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneVerificationToken = otp;
  this.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetToken = resetToken;
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Add to wallet
userSchema.methods.addToWallet = function(amount) {
  this.walletBalance += amount;
  return this.save({ validateBeforeSave: false });
};

// Deduct from wallet
userSchema.methods.deductFromWallet = function(amount) {
  if (this.walletBalance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  this.walletBalance -= amount;
  return this.save({ validateBeforeSave: false });
};

export default model('User', userSchema);