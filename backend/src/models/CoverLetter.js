const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: { type: String, required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    hiringManager: { type: String, default: 'Hiring Manager' },
    keySkills: { type: String, default: '' },
    achievement: { type: String, default: '' },
    tone: {
      type: String,
      enum: ['professional', 'enthusiastic', 'concise'],
      default: 'professional',
    },
    generatedLetter: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CoverLetter', coverLetterSchema);
