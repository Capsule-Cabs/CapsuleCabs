import SeatAvailability from '../models/seat.model.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

class SeatLockingService {
  DEFAULT_LOCK_MINUTES = 5;

  /**
   * ATOMIC seat lock - FIXED to allow re-locking own seats
   */
  async lockSeats(routeId, travelDate, seatNumbers, lockMinutes = this.DEFAULT_LOCK_MINUTES) {
    const lockExpiry = new Date(Date.now() + lockMinutes * 60 * 1000);
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      // First, fetch and validate
      const availability = await SeatAvailability.findOne({
        routeId,
        travelDate: new Date(travelDate)
      }).session(session);

      if (!availability) {
        throw new Error('Route not available for selected date');
      }

      // Validate all seats are available OR already locked by this user
      const unavailableSeats = [];
      for (const seatNumber of seatNumbers) {
        const seat = availability.seatsAvailable.find(s => s.seatNumber === seatNumber);
        console.log('Checking seat:', seatNumber, seat);
        if (!seat) {
          unavailableSeats.push(`${seatNumber} (not found)`);
        } else if (seat.status === 'available') {
          // Seat is available - OK to lock
          continue;
        } else if (seat.status === 'locked' && seat.lockedBy) {
          // Seat is already locked by this user - OK to re-lock/extend
          continue;
        } else {
          // Seat is locked by another user or booked/blocked
          unavailableSeats.push(`${seatNumber} (${seat.status})`);
        }
      }

      if (unavailableSeats.length > 0) {
        throw new Error(`Seats not available: ${unavailableSeats.join(', ')}`);
      }

      // Count how many seats are currently available (not already locked by this user)
      const seatsToLock = availability.seatsAvailable.filter(
        s => seatNumbers.includes(s.seatNumber) && 
             s.status === 'available'
      ).length;

      // Use aggregation pipeline to update multiple seats
      const result = await SeatAvailability.updateOne(
        {
          _id: availability._id
        },
        [
          {
            $set: {
              seatsAvailable: {
                $map: {
                  input: "$seatsAvailable",
                  as: "seat",
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $in: ["$$seat.seatNumber", seatNumbers] },
                          {
                            $or: [
                              { $eq: ["$$seat.status", "available"] },
                              {
                                $and: [
                                  { $eq: ["$$seat.status", "locked"] },
                                  // { $eq: ["$$seat.lockedBy", new mongoose.Types.ObjectId(userId)] }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      then: {
                        $mergeObjects: [
                          "$$seat",
                          {
                            status: "locked",
                            // lockedBy: new mongoose.Types.ObjectId(userId),
                            lockedAt: new Date(),
                            lockExpiry: lockExpiry
                          }
                        ]
                      },
                      else: "$$seat"
                    }
                  }
                }
              },
              // Only increment/decrement for newly locked seats, not re-locked ones
              "summary.lockedCount": { $add: ["$summary.lockedCount", seatsToLock] },
              "summary.availableCount": { $subtract: ["$summary.availableCount", seatsToLock] }
            }
          }
        ],
        { session }
      );

      if (result.modifiedCount === 0) {
        throw new Error('Failed to lock seats - no modifications made');
      }

      // Verify the lock
      const updated = await SeatAvailability.findById(availability._id).session(session);
      const actuallyLocked = updated.seatsAvailable.filter(
        s => seatNumbers.includes(s.seatNumber) && 
             s.status === 'locked'
            //   && 
            //  s.lockedBy && s.lockedBy.toString() === userId.toString()
      );

      if (actuallyLocked.length !== seatNumbers.length) {
        throw new Error(`Only ${actuallyLocked.length}/${seatNumbers.length} seats were locked`);
      }

      await session.commitTransaction();
      logger.info(`Successfully locked ${seatNumbers.length} seats (${seatsToLock} new, ${seatNumbers.length - seatsToLock} re-locked)`);
      return { success: true, seatNumbers, lockExpiry };

    } catch (error) {
      await session.abortTransaction();
      logger.error('Lock seats error:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * ATOMIC confirm booking - using aggregation pipeline
   */
  async confirmBooking(routeId, travelDate, seatNumbers, userId, bookingId) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      const availability = await SeatAvailability.findOne({
        routeId,
        travelDate: new Date(travelDate)
      }).session(session);

      if (!availability) {
        throw new Error('Route availability not found');
      }

      // Validate all seats are locked by this user
      const lockedSeats = availability.seatsAvailable.filter(
        s => seatNumbers.includes(s.seatNumber) &&
             s.status === 'locked' &&
             s.lockedBy && s.lockedBy.toString() === userId.toString()
      );

      if (lockedSeats.length !== seatNumbers.length) {
        throw new Error(`Only ${lockedSeats.length}/${seatNumbers.length} seats are locked by you`);
      }

      // Convert locked to booked using aggregation pipeline
      await SeatAvailability.updateOne(
        { _id: availability._id },
        [
          {
            $set: {
              seatsAvailable: {
                $map: {
                  input: "$seatsAvailable",
                  as: "seat",
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $in: ["$$seat.seatNumber", seatNumbers] },
                          { $eq: ["$$seat.status", "locked"] },
                          { $eq: ["$$seat.lockedBy", new mongoose.Types.ObjectId(userId)] }
                        ]
                      },
                      then: {
                        seatNumber: "$$seat.seatNumber",
                        status: "booked",
                        bookedBy: new mongoose.Types.ObjectId(userId),
                        bookedAt: new Date(),
                        bookingId: bookingId,
                        price: "$$seat.price",
                        seatType: "$$seat.seatType"
                      },
                      else: "$$seat"
                    }
                  }
                }
              },
              "summary.bookedCount": { $add: ["$summary.bookedCount", seatNumbers.length] },
              "summary.lockedCount": { $subtract: ["$summary.lockedCount", seatNumbers.length] }
            }
          }
        ],
        { session }
      );

      await session.commitTransaction();
      logger.info(`Confirmed booking for ${seatNumbers.length} seats`);
      return { success: true };

    } catch (error) {
      await session.abortTransaction();
      logger.error('Confirm booking error:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Manual release - using aggregation pipeline
   */
  async releaseSeats(routeId, travelDate, seatNumbers, userId) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      const availability = await SeatAvailability.findOne({
        routeId,
        travelDate: new Date(travelDate)
      }).session(session);

      if (!availability) {
        logger.warn('Availability not found for release');
        return { success: true, releasedCount: 0 };
      }

      const lockedSeats = availability.seatsAvailable.filter(
        s => seatNumbers.includes(s.seatNumber) &&
             s.status === 'locked' &&
             s.lockedBy && s.lockedBy.toString() === userId.toString()
      );

      if (lockedSeats.length === 0) {
        logger.info('No seats to release');
        return { success: true, releasedCount: 0 };
      }

      await SeatAvailability.updateOne(
        { _id: availability._id },
        [
          {
            $set: {
              seatsAvailable: {
                $map: {
                  input: "$seatsAvailable",
                  as: "seat",
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $in: ["$$seat.seatNumber", seatNumbers] },
                          { $eq: ["$$seat.status", "locked"] },
                          { $eq: ["$$seat.lockedBy", new mongoose.Types.ObjectId(userId)] }
                        ]
                      },
                      then: {
                        seatNumber: "$$seat.seatNumber",
                        status: "available",
                        price: "$$seat.price",
                        seatType: "$$seat.seatType"
                      },
                      else: "$$seat"
                    }
                  }
                }
              },
              "summary.availableCount": { $add: ["$summary.availableCount", lockedSeats.length] },
              "summary.lockedCount": { $subtract: ["$summary.lockedCount", lockedSeats.length] }
            }
          }
        ],
        { session }
      );

      await session.commitTransaction();
      logger.info(`Released ${lockedSeats.length} seats`);
      return { success: true, releasedCount: lockedSeats.length };

    } catch (error) {
      await session.abortTransaction();
      logger.error('Release seats error:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * CRON cleanup - using aggregation pipeline
   */
  async cleanupExpiredLocks() {
    const now = new Date();
    
    try {
      // Find all documents with expired locks
      const docsWithExpiredLocks = await SeatAvailability.find({
        'seatsAvailable': {
          $elemMatch: {
            status: 'locked',
            lockExpiry: { $lt: now }
          }
        }
      });

      let totalCleaned = 0;

      for (const doc of docsWithExpiredLocks) {
        const expiredSeats = doc.seatsAvailable.filter(
          s => s.status === 'locked' && s.lockExpiry && s.lockExpiry < now
        );

        if (expiredSeats.length > 0) {
          const expiredSeatNumbers = expiredSeats.map(s => s.seatNumber);

          await SeatAvailability.updateOne(
            { _id: doc._id },
            [
              {
                $set: {
                  seatsAvailable: {
                    $map: {
                      input: "$seatsAvailable",
                      as: "seat",
                      in: {
                        $cond: {
                          if: {
                            $and: [
                              { $in: ["$$seat.seatNumber", expiredSeatNumbers] },
                              { $eq: ["$$seat.status", "locked"] },
                              { $lt: ["$$seat.lockExpiry", now] }
                            ]
                          },
                          then: {
                            seatNumber: "$$seat.seatNumber",
                            status: "available",
                            price: "$$seat.price",
                            seatType: "$$seat.seatType"
                          },
                          else: "$$seat"
                        }
                      }
                    }
                  },
                  "summary.availableCount": { $add: ["$summary.availableCount", expiredSeats.length] },
                  "summary.lockedCount": { $subtract: ["$summary.lockedCount", expiredSeats.length] }
                }
              }
            ]
          );

          totalCleaned += expiredSeats.length;
        }
      }

      logger.info(`✅ Cleaned ${totalCleaned} expired seat locks across ${docsWithExpiredLocks.length} routes`);
      return { success: true, cleanedCount: totalCleaned };

    } catch (error) {
      logger.error('Cleanup error:', error);
      throw error;
    }
  }
}

export default new SeatLockingService();
