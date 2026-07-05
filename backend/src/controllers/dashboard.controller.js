const ResumeAnalysis = require('../models/ResumeAnalysis');
const ResumeBuilder = require('../models/ResumeBuilder');
const CoverLetter = require('../models/CoverLetter');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

exports.getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalAnalyses, totalResumes, totalLetters, totalFeedback, recentAnalyses] = await Promise.all([
      User.countDocuments(),
      ResumeAnalysis.countDocuments(),
      ResumeBuilder.countDocuments(),
      CoverLetter.countDocuments(),
      Feedback.countDocuments(),
      ResumeAnalysis.find().sort({ createdAt: -1 }).limit(5).select('fileName result.compatibilityScore createdAt'),
    ]);

    const avgScore = await ResumeAnalysis.aggregate([
      { $group: { _id: null, avg: { $avg: '$result.compatibilityScore' } } },
    ]);

    ApiResponse.success(res, {
      stats: {
        totalUsers,
        totalAnalyses,
        totalResumes,
        totalLetters,
        totalFeedback,
        averageScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : 0,
      },
      recentAnalyses,
    });
  } catch (error) {
    next(error);
  }
};
