import { Router } from 'express';
const router = Router();
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import User from '../models/user.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
const { generateToken, generateRefreshToken, protect } = authMiddleware;
import { ApiResponse } from '../utils/apiResponse.js';
import { sendSMS } from '../services/notificationService.js';
import { cacheService } from '../config/redis.js';
import { info, error as _error } from '../utils/logger.js';
import asyncHandler from 'express-async-handler';

// Rate limiting for sensitive auth operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 OTP requests per 5 minutes
  message: 'Too many OTP requests from this IP, please try again after 5 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateSendOTP = [
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
];

const validateVerifyOTP = [
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
];

const validateRegister = [
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      ApiResponse.error('Validation failed', 400, 'VALIDATION_ERROR', errors.array())
    );
  }
  next();
};

// @desc    Send OTP to phone number
// @route   POST /api/v1/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { phone, type = 'login' } = req.body;

    // Check if phone exists for login, or doesn't exist for registration
    const existingUser = await User.findOne({ phone });

    if (type === 'login' && !existingUser) {
      return res.status(404).json(
        ApiResponse.error('User not found. Please register first.', 404, 'USER_NOT_FOUND')
      );
    }

    if (type === 'register' && existingUser) {
      return res.status(409).json(
        ApiResponse.error('User already exists. Please login instead.', 409, 'USER_EXISTS')
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in cache
    const otpKey = `otp:${phone}`;
    await cacheService.set(otpKey, {
      otp,
      phone,
      type,
      createdAt: new Date(),
      expiresAt: otpExpiry,
      attempts: 0
    }, 600); // 10 minutes

    // Send OTP via SMS
    const message = `Your Seat Selekta Pro verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    
    try {
      await sendSMS(phone, message);
      info(`OTP sent to phone: ${phone}`);
    } catch (smsError) {
      _error('SMS sending failed:', smsError);
      // In development, don't fail the request if SMS fails
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json(
          ApiResponse.error('Failed to send OTP. Please try again.', 500, 'SMS_FAILED')
        );
      }
    }

    res.status(200).json(
      ApiResponse.success({
        message: 'OTP sent successfully',
        expiresIn: 600,
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      }, 'OTP sent successfully')
    );
  } catch (error) {
    _error('Send OTP error:', error);
    res.status(500).json(
      ApiResponse.error('Server error while sending OTP', 500, 'SERVER_ERROR')
    );
  }
};

// @desc    Verify OTP and authenticate/register user
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, userData } = req.body;

    // Get OTP from cache
    const otpKey = `otp:${phone}`;
    const storedOTPData = await cacheService.get(otpKey);

    if (!storedOTPData) {
      return res.status(400).json(
        ApiResponse.error('OTP expired or invalid', 400, 'OTP_EXPIRED')
      );
    }

    // Check attempt limit
    if (storedOTPData.attempts >= 3) {
      await cacheService.del(otpKey);
      return res.status(429).json(
        ApiResponse.error('Too many invalid attempts. Please request a new OTP.', 429, 'TOO_MANY_ATTEMPTS')
      );
    }

    // Verify OTP
    if (storedOTPData.otp !== otp) {
      // Increment attempts
      storedOTPData.attempts += 1;
      await cacheService.set(otpKey, storedOTPData, 600);
      
      return res.status(400).json(
        ApiResponse.error(
          `Invalid OTP. ${3 - storedOTPData.attempts} attempts remaining.`, 
          400, 
          'INVALID_OTP'
        )
      );
    }

    // OTP is valid, clear from cache
    await cacheService.del(otpKey);

    let user;
    let isNewUser = false;

    if (storedOTPData.type === 'register') {
      // Create new user
      if (!userData || !userData.firstName || !userData.lastName) {
        return res.status(400).json(
          ApiResponse.error('User data is required for registration', 400, 'USER_DATA_REQUIRED')
        );
      }

      user = new User({
        phone,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email?.trim(),
        isVerified: true,
        preferences: userData.preferences || {}
      });

      await user.save();
      isNewUser = true;
      info(`New user registered: ${user._id}`);
    } else {
      // Login existing user
      user = await User.findOne({ phone });
      
      if (!user) {
        return res.status(404).json(
          ApiResponse.error('User not found', 404, 'USER_NOT_FOUND')
        );
      }

      // Update verification status and last login
      user.isVerified = true;
      await user.updateLastLogin();
    }

    // Generate tokens
    const tokenPayload = { 
      id: user._id, 
      phone: user.phone, 
      role: user.role 
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Remove sensitive data from response
    const userResponse = {
      _id: user._id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
      walletBalance: user.walletBalance,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.status(200).json(
      ApiResponse.success({
        user: userResponse,
        accessToken,
        refreshToken,
        isNewUser,
        expiresIn: process.env.JWT_EXPIRE
      }, isNewUser ? 'Registration successful' : 'Login successful')
    );

  } catch (error) {
    _error('Verify OTP error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json(
        ApiResponse.error('User with this phone number already exists', 409, 'USER_EXISTS')
      );
    }
    
    res.status(500).json(
      ApiResponse.error('Server error during authentication', 500, 'SERVER_ERROR')
    );
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json(
        ApiResponse.error('Refresh token is required', 401, 'REFRESH_TOKEN_REQUIRED')
      );
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Find user with this refresh token
      const user = await User.findOne({ 
        _id: decoded.id, 
        refreshToken,
        isActive: true 
      });

      if (!user) {
        return res.status(401).json(
          ApiResponse.error('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN')
        );
      }

      // Generate new tokens
      const tokenPayload = { 
        id: user._id, 
        phone: user.phone, 
        role: user.role 
      };

      const newAccessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      // Update refresh token in database
      user.refreshToken = newRefreshToken;
      await user.save({ validateBeforeSave: false });

      res.status(200).json(
        ApiResponse.success({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRE
        }, 'Token refreshed successfully')
      );

    } catch (tokenError) {
      _error('Refresh token verification failed:', tokenError);
      return res.status(401).json(
        ApiResponse.error('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')
      );
    }

  } catch (error) {
    _error('Refresh token error:', error);
    res.status(500).json(
      ApiResponse.error('Server error during token refresh', 500, 'SERVER_ERROR')
    );
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Clear refresh token from database
    await User.findByIdAndUpdate(req.user._id, {
      refreshToken: null
    });

    res.status(200).json(
      ApiResponse.success({}, 'Logged out successfully')
    );
  } catch (error) {
    _error('Logout error:', error);
    res.status(500).json(
      ApiResponse.error('Server error during logout', 500, 'SERVER_ERROR')
    );
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    
    res.status(200).json(
      ApiResponse.success(user, 'User profile retrieved successfully')
    );
  } catch (error) {
    _error('Get me error:', error);
    res.status(500).json(
      ApiResponse.error('Server error while fetching profile', 500, 'SERVER_ERROR')
    );
  }
};

// @desc    Change password (for users who set password)
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check if user has a password set
    if (!user.password) {
      return res.status(400).json(
        ApiResponse.error('Password not set. Use OTP authentication.', 400, 'NO_PASSWORD_SET')
      );
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json(
        ApiResponse.error('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD')
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json(
      ApiResponse.success({}, 'Password changed successfully')
    );
  } catch (error) {
    _error('Change password error:', error);
    res.status(500).json(
      ApiResponse.error('Server error while changing password', 500, 'SERVER_ERROR')
    );
  }
};
/**
 * @desc    Register new user via OTP verification
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  console.log('BODY: ', req?.body);
  const { phone, firstName, lastName, email, password, role } = req.body;
  // OTP verified earlier
  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ phone, firstName, lastName, email, isVerified: true, password, role });
  } else {
    return res.status(409).json({
      success: false,
      message: 'User already exist with this phone number. Please login instead.',
      errCode: 'USER _ALREADY_EXISTS'
    });
  }
  // Generate tokens
  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  console.log('Registered User: ', user);
  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});
/**
 * @desc    Login user via OTP verification
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (!user) throw new Error('User not found, please register');
  // Mark verified
  user.isVerified = true;
  await user.save({ validateBeforeSave: false });
  // Generate tokens
  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  res.json({
    success: true,
    data: { accessToken, refreshToken }
  });
});


// Routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', otpLimiter, validateSendOTP, handleValidationErrors, sendOTP);
router.post('/verify-otp', authLimiter, validateVerifyOTP, handleValidationErrors, verifyOTP);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], handleValidationErrors, changePassword);

export default router;