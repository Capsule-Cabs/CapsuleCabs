import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Route from '../models/circuit.model.js';
import SeatAvailability from '../models/seat.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
const { protect, authorize, verifyRouteOwnership } = authMiddleware;
import { ApiResponse } from '../utils/apiResponse.js';
import { cacheService } from '../config/redis.js';
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
 * @desc    Search routes
 * @route   GET /api/v1/routes/search
 * @access  Public
 */
const searchRoutes = async (req, res) => {
  try {
    const {
      origin,
      destination,
      travelDate,
      vehicleType,
      minPrice,
      maxPrice,
      amenities,
      sortBy = 'departureTime',
      sortOrder = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    // Build search query
    const searchQuery = { status: 'active' };

    if (origin) {
      searchQuery['origin.city'] = { $regex: origin, $options: 'i' };
    }

    if (destination) {
      searchQuery['destination.city'] = { $regex: destination, $options: 'i' };
    }

    if (vehicleType) {
      searchQuery['vehicle.type'] = vehicleType;
    }

    if (minPrice || maxPrice) {
      searchQuery['pricing.baseFare'] = {};
      if (minPrice) searchQuery['pricing.baseFare'].$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery['pricing.baseFare'].$lte = parseFloat(maxPrice);
    }

    if (amenities) {
      const amenitiesArray = amenities.split(',');
      searchQuery['vehicle.amenities'] = { $in: amenitiesArray };
    }

    // Check route availability for specific travel date
    if (travelDate) {
      const dateObj = new Date(travelDate);
      searchQuery['schedule.validFrom'] = { $lte: dateObj };
      searchQuery['schedule.validUntil'] = { $gte: dateObj };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search with caching
    const cacheKey = `routes:search:${JSON.stringify({
      ...req.query,
      page: parseInt(page),
      limit: parseInt(limit)
    })}`;

    let result = await cacheService.get(cacheKey);

    if (!result) {
      const routes = await Route.find(searchQuery)
        .populate('operator.operatorId', 'firstName lastName profileImage rating')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const totalRoutes = await Route.countDocuments(searchQuery);

      // Get seat availability for each route if travel date is provided
      if (travelDate && routes.length > 0) {
        const routeIds = routes.map(route => route._id);
        const availabilities = await SeatAvailability.find({
          routeId: { $in: routeIds },
          travelDate: new Date(travelDate)
        }).lean();

        // Map availability data to routes
        const availabilityMap = {};
        availabilities.forEach(avail => {
          availabilityMap[avail.routeId.toString()] = avail.summary;
        });

        routes.forEach(route => {
          route.seatAvailability = availabilityMap[route._id.toString()] || {
            totalSeats: route.seating.totalSeats,
            availableCount: route.seating.totalSeats,
            lockedCount: 0,
            bookedCount: 0,
            blockedCount: 0
          };
        });
      }

      result = {
        routes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRoutes / parseInt(limit)),
          totalRoutes,
          hasNext: skip + routes.length < totalRoutes,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          origin,
          destination,
          travelDate,
          vehicleType,
          amenities: amenities?.split(',') || []
        }
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);
    }

    res.status(200).json(
      ApiResponse.success(result, 'Routes retrieved successfully')
    );
  } catch (error) {
    logger.error('Search routes error:', error);
    res.status(500).json(
      ApiResponse.error('Server error while searching routes', 500, 'SERVER_ERROR')
    );
  }
};

/**
 * @desc    Get single route details
 * @route   GET /api/v1/routes/:id
 * @access  Public
 */
const getRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id)
      .populate('operator.operatorId', 'firstName lastName profileImage phone rating')
      .lean();

    if (!route) {
      return res.status(404).json(
        ApiResponse.error('Route not found', 404, 'ROUTE_NOT_FOUND')
      );
    }

    if (route.status !== 'active' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json(
        ApiResponse.error('Route is not available', 403, 'ROUTE_INACTIVE')
      );
    }

    res.status(200).json(
      ApiResponse.success(route, 'Route details retrieved successfully')
    );
  } catch (error) {
    logger.error('Get route error:', error);
    res.status(500).json(
      ApiResponse.error('Server error while fetching route', 500, 'SERVER_ERROR')
    );
  }
};

