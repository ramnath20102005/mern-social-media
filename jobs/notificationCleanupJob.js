const cron = require('node-cron');
const NotificationService = require('../services/notificationService');
const Groups = require('../models/groupModel');

class NotificationCleanupJob {
  
  static init() {
    console.log('🔔 Initializing notification cleanup jobs...');
    
    // Clean up expired notifications every hour
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('🧹 Running notification cleanup job...');
        const deletedCount = await NotificationService.cleanupExpiredNotifications();
        if (deletedCount > 0) {
          console.log(`✅ Cleaned up ${deletedCount} expired notifications`);
        }
      } catch (error) {
        console.error('❌ Error in notification cleanup job:', error);
      }
    });

    // Check for group expiry notifications every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        console.log('⏰ Checking for groups nearing expiry...');
        await this.checkGroupExpiryNotifications();
      } catch (error) {
        console.error('❌ Error in group expiry check:', error);
      }
    });

    console.log('✅ Notification cleanup jobs initialized');
  }

  static async checkGroupExpiryNotifications() {
    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Find groups expiring within 24 hours
      const expiringGroups = await Groups.find({
        expiresAt: {
          $gte: now,
          $lte: next24Hours
        },
        isActive: true
      }).populate('members creator', 'username');

      let notificationsCreated = 0;

      for (const group of expiringGroups) {
        const timeUntilExpiry = group.expiresAt - now;
        const hoursUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60));

        // Only notify for groups expiring in 24h, 12h, 6h, 2h, 1h
        const notifyHours = [24, 12, 6, 2, 1];
        
        if (notifyHours.includes(hoursUntilExpiry)) {
          try {
            await NotificationService.createGroupExpiryNotification(group._id);
            notificationsCreated++;
            console.log(`📢 Created expiry notification for group "${group.name}" (${hoursUntilExpiry}h remaining)`);
          } catch (error) {
            console.error(`❌ Failed to create expiry notification for group ${group.name}:`, error);
          }
        }
      }

      if (notificationsCreated > 0) {
        console.log(`✅ Created ${notificationsCreated} group expiry notifications`);
      }

    } catch (error) {
      console.error('❌ Error checking group expiry notifications:', error);
      throw error;
    }
  }

  // Manual trigger for testing
  static async triggerCleanup() {
    try {
      console.log('🧹 Manual notification cleanup triggered...');
      const deletedCount = await NotificationService.cleanupExpiredNotifications();
      console.log(`✅ Manually cleaned up ${deletedCount} expired notifications`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error in manual cleanup:', error);
      throw error;
    }
  }

  // Manual trigger for group expiry check
  static async triggerGroupExpiryCheck() {
    try {
      console.log('⏰ Manual group expiry check triggered...');
      await this.checkGroupExpiryNotifications();
      console.log('✅ Manual group expiry check completed');
    } catch (error) {
      console.error('❌ Error in manual group expiry check:', error);
      throw error;
    }
  }
}

module.exports = NotificationCleanupJob;
