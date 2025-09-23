const router = require('express').Router();
const settingsCtrl = require('../controllers/settingsCtrl');
const auth = require('../middleware/auth');

// Get user settings
router.get('/', auth, settingsCtrl.getUserSettings);

// Update general settings
router.patch('/general', auth, settingsCtrl.updateGeneralSettings);

// Update privacy settings
router.patch('/privacy', auth, settingsCtrl.updatePrivacySettings);

// Update notification settings
router.patch('/notifications', auth, settingsCtrl.updateNotificationSettings);

// Change password
router.patch('/password', auth, settingsCtrl.changePassword);

// Toggle two-factor authentication
router.patch('/2fa', auth, settingsCtrl.toggleTwoFactorAuth);

// Download user data
router.get('/download', auth, settingsCtrl.downloadUserData);

// Delete account
router.delete('/account', auth, settingsCtrl.deleteAccount);

module.exports = router;
