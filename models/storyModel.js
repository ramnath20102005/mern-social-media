const mongoose = require('mongoose');
const { Schema } = mongoose;

const storySchema = new Schema({
  user: { type: mongoose.Types.ObjectId, ref: 'user', required: true },
  media: [
    {
      url: { type: String, required: true },
      public_id: { type: String }
    }
  ],
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('story', storySchema);
