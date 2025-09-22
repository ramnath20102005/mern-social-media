const router = require('express').Router();
const auth = require('../middleware/auth');
const storyCtrl = require('../controllers/storyCtrl');

router.post('/story', auth, storyCtrl.createStory);
router.get('/stories', auth, storyCtrl.getFeedStories);
router.delete('/story/:id', auth, storyCtrl.deleteStory);

module.exports = router;
