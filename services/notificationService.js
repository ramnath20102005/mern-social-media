const Notifies = require('../models/notifyModel');
const Users = require('../models/userModel');
const Groups = require('../models/groupModel');

class NotificationService {
  
  // Create a follow notification
  static async createFollowNotification(followerId, followedUserId) {
    try {
      // Check if notification already exists (prevent duplicates)
      const existingNotification = await Notifies.findOne({
        user: followerId,
        recipients: followedUserId,
        type: 'follow'
      });

      if (existingNotification) {
        // Update the timestamp instead of creating duplicate
        existingNotification.createdAt = new Date();
        await existingNotification.save();
        return existingNotification;
      }

      const follower = await Users.findById(followerId).select('username fullname avatar');
      
      const notification = new Notifies({
        user: followerId,
        recipients: [followedUserId],
        type: 'follow',
        text: `${follower.username} started following you`,
        content: `${follower.fullname || follower.username} is now following you`,
        url: `/profile/${followerId}`,
        image: follower.avatar,
        priority: 'medium'
      });

      await notification.save();
      console.log(`✅ Follow notification created: ${follower.username} → ${followedUserId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating follow notification:', error);
      throw error;
    }
  }

  // Remove follow notification when unfollowing
  static async removeFollowNotification(followerId, followedUserId) {
    try {
      await Notifies.deleteOne({
        user: followerId,
        recipients: followedUserId,
        type: 'follow'
      });
      console.log(`🗑️ Follow notification removed: ${followerId} → ${followedUserId}`);
    } catch (error) {
      console.error('❌ Error removing follow notification:', error);
    }
  }

  // Create group invitation notification
  static async createGroupInviteNotification(inviterId, invitedUserId, groupId) {
    try {
      const [inviter, group] = await Promise.all([
        Users.findById(inviterId).select('username fullname avatar'),
        Groups.findById(groupId).select('name description avatar')
      ]);

      if (!inviter || !group) {
        throw new Error('Inviter or group not found');
      }

      const notification = new Notifies({
        user: inviterId,
        recipients: [invitedUserId],
        type: 'group_invite',
        text: `${inviter.username} invited you to join "${group.name}"`,
        content: `You've been invited to join the group "${group.name}"`,
        url: `/group/${groupId}`,
        image: group.avatar || inviter.avatar,
        priority: 'high',
        metadata: {
          groupId: groupId,
          groupName: group.name,
          inviterId: inviterId
        }
      });

      await notification.save();
      console.log(`✅ Group invite notification created: ${inviter.username} invited to ${group.name}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating group invite notification:', error);
      throw error;
    }
  }

  // Create group expiry warning notification
  static async createGroupExpiryNotification(groupId) {
    try {
      const group = await Groups.findById(groupId)
        .populate('members', 'username')
        .populate('creator', 'username fullname avatar');

      if (!group) {
        throw new Error('Group not found');
      }

      // Calculate time until expiry
      const now = new Date();
      const timeUntilExpiry = group.expiresAt - now;
      const hoursUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60));

      let message;
      let priority;
      
      if (hoursUntilExpiry <= 2) {
        message = `Group "${group.name}" expires in ${hoursUntilExpiry} hour(s)`;
        priority = 'urgent';
      } else if (hoursUntilExpiry <= 24) {
        message = `Group "${group.name}" expires in ${hoursUntilExpiry} hours`;
        priority = 'high';
      } else {
        return; // Don't notify if more than 24 hours
      }

      // Notify all group members
      const memberIds = group.members.map(member => member._id);
      
      const notification = new Notifies({
        user: group.creator._id,
        recipients: memberIds,
        type: 'group_expiry',
        text: message,
        content: `The group "${group.name}" will expire soon. Join the conversation before it's gone!`,
        url: `/group/${groupId}`,
        image: group.avatar,
        priority: priority,
        metadata: {
          groupId: groupId,
          groupName: group.name,
          expiresAt: group.expiresAt,
          hoursUntilExpiry: hoursUntilExpiry
        }
      });

      await notification.save();
      console.log(`⏰ Group expiry notification created for ${group.name} (${hoursUntilExpiry}h remaining)`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating group expiry notification:', error);
      throw error;
    }
  }

  // Create story reply notification
  static async createStoryReplyNotification(replierId, storyOwnerId, storyId, messageText) {
    try {
      const replier = await Users.findById(replierId).select('username fullname avatar');
      
      const notification = new Notifies({
        user: replierId,
        recipients: [storyOwnerId],
        type: 'story_reply',
        text: `${replier.username} replied to your story`,
        content: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
        url: `/message/${replierId}`,
        image: replier.avatar,
        priority: 'medium',
        metadata: {
          storyId: storyId,
          messageText: messageText
        }
      });

      await notification.save();
      console.log(`💬 Story reply notification created: ${replier.username} replied to story`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating story reply notification:', error);
      throw error;
    }
  }

  // Get notifications for a user with filtering
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        type = null,
        isRead = null,
        limit = 20,
        page = 1
      } = options;

      const query = { recipients: userId };
      
      if (type) query.type = type;
      if (isRead !== null) query.isRead = isRead;

      const notifications = await Notifies.find(query)
        .populate('user', 'username fullname avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      return notifications;
    } catch (error) {
      console.error('❌ Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notifications as read
  static async markAsRead(notificationIds) {
    try {
      await Notifies.updateMany(
        { _id: { $in: notificationIds } },
        { isRead: true }
      );
      console.log(`✅ Marked ${notificationIds.length} notifications as read`);
    } catch (error) {
      console.error('❌ Error marking notifications as read:', error);
      throw error;
    }
  }

  // Clean up expired notifications (called by cron job)
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notifies.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired notifications`);
      }
      
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up expired notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
