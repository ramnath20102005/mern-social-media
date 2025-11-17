const bcrypt = require('bcrypt');
const Users = require('../models/userModel');
const Posts = require('../models/postModel');
const Comments = require('../models/commentModel');

const seedCtrl = {
  resetAndSeed: async (req, res) => {
    try {
      // Danger: clears collections in dev only
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ msg: 'Seeding disabled in production.' });
      }

      await Promise.all([
        Users.deleteMany({}),
        Posts.deleteMany({}),
        Comments.deleteMany({}),
      ]);

      // Create users
      const passwordHash = await bcrypt.hash('password123', 12);
      const adminPasswordHash = await bcrypt.hash('admin123', 12);
      const demoUsers = [
        { fullname: 'Alice Johnson', username: 'alice', email: 'alice@example.com', password: passwordHash, gender: 'female' },
        { fullname: 'Bob Smith', username: 'bob', email: 'bob@example.com', password: passwordHash, gender: 'male' },
        { fullname: 'Charlie Kim', username: 'charlie', email: 'charlie@example.com', password: passwordHash, gender: 'male' },
        { fullname: 'Diana Patel', username: 'diana', email: 'diana@example.com', password: passwordHash, gender: 'female' },
        // Seed requested admin
        { fullname: 'admin', username: 'admin', email: 'admin.com', password: adminPasswordHash, gender: 'male', role: 'admin' },
      ];

      const createdUsers = await Users.insertMany(demoUsers);

      // Follow relationships (everyone follows each other)
      for (let u of createdUsers) {
        const others = createdUsers.filter(x => String(x._id) !== String(u._id));
        u.following = others.map(o => o._id);
        u.followers = others.map(o => o._id);
        await u.save();
      }

      // Create posts
      const placeholderImgs = [
        'https://picsum.photos/id/1015/800/600',
        'https://picsum.photos/id/1025/800/600',
        'https://picsum.photos/id/1035/800/600',
        'https://picsum.photos/id/1045/800/600',
        'https://picsum.photos/id/1055/800/600',
      ];

      const postsPayload = [];
      createdUsers.forEach((u, idx) => {
        postsPayload.push({
          content: `Hello from @${u.username}! Loving Campus Connect #${idx + 1}`,
          images: [{ url: placeholderImgs[idx % placeholderImgs.length], public_id: `seed_${idx}` }],
          user: u._id,
          likes: [],
          comments: [],
        });
      });

      const createdPosts = await Posts.insertMany(postsPayload);

      // Likes and comments
      const commentsPayload = [];
      createdPosts.forEach((p, i) => {
        const liker = createdUsers[(i + 1) % createdUsers.length];
        p.likes.push(liker._id);

        const commenter = createdUsers[(i + 2) % createdUsers.length];
        commentsPayload.push({
          content: 'Nice post! 👏',
          likes: [],
          user: commenter._id,
          postId: p._id,
          // reply is a single ObjectId to another comment; omit for top-level
          // Set postUserId for reference
          postUserId: p.user,
        });
      });

      const createdComments = await Comments.insertMany(commentsPayload);
      // Attach comments to posts
      for (let c of createdComments) {
        await Posts.findByIdAndUpdate(c.postId, { $push: { comments: c._id } });
      }

      return res.json({
        msg: 'Database seeded successfully',
        users: createdUsers.length,
        posts: createdPosts.length,
        comments: createdComments.length,
      });
    } catch (err) {
      console.error('Seed error:', err);
      return res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = seedCtrl;