/**
 * @desc    Get seat availability for a route and date
 * @route   GET /api/v1/routes/:id/availability
 * @access  Public
 */
const getSeatAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { travelDate } = req.query;

    if (!travelDate) {
      return res.status(400).json(
        ApiResponse.error('Travel date is required', 400, 'TRAVEL_DATE_REQUIRED')
      );
    }

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json(
        ApiResponse.error('Route not found', 404, 'ROUTE_NOT_FOUND')
      );
    }

    if (route.status !== 'active') {
      return res.status(403).json(
        ApiResponse.error('Route is not available', 403, 'ROUTE_INACTIVE')
      );
    }

    const dateObj = new Date(travelDate);
    
    // Check if route is available on this date
    if (!route.isAvailableOnDate(dateObj)) {
      return res.status(400).json(
        ApiResponse.error('Route is not available on the selected date', 400, 'ROUTE_NOT_AVAILABLE_ON_DATE')
      );
    }

    // Get or create seat availability
    let availability = await SeatAvailability.findOne({
      routeId: id,
      travelDate: dateObj
    });

    if (!availability) {
      availability = await SeatAvailability.initializeForRoute(id, dateObj, route);
    }

    // Cache the availability data
    const cacheKey = `availability:${id}:${travelDate}`;
    await cacheService.set(cacheKey, availability, 300); // 5 minutes

    res.status(200).json(
      ApiResponse.success({
        routeId: id,
        travelDate: dateObj,
        seatsAvailable: availability.seatsAvailable,
        summary: availability.summary,
        seatLayout: {
          layout: route.seating.layout,
          totalSeats: route.seating.totalSeats,
          seatMap: route.seating.seatMap
        }
      }, 'Seat availability retrieved successfully')
    );
  } catch (error) {
    logger.error('Get seat availability error:', error);
    res.status(500).json(
      ApiResponse.error('Server error while fetching seat availability', 500, 'SERVER_ERROR')
    );
  }
};

/**
 * @desc    Create new route (Operator/Admin only)
 * @route   POST /api/v1/routes
 * @access  Private (Operator/Admin)
 */
const createRoute = async (req, res) => {
  try {
    const routeData = {
      ...req.body,
      operator: {
        ...req.body.operator,
        operatorId: req.user._id
      }
    };

    // Generate route code if not provided
    if (!routeData.routeCode) {
      const originCode = routeData.origin.city.substring(0, 3).toUpperCase();
      const destCode = routeData.destination.city.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      routeData.routeCode = `${originCode}-${destCode}-${timestamp}`;
    }

    const route = new Route(routeData);
    await route.save();

    res.status(201).json(
      ApiResponse.success(route, 'Route created successfully')
    );
  } catch (error) {
    logger.error('Create route error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json(
        ApiResponse.error('Route code already exists', 409, 'ROUTE_CODE_EXISTS')
      );
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(
        ApiResponse.error('Validation failed', 400, 'VALIDATION_ERROR', Object.values(error.errors).map(e => e.message))
      );
    }
    
    res.status(500).json(
      ApiResponse.error('Server error while creating route', 500, 'SERVER_ERROR')
    );
  }
};

