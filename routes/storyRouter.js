const router = require('express').Router();
const auth = require('../middleware/auth');
const storyCtrl = require('../controllers/storyCtrl');

// Story CRUD operations
router.post('/story', auth, storyCtrl.createStory);
router.get('/stories', auth, storyCtrl.getFeedStories);
router.get('/my-stories', auth, storyCtrl.getMyStories);
router.delete('/story/:id', auth, storyCtrl.deleteStory);

// Story interactions
router.get('/story/:id/view', auth, storyCtrl.viewStory);
router.post('/story/:id/reply', auth, storyCtrl.replyToStory);
router.patch('/story/:id/extend', auth, storyCtrl.extendStory);

// Story analytics
router.get('/story/:id/analytics', auth, storyCtrl.getStoryAnalytics);

module.exports = router;
