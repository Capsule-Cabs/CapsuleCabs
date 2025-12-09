import express from 'express';
import { body, param, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';

import Booking from '../models/booking.model.js';
import Route from '../models/circuit.model.js';
import SeatAvailability from '../models/seat.model.js';
import User from '../models/user.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
const { protect, authorize } = authMiddleware;
import { ApiResponse } from '../utils/apiResponse.js';
import seatLockingService from '../services/seat-locking.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      ApiResponse.error('Validation failed', 400, 'VALIDATION_ERROR', errors.array())
    );
  }
  next();
};

/**
 * @desc    Lock seats temporarily for booking
 * @route   POST /api/v1/bookings/lock
 * @access  Private
 */
const lockSeats = asyncHandler(async (req, res) => {
  const { routeId, travelDate, seatNumbers } = req.body;
  const userId = req.user._id;

  // Validate route exists and is active
  const route = await Route.findById(routeId);
  if (!route || route.status !== 'active') {
    return res.status(404).json(
      ApiResponse.error('Route not found or inactive', 404, 'ROUTE_NOT_FOUND')
    );
  }

  // Check if route is available on travel date
  const dateObj = new Date(travelDate);
  if (!route.isAvailableOnDate(dateObj)) {
    return res.status(400).json(
      ApiResponse.error('Route not available on selected date', 400, 'ROUTE_NOT_AVAILABLE')
    );
  }

  try {
    // Lock seats using seat locking service
    const lockResult = await seatLockingService.lockSeats(
      routeId,
      travelDate,
      seatNumbers,
      userId,
      15 // 15 minutes lock duration
    );

    res.status(200).json(
      ApiResponse.success({
        ...lockResult,
        routeId,
        travelDate,
        userId,
        lockDurationMinutes: 15
      }, 'Seats locked successfully')
    );
  } catch (error) {
    logger.error('Seat locking error:', error);
    res.status(400).json(
      ApiResponse.error(error.message, 400, 'SEAT_LOCK_FAILED')
    );
  }
});

/**
 * @desc    Create new booking
 * @route   POST /api/v1/bookings
 * @access  Private
 */
const createBooking = asyncHandler(async (req, res) => {
  const { 
    routeId, 
    travelDate, 
    passengers, 
    paymentMethod
  } = req.body;
  const userId = req.user._id;

  // Validate route
  const route = await Route.findById(routeId);
  if (!route || route.status !== 'active') {
    return res.status(404).json(
      ApiResponse.error('Route not found or inactive', 404, 'ROUTE_NOT_FOUND')
    );
  }

  // Get seat availability
  const availability = await SeatAvailability.findOne({
    routeId,
    travelDate: new Date(travelDate)
  });

  if (!availability) {
    return res.status(404).json(
      ApiResponse.error('Seat availability not found', 404, 'AVAILABILITY_NOT_FOUND')
    );
  }

  const seatNumbers = passengers.map(p => p.seatNumber);

  try {
    // Confirm seat locks (convert locked seats to booked)
    // await availability.confirmBooking(seatNumbers, userId, null); // bookingId will be set after save

    // Calculate total amount
    const totalAmount = passengers.reduce((sum, p) => sum + p.fare, 0);
    const baseFare = totalAmount; // Simplified - no taxes for now
    
    // Create booking document
    const bookingData = {
      user: {
        userId: req.user._id,
        phone: req.user.phone,
        email: req.user.email,
        name: req.user.fullName
      },
      route: {
        routeId,
        routeCode: route.routeCode,
        origin: route.origin.city,
        destination: route.destination.city,
        operatorName: route.operator.name,
        vehicleNumber: route.vehicle.vehicleNumber
      },
      journey: {
        travelDate: new Date(travelDate),
        departureTime: route.schedule[0].departureTime, // Use first schedule
        estimatedArrivalTime: route.schedule[0].arrivalTime
      },
      passengers,
      payment: {
        totalAmount,
        baseFare,
        taxes: 0,
        convenienceFee: 0,
        discount: 0,
        paymentMethod,
        status: 'pending'
      },
      status: 'confirmed', // Will be confirmed after payment
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        platform: 'web'
      }
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // Update seat availability with booking ID
    console.log('SEAT numbers, userId, bookingID: ', seatNumbers, " ", userId, " ", booking.bookingId);
    await availability.confirmBooking(seatNumbers, userId, booking.bookingId);

    // TODO: Integrate with payment gateway
    // For now, mark payment as completed for development
    booking.payment.status = 'completed';
    booking.payment.paidAt = new Date();
    await booking.save();

    // Clear user's seat locks from cache
    await seatLockingService.releaseSeats(routeId, travelDate, seatNumbers, userId);

    res.status(201).json(
      ApiResponse.success({
        booking: {
          bookingId: booking.bookingId,
          status: booking.status,
          totalAmount: booking.payment.totalAmount,
          passengers: booking.passengers.length,
          seatNumbers: booking.passengers.map(p => p.seatNumber),
          travelDate: booking.journey.travelDate,
          route: `${booking.route.origin} to ${booking.route.destination}`
        },
        payment: {
          status: booking.payment.status,
          paymentMethod: booking.payment.paymentMethod,
          paidAt: booking.payment.paidAt
        }
      }, 'Booking created successfully')
    );

  } catch (error) {
    logger.error('Create booking error:', error);
    
    // Try to release seats if booking failed
    try {
      await availability.releaseLocks(seatNumbers, userId);
    } catch (releaseError) {
      logger.error('Failed to release seats after booking error:', releaseError);
    }

    res.status(500).json(
      ApiResponse.error(
        error.message || 'Failed to create booking', 
        500, 
        'BOOKING_CREATION_FAILED'
      )
    );
  }
});

