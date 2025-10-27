const Notifies = require('../models/notifyModel');
const NotificationService = require('../services/notificationService');

const notifyCtrl = {
  createNotify: async (req, res) => {
    try {
      const { id, recipients, url, text, content, image, type = 'mention', priority = 'medium' } = req.body;

      if (recipients.includes(req.user._id.toString())) return;

      const notify = new Notifies({
        id,
        recipients,
        url,
        text,
        content,
        image,
        type,
        priority,
        user: req.user._id,
      });

      await notify.save();
      return res.json({ notify });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  removeNotify: async (req, res) => {
    try {
      const notify = await Notifies.findOneAndDelete({
        id: req.params.id,
        url: req.query.url,
      });
      return res.json({ notify });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getNotifies: async (req, res) => {
    try {
      const notifies = await Notifies.find({ recipients: req.user._id })
        .sort("-createdAt")
        .populate("user", "avatar username");

      return res.json({ notifies });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  isReadNotify: async (req, res) => {
    try {
      const notifies = await Notifies.findOneAndUpdate(
        { _id: req.params.id },
        {
          isRead: true,
        }
      );

      return res.json({ notifies });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteAllNotifies: async (req, res) => {
    try {
      const notifies = await Notifies.deleteMany({ recipients: req.user._id });

      return res.json({ notifies });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Enhanced notification endpoints using the service
  getNotificationsByType: async (req, res) => {
    try {
      const { type, isRead, limit, page } = req.query;
      
      const notifications = await NotificationService.getUserNotifications(req.user._id, {
        type,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : null,
        limit: parseInt(limit) || 20,
        page: parseInt(page) || 1
      });

      return res.json({ notifications });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  markMultipleAsRead: async (req, res) => {
    try {
      const { notificationIds } = req.body;
      
      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({ msg: 'notificationIds must be an array' });
      }

      await NotificationService.markAsRead(notificationIds);
      return res.json({ msg: 'Notifications marked as read' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getNotificationStats: async (req, res) => {
    try {
      const stats = await Notifies.aggregate([
        { $match: { recipients: req.user._id } },
        {
          $group: {
            _id: '$type',
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
          }
        }
      ]);

      const totalUnread = await Notifies.countDocuments({
        recipients: req.user._id,
        isRead: false
      });

      return res.json({ stats, totalUnread });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = notifyCtrl;