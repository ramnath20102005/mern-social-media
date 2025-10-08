const cron = require('node-cron');
const Story = require('../models/storyModel');

class StoryExpiryJob {
  constructor() {
    this.isRunning = false;
  }

  // Main expiry function
  async expireStories() {
    if (this.isRunning) {
      console.log('⏳ Story expiry job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🕐 Starting story expiry check...');

    try {
      const now = new Date();
      
      // Find stories that should be expired
      const expiredStories = await Story.find({
        expiryDate: { $lte: now },
        isExpired: false
      }).select('_id user createdAt expiryDate');

      if (expiredStories.length === 0) {
        console.log('✅ No stories to expire');
        return;
      }

      // Update stories to expired status
      const result = await Story.updateMany(
        {
          expiryDate: { $lte: now },
          isExpired: false
        },
        {
          $set: { isExpired: true }
        }
      );

      console.log(`✅ Expired ${result.modifiedCount} stories`);

      // Log expired stories for debugging
      if (process.env.NODE_ENV !== 'production') {
        expiredStories.forEach(story => {
          console.log(`   - Story ${story._id} expired (created: ${story.createdAt})`);
        });
      }

    } catch (error) {
      console.error('❌ Error in story expiry job:', error);
    } finally {
      this.isRunning = false;
      console.log('🏁 Story expiry check completed');
    }
  }

  // Cleanup old expired stories (optional - run less frequently)
  async cleanupExpiredStories() {
    try {
      console.log('🧹 Starting story cleanup...');
      
      // Delete stories that have been expired for more than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await Story.deleteMany({
        isExpired: true,
        updatedAt: { $lte: sevenDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️ Cleaned up ${result.deletedCount} old expired stories`);
      } else {
        console.log('✅ No old stories to cleanup');
      }

    } catch (error) {
      console.error('❌ Error in story cleanup job:', error);
    }
  }

  // Start the cron jobs
  start() {
    console.log('🚀 Initializing story expiry jobs...');

    // Run expiry check every 5 minutes
    const expiryJob = cron.schedule('*/5 * * * *', () => {
      this.expireStories();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Run cleanup every day at 2 AM UTC
    const cleanupJob = cron.schedule('0 2 * * *', () => {
      this.cleanupExpiredStories();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start the jobs
    expiryJob.start();
    cleanupJob.start();

    console.log('✅ Story expiry jobs started:');
    console.log('   - Expiry check: Every 5 minutes');
    console.log('   - Cleanup: Daily at 2 AM UTC');

    // Run initial expiry check
    setTimeout(() => {
      this.expireStories();
    }, 5000); // Wait 5 seconds after server start

    return {
      expiryJob,
      cleanupJob
    };
  }

  // Stop the cron jobs (for testing or shutdown)
  stop(jobs) {
    if (jobs && jobs.expiryJob) {
      jobs.expiryJob.stop();
      console.log('⏹️ Story expiry job stopped');
    }
    if (jobs && jobs.cleanupJob) {
      jobs.cleanupJob.stop();
      console.log('⏹️ Story cleanup job stopped');
    }
  }

  // Manual trigger for testing
  async manualExpiry() {
    console.log('🔧 Manual story expiry triggered');
    await this.expireStories();
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: new Date().toISOString()
    };
  }
}

// Export singleton instance
const storyExpiryJob = new StoryExpiryJob();

module.exports = {
  storyExpiryJob,
  // For backward compatibility
  scheduleStoryExpiry: () => storyExpiryJob.start(),
  expireStories: () => storyExpiryJob.manualExpiry()
};
