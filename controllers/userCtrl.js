const Users = require("../models/userModel");

const userCtrl = {
  searchUser: async (req, res) => {
    try {
      const users = await Users.find({
        username: { $regex: req.query.username },
      })
        .limit(10)
        .select("fullname username avatar");

      res.json({ users });
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

      res.json({ user });
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
      // Prevent self-follow
      if (String(req.user._id) === String(req.params.id)) {
        const self = await Users.findById(req.user._id)
          .select("-password")
          .populate("followers following", "-password");
        return res.json({ newUser: self, authUser: self, followingCount: self.following?.length || 0 });
      }

      const user = await Users.find({
        _id: req.params.id,
        followers: req.user._id,
      });
      if (user.length > 0) {
        // Idempotent: already following, return current state with 200
        const target = await Users.findById(req.params.id)
          .select("-password")
          .populate("followers following", "-password");
        const authUser = await Users.findById(req.user._id)
          .select("-password")
          .populate("followers following", "-password");
        const followingCount = authUser.following?.length || 0;
        return res.json({ newUser: target, authUser, followingCount });
      }



      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        { $addToSet: { followers: req.user._id } },
        { new: true }
      ).populate("followers following", "-password");

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { $addToSet: { following: req.params.id } },
        { new: true }
      );

      // Fetch updated auth user to compute following count
      const authUser = await Users.findById(req.user._id)
        .select("-password")
        .populate("followers following", "-password");

      const followingCount = authUser.following?.length || 0;

      res.json({ newUser, authUser, followingCount });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unfollow: async (req, res) => {
    try {
      // Idempotent: if not currently following, just return current state
      const relation = await Users.find({ _id: req.user._id, following: req.params.id });
      if (relation.length === 0) {
        const target = await Users.findById(req.params.id)
          .select('-password')
          .populate('followers following', '-password');
        const authUser = await Users.findById(req.user._id)
          .select('-password')
          .populate('followers following', '-password');
        const followingCount = authUser.following?.length || 0;
        return res.json({ newUser: target, authUser, followingCount });
      }

      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { followers: req.user._id }
        },
        { new: true }
      ).populate('followers following', '-password');

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { $pull: { following: req.params.id } },
        { new: true }
      );

      // Fetch updated auth user to compute following count
      const authUser = await Users.findById(req.user._id)
        .select('-password')
        .populate('followers following', '-password');

      const followingCount = authUser.following?.length || 0;

      res.json({ newUser, authUser, followingCount });
    } catch (err) {
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
