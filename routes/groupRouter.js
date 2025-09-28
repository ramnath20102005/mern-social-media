const router = require('express').Router();
const groupCtrl = require('../controllers/groupCtrl');
const auth = require('../middleware/auth');

// Group management routes
router.post('/create', auth, groupCtrl.createGroup);
router.get('/my-groups', auth, groupCtrl.getUserGroups);
router.get('/:id', auth, groupCtrl.getGroup);
router.delete('/:id', auth, groupCtrl.deleteGroup);

// Group invitation routes
router.post('/:id/invite', auth, groupCtrl.inviteToGroup);
router.post('/invites/:id/respond', auth, groupCtrl.respondToInvite);
router.get('/invites/pending', auth, groupCtrl.getPendingInvites);

// Group membership routes
router.post('/:id/leave', auth, groupCtrl.leaveGroup);

module.exports = router;
