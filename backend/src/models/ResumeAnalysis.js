const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resumeText: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: 'pasted-text',
    },
    result: {
      compatibilityScore: { type: Number, default: 0 },
      matchedKeywords: [String],
      missingKeywords: [String],
      skillGaps: [String],
      improvementTips: [String],
      summary: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
