const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: 'User' },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feature: {
      type: String,
      enum: ['resume-analyzer', 'job-matcher', 'resume-builder', 'cover-letter', 'skill-assessment', 'general'],
      default: 'general',
    },
    message: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
