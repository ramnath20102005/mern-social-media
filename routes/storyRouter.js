const router = require('express').Router();
const auth = require('../middleware/auth');
const storyCtrl = require('../controllers/storyCtrl');

// Story CRUD operations
router.post('/story', auth, storyCtrl.createStory);
router.get('/stories', auth, storyCtrl.getFeedStories);
router.get('/my-stories', auth, storyCtrl.getMyStories);
router.delete('/story/:id', auth, storyCtrl.deleteStory);

// Story interactions
router.post('/stories/:id/view', auth, storyCtrl.viewStory);
router.post('/stories/:id/reply', auth, storyCtrl.replyToStory);
router.patch('/stories/:id/extend', auth, storyCtrl.extendStory);

// Story analytics
router.get('/stories/:id/analytics', auth, storyCtrl.getStoryAnalytics);

module.exports = router;