/**
 * @desc    Get booking by ID
 * @route   GET /api/v1/bookings/:bookingId
 * @access  Private
 */
const getBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({ bookingId })
    .populate('user.userId', 'firstName lastName phone email')
    .populate('route.routeId', 'routeCode origin destination vehicle.vehicleNumber');

  if (!booking) {
    return res.status(404).json(
      ApiResponse.error('Booking not found', 404, 'BOOKING_NOT_FOUND')
    );
  }

  // Check if user owns this booking or is admin
  if (booking.user.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json(
      ApiResponse.error('Access denied', 403, 'ACCESS_DENIED')
    );
  }

  res.status(200).json(
    ApiResponse.success(booking, 'Booking retrieved successfully')
  );
});

/**
 * @desc    Get user's bookings
 * @route   GET /api/v1/bookings/mine
 * @access  Private
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.user._id;

  // Build query
  const query = { 'user.userId': userId };
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const bookings = await Booking.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('route.routeId', 'routeCode origin destination');

  const totalBookings = await Booking.countDocuments(query);
  res.status(200).json(
    ApiResponse.success({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / parseInt(limit)),
        totalBookings,
        hasNext: skip + bookings.length < totalBookings,
        hasPrev: parseInt(page) > 1
      }
    }, 'Bookings retrieved successfully')
  );
});

/**
 * @desc    Cancel booking
 * @route   PUT /api/v1/bookings/:bookingId/cancel
 * @access  Private
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await Booking.findOne({ bookingId });

  if (!booking) {
    return res.status(404).json(
      ApiResponse.error('Booking not found', 404, 'BOOKING_NOT_FOUND')
    );
  }

  // Check ownership
  if (booking.user.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json(
      ApiResponse.error('Access denied', 403, 'ACCESS_DENIED')
    );
  }

  // Check if booking can be cancelled
  const cancellationCheck = booking.canBeCancelled();
  if (!cancellationCheck.allowed) {
    return res.status(400).json(
      ApiResponse.error(cancellationCheck.reason, 400, 'CANCELLATION_NOT_ALLOWED')
    );
  }

  try {
    // Calculate refund
    const { refundAmount, cancellationFee } = booking.calculateCancellationFee();

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      reason: reason || 'user-request',
      cancelledBy: req.user._id,
      refundAmount,
      cancellationFee
    };
    booking.payment.refundDetails = {
      amount: refundAmount,
      processedAt: new Date(),
      status: 'completed' // TODO: Integrate with payment gateway
    };

    await booking.save();

    // Release seats in availability
    const availability = await SeatAvailability.findOne({
      routeId: booking.route.routeId,
      travelDate: booking.journey.travelDate
    });

    if (availability) {
      await availability.cancelBooking(booking.bookingId);
    }

    // TODO: Process actual refund via payment gateway

    res.status(200).json(
      ApiResponse.success({
        bookingId: booking.bookingId,
        status: booking.status,
        refundAmount,
        cancellationFee,
        refundStatus: 'completed'
      }, 'Booking cancelled successfully')
    );

  } catch (error) {
    logger.error('Cancel booking error:', error);
    res.status(500).json(
      ApiResponse.error('Failed to cancel booking', 500, 'CANCELLATION_FAILED')
    );
  }
});

/**
 * @desc    Extend seat lock
 * @route   PUT /api/v1/bookings/extend-lock
 * @access  Private
 */
