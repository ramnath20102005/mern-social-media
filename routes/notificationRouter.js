const router = require('express').Router();
const auth = require('../middleware/auth');
const { 
  getUserNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  getUnreadCount 
} = require('../utils/notificationService');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const notifications = await getUserNotifications(req.user._id, parseInt(limit));
    
    res.json({
      notifications,
      unreadCount: await getUnreadCount(req.user._id)
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ count });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const success = await markNotificationRead(req.user._id, req.params.id);
    
    if (success) {
      res.json({ msg: 'Notification marked as read' });
    } else {
      res.status(404).json({ msg: 'Notification not found' });
    }
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const success = await markAllNotificationsRead(req.user._id);
    
    if (success) {
      res.json({ msg: 'All notifications marked as read' });
    } else {
      res.status(404).json({ msg: 'No notifications found' });
    }
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
