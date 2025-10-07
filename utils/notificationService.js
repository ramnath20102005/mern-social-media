const Users = require('../models/userModel');

// Simple notification service (can be extended with push notifications, email, etc.)
const sendNotification = async ({ userId, type, title, message, data = {} }) => {
  try {
    console.log(`📧 Sending notification to user ${userId}: ${title}`);
    
    // Find the user
    const user = await Users.findById(userId);
    if (!user) {
      console.error(`❌ User ${userId} not found for notification`);
      return false;
    }

    // Create notification object with proper string conversion
    const notification = {
      id: Date.now().toString(),
      type: String(type),
      title: String(title),
      message: String(message),
      data: typeof data === 'object' ? JSON.stringify(data) : String(data),
      timestamp: new Date(),
      read: false
    };

    // Add to user's notifications array (initialize if doesn't exist)
    if (!user.notifications) {
      user.notifications = [];
    }

    user.notifications.unshift(notification);

    // Keep only last 50 notifications
    if (user.notifications.length > 50) {
      user.notifications = user.notifications.slice(0, 50);
    }

    await user.save();

    console.log(`✅ Notification sent successfully to ${user.fullname}`);
    return true;

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return false;
  }
};

// Get user notifications
const getUserNotifications = async (userId, limit = 20) => {
  try {
    const user = await Users.findById(userId).select('notifications');
    if (!user || !user.notifications) {
      return [];
    }

    return user.notifications.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    return [];
  }
};

// Mark notification as read
const markNotificationRead = async (userId, notificationId) => {
  try {
    const user = await Users.findById(userId);
    if (!user || !user.notifications) {
      return false;
    }

    const notification = user.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await user.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read
const markAllNotificationsRead = async (userId) => {
  try {
    const user = await Users.findById(userId);
    if (!user || !user.notifications) {
      return false;
    }

    user.notifications.forEach(notification => {
      notification.read = true;
    });

    await user.save();
    return true;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return false;
  }
};

// Get unread notification count
const getUnreadCount = async (userId) => {
  try {
    const user = await Users.findById(userId).select('notifications');
    if (!user || !user.notifications) {
      return 0;
    }

    return user.notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return 0;
  }
};

// Send group-related notifications
const sendGroupNotification = async ({ groupId, userIds, type, title, message, excludeUserId = null }) => {
  try {
    const promises = userIds
      .filter(userId => userId !== excludeUserId)
      .map(userId => sendNotification({
        userId,
        type,
        title,
        message,
        data: { groupId }
      }));

    const results = await Promise.all(promises);
    const successCount = results.filter(Boolean).length;
    
    console.log(`✅ Group notification sent to ${successCount}/${userIds.length} users`);
    return successCount;
  } catch (error) {
    console.error('❌ Error sending group notifications:', error);
    return 0;
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  sendGroupNotification
};
