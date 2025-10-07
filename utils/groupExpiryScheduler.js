const cron = require('node-cron');
const Groups = require('../models/groupModel');
const Messages = require('../models/messageModel');
const Users = require('../models/userModel');
const { sendNotification } = require('./notificationService');

// Schedule to run every hour
const scheduleExpiryChecks = () => {
  console.log('🕐 Group expiry scheduler started - checking every hour');
  
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('🔍 Running scheduled group expiry check...');
    
    try {
      await checkGroupExpiries();
    } catch (error) {
      console.error('❌ Error in scheduled expiry check:', error);
    }
  });

  // Also run immediately on startup
  setTimeout(checkGroupExpiries, 5000);
};

const checkGroupExpiries = async () => {
  try {
    const now = new Date();
    
    // Find groups that need notifications or expiry
    const groups = await Groups.find({
      expiryDate: { $exists: true },
      isExpired: { $ne: true }
    }).populate('creator members.user');

    console.log(`📊 Checking ${groups.length} active groups for expiry...`);

    for (const group of groups) {
      const timeUntilExpiry = new Date(group.expiryDate) - now;
      const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
      const daysUntilExpiry = timeUntilExpiry / (1000 * 60 * 60 * 24);

      // Group has expired
      if (timeUntilExpiry <= 0) {
        await handleGroupExpiry(group);
      }
      // 24 hours warning
      else if (hoursUntilExpiry <= 24 && !group.warnings?.includes('24h')) {
        await sendExpiryWarning(group, '24h');
      }
      // 7 days warning
      else if (daysUntilExpiry <= 7 && !group.warnings?.includes('7d')) {
        await sendExpiryWarning(group, '7d');
      }
      // 1 day warning
      else if (daysUntilExpiry <= 1 && !group.warnings?.includes('1d')) {
        await sendExpiryWarning(group, '1d');
      }
    }

  } catch (error) {
    console.error('❌ Error checking group expiries:', error);
  }
};

const handleGroupExpiry = async (group) => {
  try {
    console.log(`⏰ Group "${group.name}" has expired, marking as expired...`);

    // Mark group as expired
    group.isExpired = true;
    await group.save();

    // Create system message about expiry
    const systemMessage = new Messages({
      conversation: group.conversation,
      sender: group.creator._id,
      group: group._id,
      isGroupMessage: true,
      messageType: 'system',
      systemMessageType: 'group_expired',
      systemMessageData: {
        groupName: group.name,
        expiryDate: group.expiryDate
      },
      text: `This group has expired and is now read-only. No new messages can be sent.`
    });
    await systemMessage.save();

    // Send notifications to all members
    const allMembers = [group.creator, ...group.members.map(m => m.user)];
    
    for (const member of allMembers) {
      if (member && member._id) {
        await sendNotification({
          userId: member._id,
          type: 'group_expired',
          title: 'Group Expired',
          message: `The group "${group.name}" has expired and is now read-only.`,
          data: {
            groupId: group._id,
            groupName: group.name
          }
        });
      }
    }

    console.log(`✅ Group "${group.name}" expired successfully, ${allMembers.length} notifications sent`);

  } catch (error) {
    console.error(`❌ Error handling expiry for group ${group.name}:`, error);
  }
};

const sendExpiryWarning = async (group, warningType) => {
  try {
    const warningMessages = {
      '7d': 'This group will expire in 7 days',
      '1d': 'This group will expire in 1 day',
      '24h': 'This group will expire in 24 hours'
    };

    const warningTitles = {
      '7d': 'Group Expiring Soon',
      '1d': 'Group Expires Tomorrow',
      '24h': 'Group Expires in 24 Hours'
    };

    console.log(`⚠️ Sending ${warningType} expiry warning for group "${group.name}"`);

    // Add warning to group's warnings array
    if (!group.warnings) {
      group.warnings = [];
    }
    group.warnings.push(warningType);
    await group.save();

    // Create system message
    const systemMessage = new Messages({
      conversation: group.conversation,
      sender: group.creator._id,
      group: group._id,
      isGroupMessage: true,
      messageType: 'system',
      systemMessageType: 'expiry_warning',
      systemMessageData: {
        warningType,
        groupName: group.name,
        expiryDate: group.expiryDate
      },
      text: `⚠️ ${warningMessages[warningType]}. Admins can extend the group expiry.`
    });
    await systemMessage.save();

    // Send notifications to admins and creator only
    const admins = group.members.filter(m => m.role === 'admin').map(m => m.user);
    const notificationTargets = [group.creator, ...admins];

    for (const admin of notificationTargets) {
      if (admin && admin._id) {
        await sendNotification({
          userId: admin._id,
          type: 'group_expiry_warning',
          title: warningTitles[warningType],
          message: `${warningMessages[warningType]}: "${group.name}". You can extend the expiry in group settings.`,
          data: {
            groupId: group._id,
            groupName: group.name,
            warningType,
            expiryDate: group.expiryDate
          }
        });
      }
    }

    console.log(`✅ ${warningType} warning sent for "${group.name}" to ${notificationTargets.length} admins`);

  } catch (error) {
    console.error(`❌ Error sending ${warningType} warning for group ${group.name}:`, error);
  }
};

// Manual function to check expiries (for testing)
const checkExpiriesNow = async () => {
  console.log('🔍 Manual expiry check triggered...');
  await checkGroupExpiries();
};

// Function to clean up expired groups (run weekly)
const scheduleCleanup = () => {
  // Run every Sunday at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    console.log('🧹 Running weekly cleanup of expired groups...');
    
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Find groups expired for more than 30 days
      const expiredGroups = await Groups.find({
        isExpired: true,
        expiryDate: { $lt: thirtyDaysAgo }
      });

      console.log(`Found ${expiredGroups.length} groups expired for 30+ days`);

      for (const group of expiredGroups) {
        // Delete associated messages
        await Messages.deleteMany({ group: group._id });
        
        // Delete the group
        await Groups.findByIdAndDelete(group._id);
        
        console.log(`🗑️ Cleaned up expired group: ${group.name}`);
      }

    } catch (error) {
      console.error('❌ Error in weekly cleanup:', error);
    }
  });
};

module.exports = {
  scheduleExpiryChecks,
  checkExpiriesNow,
  scheduleCleanup,
  checkGroupExpiries
};
