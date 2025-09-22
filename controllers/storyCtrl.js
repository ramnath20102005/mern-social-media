const Stories = require('../models/storyModel');

const storyCtrl = {
  createStory: async (req, res) => {
    try {
      const { media } = req.body; // [{url, public_id?}]
      if (!media || !Array.isArray(media) || media.length === 0) {
        return res.status(400).json({ msg: 'Please add media to create a story.' });
      }
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const story = await Stories.create({ user: req.user._id, media, expiresAt });
      const populated = await story.populate('user', 'username fullname avatar');
      return res.json({ msg: 'Story created.', story: populated });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteStory: async (req, res) => {
    try {
      const story = await Stories.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!story) {
        return res.status(404).json({ msg: 'Story not found or you do not have permission to delete it.' });
      }
      return res.json({ msg: 'Story deleted.' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getFeedStories: async (req, res) => {
    try {
      const ids = [req.user._id, ...req.user.following];
      const stories = await Stories.find({ user: { $in: ids } })
        .populate('user', 'username fullname avatar')
        .sort('-createdAt');
      return res.json({ result: stories.length, stories });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = storyCtrl;
