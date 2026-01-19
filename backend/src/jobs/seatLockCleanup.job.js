import cron from 'node-cron';
import seatLockingService from '../services/seat-locking.service.js';
import logger from '../utils/logger.js';

/**
 * Runs every 1 minute
 * Safe even with multiple Node instances
 */
export const startSeatLockCleanupJob = () => {
  cron.schedule('*/1 * * * *', async () => {
    try {
      logger.info('[CRON] Running seat lock cleanup job');
      await seatLockingService.cleanupExpiredLocks();
    } catch (error) {
      logger.error('[CRON] Seat lock cleanup failed', error);
    }
  });
};
