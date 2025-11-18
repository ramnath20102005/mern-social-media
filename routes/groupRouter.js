const router = require('express').Router();
const groupCtrl = require('../controllers/groupCtrl');
const auth = require('../middleware/auth');
const { isGroupAdmin, isGroupCreator, isGroupMember } = require('../middleware/groupAuth');

// Group management routes
router.get('/recommended', auth, groupCtrl.getRecommendedGroups);
router.post('/create', auth, groupCtrl.createGroup);
router.get('/my-groups', auth, groupCtrl.getUserGroups);
router.get('/:id', auth, isGroupMember, groupCtrl.getGroup);
router.put('/:id/update', auth, isGroupAdmin, groupCtrl.updateGroup);
router.get('/:id/membership', auth, groupCtrl.checkMembership);
router.delete('/:id', auth, isGroupCreator, groupCtrl.deleteGroup);
router.post('/:id/extend-expiry', auth, isGroupAdmin, groupCtrl.extendExpiry);

// Avatar Management
router.post('/:id/avatar/upload', auth, isGroupAdmin, groupCtrl.uploadAvatar);
router.delete('/:id/avatar/delete', auth, isGroupAdmin, groupCtrl.deleteAvatar);
router.get('/avatar/generate/:groupName', groupCtrl.generateAvatar);

// Group invitation routes
router.post('/:id/invite', auth, isGroupMember, groupCtrl.inviteToGroup);
router.post('/invites/:id/respond', auth, groupCtrl.respondToInvite);
router.get('/invites/pending', auth, groupCtrl.getPendingInvites);

// Member Management
router.post('/:id/leave', auth, isGroupMember, groupCtrl.leaveGroup);
router.delete('/:id/remove-member/:userId', auth, isGroupAdmin, groupCtrl.removeMember);
router.put('/:id/promote/:userId', auth, isGroupCreator, groupCtrl.promoteMember);
router.put('/:id/demote/:userId', auth, isGroupCreator, groupCtrl.demoteMember);

// Group Settings & Info
router.put('/:id/settings', auth, isGroupAdmin, groupCtrl.updateSettings);
router.get('/:id/members', auth, isGroupMember, groupCtrl.getMembers);
router.get('/:id/media', auth, isGroupMember, groupCtrl.getGroupMedia);

module.exports = router;
