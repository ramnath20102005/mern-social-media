const mongoose = require("mongoose");
const { Schema } = mongoose;


const postSchema = new Schema(
  {
    content: String,
    images: {
      type: Array,
      required: true,
    },
    repostOf: { type: mongoose.Types.ObjectId, ref: 'post' },
    likes: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    comments: [
      {
        type: mongoose.Types.ObjectId,
        ref: "comment",
      },
    ],
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    reports: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    // New fields for enhanced post features
    location: {
      name: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      address: String
    },
    taggedUsers: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    feeling: {
      type: String,
      enum: [
        'happy', 'excited', 'grateful', 'blessed', 'loved', 'proud', 'amazing', 'fantastic',
        'sad', 'disappointed', 'frustrated', 'angry', 'worried', 'stressed', 'tired', 'sick',
        'motivated', 'inspired', 'confident', 'determined', 'focused', 'productive', 'successful',
        'relaxed', 'peaceful', 'calm', 'content', 'satisfied', 'comfortable', 'cozy'
      ]
    },
    activity: {
      type: String,
      enum: [
        'eating', 'drinking', 'cooking', 'working', 'studying', 'reading', 'writing', 'coding',
        'traveling', 'driving', 'walking', 'running', 'exercising', 'playing', 'watching',
        'listening', 'shopping', 'celebrating', 'partying', 'meeting', 'visiting', 'exploring',
        'relaxing', 'sleeping', 'waking up', 'getting ready', 'commuting', 'waiting'
      ]
    },
    privacy: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    }
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model('post', postSchema);