const router = require('express').Router();
const auth = require('../middleware/auth');
const notifyCtrl = require('../controllers/notifyCtrl');

// Basic notification CRUD
router.post('/notify', auth, notifyCtrl.createNotify);
router.delete('/notify/:id', auth, notifyCtrl.removeNotify);
router.get("/notifies", auth, notifyCtrl.getNotifies);
router.patch("/isReadNotify/:id", auth, notifyCtrl.isReadNotify);
router.delete("/deleteAllNotify", auth, notifyCtrl.deleteAllNotifies);

// Enhanced notification endpoints
router.get("/notifications/filter", auth, notifyCtrl.getNotificationsByType);
router.patch("/notifications/read", auth, notifyCtrl.markMultipleAsRead);
router.get("/notifications/stats", auth, notifyCtrl.getNotificationStats);

module.exports = router;