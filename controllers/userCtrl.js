const Users = require("../models/userModel");
const bcrypt = require('bcrypt');
const NotificationService = require('../services/notificationService');

const userCtrl = {
  searchUser: async (req, res) => {
    try {
      const { username, type = 'all', limit = 10 } = req.query;
      
      if (!username || username.trim().length === 0) {
        return res.json({ users: [], posts: [], hashtags: [] });
      }

      const searchTerm = username.trim();
      const searchRegex = new RegExp(searchTerm.split('').join('.*'), 'i'); // Fuzzy search regex
      const exactRegex = new RegExp(searchTerm, 'i');
      
      let results = {};

      // Search users with fuzzy matching
      if (type === 'all' || type === 'users') {
        const users = await Users.find({
          $or: [
            { username: exactRegex }, // Exact matches first
            { fullname: exactRegex },
            { username: searchRegex }, // Then fuzzy matches
            { fullname: searchRegex },
            { bio: exactRegex }
          ]
        })
        .limit(parseInt(limit))
        .select("fullname username avatar bio followers following")
        .sort({ 
          // Prioritize exact matches
          username: searchTerm.toLowerCase() === username ? -1 : 1,
          followers: -1 // Then by popularity
        });

        results.users = users;
      }

      // Search posts (if Posts model exists)
      if (type === 'all' || type === 'posts') {
        try {
          const Posts = require("../models/postModel");
          const posts = await Posts.find({
            $or: [
              { content: exactRegex },
              { content: searchRegex }
            ]
          })
          .limit(parseInt(limit))
          .populate('user', 'fullname username avatar')
          .select("content images createdAt likes comments")
          .sort({ createdAt: -1 });

          results.posts = posts;
        } catch (err) {
          results.posts = [];
        }
      }

      // Search hashtags
      if (type === 'all' || type === 'hashtags') {
        const hashtagRegex = new RegExp(`#${searchTerm}`, 'i');
        try {
          const Posts = require("../models/postModel");
          const hashtagPosts = await Posts.find({
            content: hashtagRegex
          })
          .limit(5)
          .select("content");

          // Extract unique hashtags
          const hashtags = [];
          const hashtagSet = new Set();
          
          hashtagPosts.forEach(post => {
            const matches = post.content.match(/#\w+/g);
            if (matches) {
              matches.forEach(tag => {
                const cleanTag = tag.toLowerCase();
                if (cleanTag.includes(searchTerm.toLowerCase()) && !hashtagSet.has(cleanTag)) {
                  hashtagSet.add(cleanTag);
                  hashtags.push({
                    tag: cleanTag,
                    count: Math.floor(Math.random() * 1000) + 10 // Placeholder count
                  });
                }
              });
            }
          });

          results.hashtags = hashtags.slice(0, 5);
        } catch (err) {
          results.hashtags = [];
        }
      }

      res.json(results);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.params.id)
        .select("-password")
        .populate("followers following", "-password");

      if (!user) {
        return res.status(400).json({ msg: "requested user does not exist." });
      }

      // Get post count for this user
      const Posts = require('../models/postModel');
      const postCount = await Posts.countDocuments({ user: req.params.id });

      // Add post count to user object
      const userWithPosts = {
        ...user.toObject(),
        posts: Array(postCount).fill(null), // Create array with correct length for compatibility
        postCount: postCount
      };

      res.json({ user: userWithPosts });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const {
        avatar,
        fullname,
        mobile,
        address,
        story,
        website,
        gender,
      } = req.body;
      if (!fullname) {
        return res.status(400).json({ msg: "Please add your full name." });
      }

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { avatar, fullname, mobile, address, story, website, gender }
      );

      res.json({ msg: "Profile updated successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  follow: async (req, res) => {
    try {
      // Check if user exists
      const targetUser = await Users.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ msg: "User not found." });
      }

      // Check if current user exists
      const currentUser = await Users.findById(req.user._id);
      if (!currentUser) {
        return res.status(404).json({ msg: "Current user not found." });
      }

      // Check if already following using ObjectId comparison
      const isAlreadyFollowing = currentUser.following.includes(req.params.id);
      
      if (isAlreadyFollowing) {
        return res.status(400).json({ msg: "You are already following this user." });
      }

      // Add follower to target user
      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        { $addToSet: { followers: req.user._id } }, // $addToSet prevents duplicates
        { new: true }
      ).populate("followers following", "-password");

      // Add following to current user
      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { $addToSet: { following: req.params.id } }, // $addToSet prevents duplicates
        { new: true }
      );

      // Create follow notification
      try {
        await NotificationService.createFollowNotification(req.user._id, req.params.id);
      } catch (notifyError) {
        console.error('Error creating follow notification:', notifyError);
        // Don't fail the follow action if notification fails
      }

      res.json({ newUser });
    } catch (err) {
      console.error('Follow error:', err);
      return res.status(500).json({ msg: err.message });
    }
  },

  unfollow: async (req, res) => {
    try {
      // Check if user exists
      const targetUser = await Users.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ msg: "User not found." });
      }

      // Check if current user exists
      const currentUser = await Users.findById(req.user._id);
      if (!currentUser) {
        return res.status(404).json({ msg: "Current user not found." });
      }

      // Check if actually following using ObjectId comparison
      const isFollowing = currentUser.following.includes(req.params.id);
      
      if (!isFollowing) {
        return res.status(400).json({ msg: "You are not following this user." });
      }

      // Remove follower from target user
      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { followers: req.user._id } },
        { new: true }
      ).populate('followers following', '-password');

      // Remove following from current user
      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { $pull: { following: req.params.id } },
        { new: true }
      );

      // Remove follow notification
      try {
        await NotificationService.removeFollowNotification(req.user._id, req.params.id);
      } catch (notifyError) {
        console.error('Error removing follow notification:', notifyError);
        // Don't fail the unfollow action if notification removal fails
      }

      res.json({ newUser });
    } catch (err) {
      console.error('Unfollow error:', err);
      return res.status(500).json({ msg: err.message });
    }
  },

  suggestionsUser: async (req, res) => {
    try {
      const newArr = [...req.user.following, req.user._id];

      const num = req.query.num || 10;
      const users = await Users.aggregate([
        { $match: { _id: { $nin: newArr } } },
        { $sample: { size: Number(num) } },
        {
          $lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            as: "followers",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "following",
            foreignField: "_id",
            as: "following",
          },
        },
      ]).project("-password");

      return res.json({
        users,
        result: users.length,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },



};

module.exports = userCtrl;
