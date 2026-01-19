import { cacheService } from '../config/redis.js';
import logger from '../utils/logger.js';

// Distributed locking service using Redis
class SeatLockingService {
  constructor() {
    this.lockTimeout = parseInt(process.env.SEAT_LOCK_DURATION) || 900; // 15 minutes in seconds
  }

  /**
   * Acquire distributed lock for seat booking operation
   * @param {string} routeId - Route ID
   * @param {string} travelDate - Travel date
   * @param {string} userId - User ID
   * @param {number} lockDuration - Lock duration in seconds
   * @returns {Promise<boolean>} - Whether lock was acquired
   */
  async acquireLock(routeId, travelDate, userId, lockDuration = this.lockTimeout) {
    try {
      const lockKey = `booking_lock:${routeId}:${travelDate}`;
      const lockValue = `${userId}:${Date.now()}`;
      console.log('Lock Value: ', lockValue);
      // Try to acquire lock using SET with NX and EX options
      const acquired = await cacheService.setNX(lockKey, lockValue, 2);
      
      if (acquired) {
        logger.debug(`Lock acquired for ${lockKey} by user ${userId}`);
        return true;
      }
      
      logger.debug(`Failed to acquire lock for ${lockKey} by user ${userId}`);
      return false;
    } catch (error) {
      logger.error('Error acquiring distributed lock:', error);
      return false;
    }
  }

  /**
   * Release distributed lock
   * @param {string} routeId - Route ID
   * @param {string} travelDate - Travel date
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether lock was released
   */
  async releaseLock(routeId, travelDate, userId) {
    try {
      const lockKey = `booking_lock:${routeId}:${travelDate}`;
      
      // Get current lock value to ensure we're releasing our own lock
      const currentValue = await cacheService.get(lockKey);
      
      if (currentValue && currentValue.startsWith(`${userId}:`)) {
        await cacheService.del(lockKey);
        logger.debug(`Lock released for ${lockKey} by user ${userId}`);
        return true;
      }
      
      logger.debug(`Lock not owned by user ${userId} for ${lockKey}`);
      return false;
    } catch (error) {
      logger.error('Error releasing distributed lock:', error);
      return false;
    }
  }

  /**
   * Lock specific seats for a user
   * @param {string} routeId - Route ID
   * @param {string} travelDate - Travel date
   * @param {Array} seatNumbers - Array of seat numbers to lock
   * @param {string} userId - User ID
   * @param {number} lockDurationMinutes - Lock duration in minutes
   * @returns {Promise<Object>} - Lock result
   */
  async lockSeats(routeId, travelDate, seatNumbers, userId, lockDurationMinutes = 2) {
    try {
      // First acquire distributed lock for the booking operation
      const distributedLockAcquired = await this.acquireLock(routeId, travelDate, userId, 30); // 30 seconds for operation
      
      if (!distributedLockAcquired) {
        throw new Error('Could not acquire booking lock. Another user might be booking seats.');
      }``

      try {
        const SeatAvailability = (await import('../models/seat.model.js')).default;
        
        // Get seat availability document
        let availability = await SeatAvailability.findOne({
          routeId,
          travelDate: new Date(travelDate)
        });

        if (!availability) {
          // Initialize seat availability if not exists
          const Route = (await import('../models/circuit.model.js')).default;
          const route = await Route.findById(routeId);
          if (!route) {
            throw new Error('Route not found');
          }
          availability = await SeatAvailability.initializeForRoute(routeId, new Date(travelDate), route);
        }

        // Lock the seats
        const lockResult = await availability.lockSeats(seatNumbers, userId, lockDurationMinutes);
        
        // Store seat lock info in cache for quick access
        const seatLockKey = `seat_locks:${userId}`;
        const lockInfo = {
          routeId,
          travelDate,
          seatNumbers,
          lockedAt: new Date(),
          expiresAt: lockResult.lockExpiry
        };
        
        await cacheService.set(seatLockKey, lockInfo, lockDurationMinutes * 60);

        return {
          success: true,
          lockedSeats: seatNumbers,
          lockExpiry: lockResult.lockExpiry,
          message: `${seatNumbers.length} seat(s) locked successfully`
        };

      } finally {
        // Always release the distributed lock
        await this.releaseLock(routeId, travelDate, userId);
      }

    } catch (error) {
      logger.error('Seat locking error:', error);
      throw error;
    }
  }

