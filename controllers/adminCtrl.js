const Posts = require("../models/postModel");
const Users = require("../models/userModel");
const Comments = require("../models/commentModel");
const Notify = require("../models/notifyModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminCtrl = {
  getTotalUsers: async (req, res) => {
    try {
      const users = await Users.find();
      const total_users = users.length;
      res.json({ total_users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getTotalPosts: async (req, res) => {
    try {
      const posts = await Posts.find({ repostOf: { $exists: false } });
      const total_posts = posts.length;
      res.json({ total_posts });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getTotalComments: async (req, res) => {
    try {
      const originals = await Posts.find({ repostOf: { $exists: false } }).select('_id');
      const originalIds = originals.map(p => p._id);
      const total_comments = await Comments.countDocuments({ postId: { $in: originalIds } });
      res.json({ total_comments });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getTotalLikes: async (req, res) => {
    try {
      const posts = await Posts.find({ repostOf: { $exists: false } });
      let total_likes = 0;
      await posts.map((post) => (total_likes += post.likes.length));
      res.json({ total_likes });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getTotalSpamPosts: async (req, res) => {
    try {
      const posts = await Posts.find({ repostOf: { $exists: false } });
      const reportedPosts = posts.filter(post => post.reports.length > 2);
      const total_spam_posts = reportedPosts.length;
      res.json({ total_spam_posts });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getSpamPosts: async (req, res) => {
    try {
      const posts = await Posts.find({ repostOf: { $exists: false } })
        .select("user createdAt reports content")
        .populate({ path: "user", select: "username avatar email" });
      const spamPosts = posts.filter((post) => post.reports.length > 1);

      res.json({ spamPosts });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteSpamPost: async (req, res) => {
    try {
      const post = await Posts.findOneAndDelete({
        _id: req.params.id,
      });

      await Comments.deleteMany({ _id: { $in: post.comments } });

      res.json({ msg: "Post deleted successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getTotalActiveUsers: async (req, res) => {
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const total_active_users = await Users.countDocuments({ updatedAt: { $gte: since } });
      return res.json({ total_active_users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getUsers: async (req, res) => {
    try {
      const users = await Users.find()
        .select("-password -saved -notifications -__v");
      return res.json({ users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  blockUser: async (req, res) => {
    try {
      const user = await Users.findByIdAndUpdate(
        req.params.id,
        { isBlocked: true },
        { new: true }
      ).select("-password");
      if (!user) return res.status(404).json({ msg: "User not found" });

      try {
        await Notify.create({
          user: req.user._id,
          recipients: [user._id],
          text: "Your account has been blocked by admin.",
          type: 'mention'
        });
      } catch (_) { /* ignore notify errors */ }

      return res.json({ msg: "User blocked successfully.", user });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unblockUser: async (req, res) => {
    try {
      const user = await Users.findByIdAndUpdate(
        req.params.id,
        { isBlocked: false },
        { new: true }
      ).select("-password");
      if (!user) return res.status(404).json({ msg: "User not found" });

      try {
        await Notify.create({
          user: req.user._id,
          recipients: [user._id],
          text: "Your account has been unblocked by admin.",
          type: 'mention'
        });
      } catch (_) { /* ignore notify errors */ }

      return res.json({ msg: "User unblocked successfully.", user });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  resetUserPassword: async (req, res) => {
    try {
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const user = await Users.findByIdAndUpdate(
        req.params.id,
        { password: passwordHash, mustChangePassword: true, $inc: { passwordResetCount: 1 } },
        { new: true }
      ).select("-password");
      if (!user) return res.status(404).json({ msg: "User not found" });
      return res.json({ msg: "Password reset successfully.", tempPassword });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getDashboardStats: async (req, res) => {
    try {
      const [total_users, total_posts, total_comments, blocked_count] = await Promise.all([
        Users.countDocuments(),
        Posts.countDocuments({ repostOf: { $exists: false } }),
        Comments.countDocuments({ postId: { $in: await Posts.find({ repostOf: { $exists: false } }).select('_id').then(p => p.map(p => p._id)) } }),
        Users.countDocuments({ isBlocked: true })
      ]);

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const total_active_users = await Users.countDocuments({ updatedAt: { $gte: since } });
      const new_users_7d = await Users.countDocuments({ createdAt: { $gte: since } });

      return res.json({
        total_users,
        total_posts,
        total_comments,
        total_active_users,
        new_users_7d,
        blocked_count
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getCommentsDetail: async (req, res) => {
    try {
      const comments = await Comments.find()
        .sort({ createdAt: -1 })
        .limit(30)
        .populate({ path: 'user', select: 'username email avatar' });

      const postIds = [...new Set(comments.map(c => c.postId).filter(Boolean))];
      const postsById = new Map();
      if (postIds.length) {
        const posts = await Posts.find({ _id: { $in: postIds } })
          .select('content user createdAt')
          .populate({ path: 'user', select: 'username email avatar' });
        posts.forEach(p => postsById.set(String(p._id), p));
      }

      const data = comments.map(c => ({
        _id: c._id,
        content: c.content,
        createdAt: c.createdAt,
        user: c.user,
        post: postsById.get(String(c.postId)) || null
      }));

      return res.json({ comments: data });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getAllPosts: async (req, res) => {
    try {
      const posts = await Posts.find({ repostOf: { $exists: false } })
        .select('content images user createdAt likes comments')
        .sort({ createdAt: -1 })
        .populate({ path: 'user', select: 'username email avatar' });
      return res.json({ posts });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getLikesDetail: async (req, res) => {
    try {
      const posts = await Posts.find({ repostOf: { $exists: false } })
        .select('content user createdAt likes')
        .sort({ createdAt: -1 })
        .populate({ path: 'user', select: 'username email avatar' })
        .populate({ path: 'likes', select: 'username email avatar' });

      const likes = [];
      for (const p of posts) {
        if (Array.isArray(p.likes) && p.likes.length) {
          for (const u of p.likes) {
            likes.push({
              post: { _id: p._id, content: p.content, createdAt: p.createdAt, user: p.user },
              user: u,
            });
          }
        }
      }

      return res.json({ likes });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  impersonateUser: async (req, res) => {
    try {
      const user = await Users.findById(req.params.id).populate('followers following', '-password');
      if (!user) return res.status(404).json({ msg: 'User not found' });
      if (user.isBlocked) return res.status(403).json({ msg: 'Target account is blocked.' });

      const access_token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
      return res.json({ msg: 'Impersonation token issued.', access_token, user: { ...user._doc, password: '' } });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = adminCtrl;