const Stories = require('../models/storyModel');

const storyCtrl = {
  createStory: async (req, res) => {
    try {
      const { media, durationHours } = req.body; // media: [{url, public_id?}], durationHours: number of hours to keep story
      if (!media || !Array.isArray(media) || media.length === 0) {
        return res.status(400).json({ msg: 'Please add media to create a story.' });
      }
      // Clamp duration between 1 and 72 hours, default to 24 if not provided/invalid
      const hours = Math.max(1, Math.min(Number(durationHours) || 24, 72));
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      const story = await Stories.create({ user: req.user._id, media, expiresAt });
      const populated = await story.populate('user', 'username fullname avatar');
      return res.json({ msg: 'Story created.', story: populated, expiresAt });
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
      const stories = await Stories.find({ user: { $in: ids }, expiresAt: { $gt: new Date() } })
        .populate('user', 'username fullname avatar')
        .sort('-createdAt');
      return res.json({ result: stories.length, stories });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = storyCtrl;
