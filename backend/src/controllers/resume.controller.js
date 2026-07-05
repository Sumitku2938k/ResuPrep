const ResumeAnalysis = require('../models/ResumeAnalysis');
const { parseFile } = require('../services/fileParser.service');
const { analyzeResume } = require('../services/ai.service');
const ApiResponse = require('../utils/apiResponse');

exports.analyze = async (req, res, next) => {
  try {
    let resumeText = req.body.resumeText || '';
    const jobDescription = req.body.jobDescription;

    if (!jobDescription) {
      return ApiResponse.badRequest(res, 'Job description is required');
    }

    if (req.file) {
      resumeText = await parseFile(req.file.buffer, req.file.mimetype);
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return ApiResponse.badRequest(res, 'Resume text is too short or empty. Upload a file or paste resume text.');
    }

    const result = await analyzeResume(resumeText, jobDescription);

    const analysis = await ResumeAnalysis.create({
      user: req.user ? req.user._id : null,
      resumeText,
      jobDescription,
      fileName: req.file ? req.file.originalname : 'pasted-text',
      result,
    });

    ApiResponse.success(res, { analysis }, 'Resume analyzed successfully');
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);

    const analyses = await ResumeAnalysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-resumeText -jobDescription');

    ApiResponse.success(res, { analyses });
  } catch (error) {
    next(error);
  }
};

exports.getHistoryById = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);

    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) return ApiResponse.notFound(res, 'Analysis not found');

    ApiResponse.success(res, { analysis });
  } catch (error) {
    next(error);
  }
};

exports.deleteHistory = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);

    const analysis = await ResumeAnalysis.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) return ApiResponse.notFound(res, 'Analysis not found');

    ApiResponse.success(res, null, 'Analysis deleted successfully');
  } catch (error) {
    next(error);
  }
};