  /**
   * Release seat locks for a user
   * @param {string} routeId - Route ID
   * @param {string} travelDate - Travel date
   * @param {Array} seatNumbers - Array of seat numbers to release
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Release result
   */
  async releaseSeats(routeId, travelDate, seatNumbers, userId) {
    try {
      const SeatAvailability = (await import('../models/seat.model.js')).default;
      
      const availability = await SeatAvailability.findOne({
        routeId,
        travelDate: new Date(travelDate)
      });

      if (!availability) {
        throw new Error('Seat availability not found');
      }

      const releaseResult = await availability.releaseLocks(seatNumbers, userId);
      
      // Clear seat lock info from cache
      const seatLockKey = `seat_locks:${userId}`;
      await cacheService.del(seatLockKey);

      return {
        success: true,
        releasedSeats: releaseResult.releasedCount,
        message: `${releaseResult.releasedCount} seat(s) released successfully`
      };

    } catch (error) {
      logger.error('Seat release error:', error);
      throw error;
    }
  }

  /**
   * Get current seat locks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Lock info or null
   */
  async getUserSeatLocks(userId) {
    try {
      const seatLockKey = `seat_locks:${userId}`;
      return await cacheService.get(seatLockKey);
    } catch (error) {
      logger.error('Error getting user seat locks:', error);
      return null;
    }
  }

  /**
   * Extend seat lock duration
   * @param {string} userId - User ID
   * @param {number} additionalMinutes - Additional minutes to extend
   * @returns {Promise<Object>} - Extension result
   */
  async extendSeatLock(userId, additionalMinutes = 5) {
    try {
      const lockInfo = await this.getUserSeatLocks(userId);
      
      if (!lockInfo) {
        throw new Error('No active seat locks found');
      }

      const SeatAvailability = (await import('../models/seat.model.js')).default;
      
      const availability = await SeatAvailability.findOne({
        routeId: lockInfo.routeId,
        travelDate: new Date(lockInfo.travelDate)
      });

      if (!availability) {
        throw new Error('Seat availability not found');
      }

      // Extend locks in database
      const newExpiry = new Date(Date.now() + additionalMinutes * 60 * 1000);
      
      availability.seatsAvailable.forEach(seat => {
        if (lockInfo.seatNumbers.includes(seat.seatNumber) && 
            seat.lockedBy && seat.lockedBy.toString() === userId) {
          seat.lockExpiry = newExpiry;
        }
      });

      await availability.save();

      // Update cache
      lockInfo.expiresAt = newExpiry;
      const seatLockKey = `seat_locks:${userId}`;
      await cacheService.set(seatLockKey, lockInfo, (additionalMinutes + 5) * 60); // Add 5 minutes buffer

      return {
        success: true,
        newExpiry,
        message: `Seat lock extended by ${additionalMinutes} minutes`
      };

    } catch (error) {
      logger.error('Seat lock extension error:', error);
      throw error;
    }
  }

  /**
   * Clean up expired locks (called by scheduled job)
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupExpiredLocks() {
    try {
      const SeatAvailability = (await import('../models/seat.model.js')).default;
      
      const result = await SeatAvailability.releaseExpiredLocks();
      
      logger.info(`Cleaned up expired seat locks. Modified documents: ${result.modifiedCount}`);
      
      return {
        success: true,
        cleanedLocks: result.modifiedCount,
        message: 'Expired locks cleaned up successfully'
      };

    } catch (error) {
      logger.error('Expired lock cleanup error:', error);
      throw error;
    }
  }

  /**
   * Get lock statistics for monitoring
   * @returns {Promise<Object>} - Lock statistics
   */
  async getLockStatistics() {
    try {
      const SeatAvailability = (await import('../models/seat.model.js')).default;
      
      const stats = await SeatAvailability.aggregate([
        {
          $project: {
            totalSeats: '$summary.totalSeats',
            lockedCount: '$summary.lockedCount',
            bookedCount: '$summary.bookedCount',
            availableCount: '$summary.availableCount'
          }
        },
        {
          $group: {
            _id: null,
            totalSeatsAcrossRoutes: { $sum: '$totalSeats' },
            totalLocked: { $sum: '$lockedCount' },
            totalBooked: { $sum: '$bookedCount' },
            totalAvailable: { $sum: '$availableCount' }
          }
        }
      ]);

      const lockStats = stats[0] || {
        totalSeatsAcrossRoutes: 0,
        totalLocked: 0,
        totalBooked: 0,
        totalAvailable: 0
      };

      // Add utilization percentages
      lockStats.lockUtilization = lockStats.totalSeatsAcrossRoutes > 0 
        ? ((lockStats.totalLocked / lockStats.totalSeatsAcrossRoutes) * 100).toFixed(2)
        : 0;
      
      lockStats.bookingUtilization = lockStats.totalSeatsAcrossRoutes > 0
        ? ((lockStats.totalBooked / lockStats.totalSeatsAcrossRoutes) * 100).toFixed(2)
        : 0;

      return lockStats;

    } catch (error) {
      logger.error('Lock statistics error:', error);
      throw error;
    }
  }
}

// Singleton instance
const seatLockingService = new SeatLockingService();

export default seatLockingService;