const extendLock = asyncHandler(async (req, res) => {
  const { additionalMinutes = 5 } = req.body;
  const userId = req.user._id;

  try {
    const result = await seatLockingService.extendSeatLock(userId, additionalMinutes);
    
    res.status(200).json(
      ApiResponse.success(result, 'Seat lock extended successfully')
    );
  } catch (error) {
    logger.error('Extend lock error:', error);
    res.status(400).json(
      ApiResponse.error(error.message, 400, 'LOCK_EXTENSION_FAILED')
    );
  }
});

/**
 * @desc    Release seat locks manually
 * @route   DELETE /api/v1/bookings/lock
 * @access  Private
 */
const releaseLocks = asyncHandler(async (req, res) => {
  const { routeId, travelDate, seatNumbers } = req.body;
  const userId = req.user._id;

  try {
    const result = await seatLockingService.releaseSeats(
      routeId,
      travelDate,
      seatNumbers,
      userId
    );

    res.status(200).json(
      ApiResponse.success(result, 'Seat locks released successfully')
    );
  } catch (error) {
    logger.error('Release locks error:', error);
    res.status(400).json(
      ApiResponse.error(error.message, 400, 'LOCK_RELEASE_FAILED')
    );
  }
});

/**
 * @desc Fetch bookins based on the date and routeid
 * @route GET /api/v1/bookings/query
 * @access Private
 */

const fetchBookings = asyncHandler(async (req, res) => {
  const { routeId, travelDate, departureTime} = req?.query;
  console.log('QUERY: ', req?.query);
  if (!routeId || !travelDate || !departureTime) {
    return res.status(400).json({
      success: false,
      message: 'routeId, travelDate and departureTime are required'
    });
  }

  const dateObj = new Date(travelDate);
  const bookings = await Booking.find({
    'route.routeId': routeId,
    'journey.travelDate': dateObj,
    'journey.departureTime': departureTime
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, bookings });
});

// Validation middleware
const validateLockSeats = [
  body('routeId').isMongoId().withMessage('Invalid route ID'),
  body('travelDate').isISO8601().withMessage('Invalid travel date'),
  body('seatNumbers').isArray({ min: 1 }).withMessage('At least one seat number required'),
  body('seatNumbers.*').notEmpty().withMessage('Seat number cannot be empty')
];

const validateCreateBooking = [
  body('routeId').isMongoId().withMessage('Invalid route ID'),
  body('travelDate').isISO8601().withMessage('Invalid travel date'),
  body('passengers').isArray({ min: 1 }).withMessage('At least one passenger required'),
  body('passengers.*.name').notEmpty().withMessage('Passenger name required'),
  body('passengers.*.age').isInt({ min: 1, max: 120 }).withMessage('Valid age required'),
  body('passengers.*.gender').isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
  body('passengers.*.seatNumber').notEmpty().withMessage('Seat number required'),
  body('passengers.*.fare').isNumeric().withMessage('Valid fare required'),
  body('paymentMethod').isIn(['card', 'wallet', 'upi', 'netbanking']).withMessage('Valid payment method required'),
  body('passengers.*.pickupPoint').notEmpty().withMessage('Pickup point required for each passenger'),
  body('passengers.*.dropPoint').notEmpty().withMessage('Drop point name required for each passenger')
];

// Routes
router.post('/lock', protect, validateLockSeats, handleValidationErrors, lockSeats);
router.post('/', protect, validateCreateBooking, handleValidationErrors, createBooking);
router.get('/mine', protect, getMyBookings);
router.get('/fetchBookings', protect, fetchBookings);
router.get('/:bookingId', protect, getBooking);
router.put('/:bookingId/cancel', protect, [
  param('bookingId').notEmpty().withMessage('Booking ID required'),
  body('reason').optional().isLength({ max: 200 }).withMessage('Reason too long')
], handleValidationErrors, cancelBooking);
router.put('/extend-lock', protect, extendLock);
router.delete('/lock', protect, releaseLocks);

export default router;