/**
 * @desc    Update route (Operator/Admin only)
 * @route   PUT /api/v1/routes/:id
 * @access  Private (Operator/Admin)
 */
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent updating sensitive fields
    delete updateData._id;
    delete updateData.operator;
    delete updateData.createdAt;

    const route = await Route.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!route) {
      return res.status(404).json(
        ApiResponse.error('Route not found', 404, 'ROUTE_NOT_FOUND')
      );
    }

    // Clear related cache
    await cacheService.delPattern(`routes:search:*`);
    await cacheService.delPattern(`availability:${id}:*`);

    res.status(200).json(
      ApiResponse.success(route, 'Route updated successfully')
    );
  } catch (error) {
    logger.error('Update route error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(
        ApiResponse.error('Validation failed', 400, 'VALIDATION_ERROR', Object.values(error.errors).map(e => e.message))
      );
    }
    
    res.status(500).json(
      ApiResponse.error('Server error while updating route', 500, 'SERVER_ERROR')
    );
  }
};

/**
 * @desc    Delete route (Admin only)
 * @route   DELETE /api/v1/routes/:id
 * @access  Private (Admin)
 */
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);
    
    if (!route) {
      return res.status(404).json(
        ApiResponse.error('Route not found', 404, 'ROUTE_NOT_FOUND')
      );
    }

    // Check if there are active bookings for this route
    const { default: Booking } = await import('../models/Booking.js');
    const activeBookings = await Booking.countDocuments({
      'route.routeId': id,
      status: { $in: ['confirmed', 'in-transit'] },
      'journey.travelDate': { $gte: new Date() }
    });

    if (activeBookings > 0) {
      return res.status(400).json(
        ApiResponse.error(
          'Cannot delete route with active bookings. Please suspend the route instead.',
          400,
          'ACTIVE_BOOKINGS_EXIST'
        )
      );
    }

    await Route.findByIdAndDelete(id);

    // Clear related cache and seat availability
    await cacheService.delPattern(`routes:search:*`);
    await cacheService.delPattern(`availability:${id}:*`);
    await SeatAvailability.deleteMany({ routeId: id });

    res.status(200).json(
      ApiResponse.success({}, 'Route deleted successfully')
    );
  } catch (error) {
    logger.error('Delete route error:', error);
    res.status(500).json(
      ApiResponse.error('Server error while deleting route', 500, 'SERVER_ERROR')
    );
  }
};

/**
 * @desc    Get routes by operator (Operator/Admin only)
 * @route   GET /api/v1/routes/my-routes
 * @access  Private (Operator/Admin)
 */
const getMyRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const routes = await Route.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRoutes = routes.length;

    res.status(200).json(
      ApiResponse.success({
        routes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRoutes / parseInt(limit)),
          totalRoutes,
          hasNext: skip + routes.length < totalRoutes,
          hasPrev: parseInt(page) > 1
        }
      }, 'Routes retrieved successfully')
    );
  } catch (error) {
    logger.error('Get my routes error:', error);
    res.status(500).json(
      ApiResponse.error('Server error while fetching operator routes', 500, 'SERVER_ERROR')
    );
  }
};

// Validation middleware for route creation
const validateCreateRoute = [
  body('routeCode').optional().matches(/^[A-Z0-9-]+$/).withMessage('Route code must contain only uppercase letters, numbers, and hyphens'),
  body('origin.city').notEmpty().withMessage('Origin city is required'),
  body('origin.location').notEmpty().withMessage('Origin location is required'),
  body('destination.city').notEmpty().withMessage('Destination city is required'),
  body('destination.location').notEmpty().withMessage('Destination location is required'),
  body('vehicle.vehicleType').isIn(['ertiga-cab']).withMessage('Invalid vehicle type'),
  body('vehicle.vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('seating.totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1'),
  body('pricing.baseFare').isNumeric().withMessage('Base fare must be a number')
];

// Routes
router.get('/search', searchRoutes);
router.get('/my-routes', getMyRoutes);
router.get('/:id', getRoute);
router.get('/:id/availability', [
  param('id').isMongoId().withMessage('Invalid route ID'),
  query('travelDate').isISO8601().withMessage('Invalid travel date format')
], handleValidationErrors, getSeatAvailability);

router.post('/', validateCreateRoute, handleValidationErrors, createRoute);
router.put('/:id', verifyRouteOwnership, updateRoute);
router.delete('/:id', deleteRoute);

export default router;
