import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  optimizeRoute,
  extractPickupPointsFromBooking,
  extractDropPointsFromBooking,
} from '../services/routeOptimization.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();
const { protect } = authMiddleware;

// 1. Optimize PICKUP sequence
router.post(
  '/pickup-optimize/:bookingId',
  protect,
  asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { origin } = req.body;
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const pickupPoints = await extractPickupPointsFromBooking(bookingId, apiKey);
      if (!origin || pickupPoints.length === 0) {
        return res.status(400).json(ApiResponse.error('Origin and pickup points required', 400));
      }
      const optimizedRoute = await optimizeRoute(origin, pickupPoints, apiKey);
      res.json(ApiResponse.success('Pickup route optimized successfully', optimizedRoute, 200));
    } catch (err) {
      res.status(500).json(ApiResponse.error(err.message, 500, 'ROUTE_OPTIMIZATION_FAILED'));
    }
  })
);

// 2. Optimize DROP sequence (from last pickup as new origin)
router.post(
  '/drop-optimize/:bookingId',
  protect,
  asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { origin } = req.body; // Should be the last pickup
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const dropPoints = await extractDropPointsFromBooking(bookingId, apiKey);
      if (!origin || dropPoints.length === 0) {
        return res.status(400).json(ApiResponse.error('Origin and drop points required', 400));
      }
      const optimizedRoute = await optimizeRoute(origin, dropPoints, apiKey);
      res.json(ApiResponse.success('Drop route optimized successfully', optimizedRoute, 200));
    } catch (err) {
      res.status(500).json(ApiResponse.error(err.message, 500, 'ROUTE_OPTIMIZATION_FAILED'));
    }
  })
);

export default router;
