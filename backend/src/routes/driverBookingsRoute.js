// In driverBookingRoutes.js (new route file or inside bookingRoutes.js)
import express from "express";
import asyncHandler from "express-async-handler";
import Booking from "../models/booking.model.js";
import Route from "../models/circuit.model.js";
import authMiddleware from "../middleware/auth.middleware.js";
const { protect, authorize } = authMiddleware;
const router = express.Router();

// GET /api/v1/driver/bookings/today
router.get("/bookings/today", protect, asyncHandler(async (req, res) => {
  const operatorId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 2);
  console.log('OPERATOR ID: ', operatorId);

  //Finding all routes assigned to this operator/driver
  const routes = await Route.find({ 'operator.operatorId': operatorId }, "_id");
  console.log('ROUTES: ', routes);
  const routeIds = routes.map(r => r._id);

  if (routeIds.length === 0) {
    return res.status(200).json({ bookings: [], message: "No routes assigned" });
  }

  //Finding bookings for these routes for today
  const bookings = await Booking.find({
    'route.routeId': { $in: routeIds },
    "journey.travelDate": { $gte: today, $lte: tomorrow }
  })
    .populate("user.userId", "firstName lastName phone email")
    .populate("route", "routeCode origin destination vehicleNumber operatorName")
    .sort({ "journey.departureTime": 1 });
  console.log('BOOKINGS: ', bookings);
  // Group and combine bookings by route and departure time
  const groupedBookings = {};
  
  bookings.forEach(booking => {
    const groupKey = `${booking.route.routeId}_${booking.journey.departureTime}`;
    
    if (!groupedBookings[groupKey]) {
      // Create a new combined booking entry
      groupedBookings[groupKey] = {
        routeId: booking.route.routeId,
        routeCode: booking.route.routeCode,
        origin: booking.route.origin,
        destination: booking.route.destination,
        vehicleNumber: booking.route.vehicleNumber,
        operatorName: booking.route.operatorName,
        departureTime: booking.journey.departureTime,
        estimatedArrivalTime: booking.journey.estimatedArrivalTime,
        travelDate: booking.journey.travelDate,
        totalPassengers: 0,
        totalRevenue: 0,
        seatNumbers: [],
        allBookingIds: [],
        passengerDetails: [],
        bookingStatuses: {}
      };
    }
    
    // Aggregate data from individual bookings
    groupedBookings[groupKey].totalPassengers += booking.passengers.length;
    groupedBookings[groupKey].totalRevenue += booking.payment.totalAmount;
    groupedBookings[groupKey].allBookingIds.push(booking.bookingId);
    groupedBookings[groupKey].seatNumbers.push(...booking.passengers.map(p => p.seatNumber));
    
    // Collect passenger details
    booking.passengers.forEach(passenger => {
      groupedBookings[groupKey].passengerDetails.push({
        name: passenger.name,
        age: passenger.age,
        gender: passenger.gender,
        seatNumber: passenger.seatNumber,
        phone: passenger.phone,
        pickupPoint: passenger.pickupPoint,
        dropPoint: passenger.dropPoint,
        fare: passenger.fare
      });
    });
    
    // Track booking statuses
    groupedBookings[groupKey].bookingStatuses[booking.status] = 
      (groupedBookings[groupKey].bookingStatuses[booking.status] || 0) + 1;
  });

  // Convert grouped bookings object to array
  const combinedBookings = Object.values(groupedBookings);
  res.status(200).json({
    success: true,
    bookings: combinedBookings,
    totalBookingsToday: bookings.length,
    totalGroupedTrips: combinedBookings.length,
    message: "Today's combined bookings for your routes"
  });
}));

export default router;
