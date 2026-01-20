import express from "express";
import asyncHandler from "express-async-handler";
import { DateTime } from "luxon";
import Booking from "../models/booking.model.js";
import Route from "../models/circuit.model.js";
import authMiddleware from "../middleware/auth.middleware.js";

const { protect } = authMiddleware;
const router = express.Router();

/**
 * GET /api/v1/driver/bookings/day?date=2026-01-20
 * If date not provided, uses "today" in IST (Asia/Kolkata).
 *
 * Why: removes server timezone differences between local & production. [web:59][web:60]
 */
router.get(
  "/bookings/today",
  protect,
  asyncHandler(async (req, res) => {
    const operatorId = req.user.id;

    const zone = "Asia/Kolkata"; // keep consistent everywhere
    const dateStr = req.query.date; // "YYYY-MM-DD"

    const day = dateStr
      ? DateTime.fromISO(dateStr, { zone })
      : DateTime.now().setZone(zone);

    if (!day.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use format YYYY-MM-DD",
      });
    }

    const start = day.startOf("day").toJSDate();
    const end = day.plus({ days: 1 }).startOf("day").toJSDate();

    // Find routes assigned to this operator/driver
    const routes = await Route.find({ "operator.operatorId": operatorId }, "_id");
    const routeIds = routes.map((r) => r._id);

    if (routeIds.length === 0) {
      return res.status(200).json({
        success: true,
        bookings: [],
        message: "No routes assigned",
      });
    }

    // Find bookings ONLY for this day using [start, end) range
    const bookings = await Booking.find({
      "route.routeId": { $in: routeIds },
      "journey.travelDate": { $gte: start, $lt: end },
    })
      .populate("user.userId", "firstName lastName phone email")
      .sort({ "journey.departureTime": 1 });

    // Group and combine bookings by route and departure time
    const groupedBookings = {};

    bookings.forEach((booking) => {
      const groupKey = `${booking.route.routeId}_${booking.journey.departureTime}`;

      if (!groupedBookings[groupKey]) {
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
          bookingStatuses: {},
        };
      }

      groupedBookings[groupKey].totalPassengers += booking.passengers.length;
      groupedBookings[groupKey].totalRevenue += booking.payment.totalAmount;
      groupedBookings[groupKey].allBookingIds.push(booking.bookingId);
      groupedBookings[groupKey].seatNumbers.push(
        ...booking.passengers.map((p) => p.seatNumber)
      );

      booking.passengers.forEach((passenger) => {
        groupedBookings[groupKey].passengerDetails.push({
          name: passenger.name,
          age: passenger.age,
          gender: passenger.gender,
          seatNumber: passenger.seatNumber,
          phone: passenger.phone,
          pickupPoint: passenger.pickupPoint,
          dropPoint: passenger.dropPoint,
          fare: passenger.fare,
        });
      });

      groupedBookings[groupKey].bookingStatuses[booking.status] =
        (groupedBookings[groupKey].bookingStatuses[booking.status] || 0) + 1;
    });

    const combinedBookings = Object.values(groupedBookings);

    return res.status(200).json({
      success: true,
      timezone: zone,
      range: { start: start.toISOString(), end: end.toISOString() },
      bookings: combinedBookings,
      totalBookingsDay: bookings.length,
      totalGroupedTrips: combinedBookings.length,
      message: "Bookings for the selected day",
    });
  })
);

export default router;
