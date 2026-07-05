const ResumeBuilder = require('../models/ResumeBuilder');
const ApiResponse = require('../utils/apiResponse');

exports.create = async (req, res, next) => {
  try {
    const resume = await ResumeBuilder.create({
      ...req.body,
      user: req.user ? req.user._id : null,
    });
    ApiResponse.created(res, { resume }, 'Resume saved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);
    const resumes = await ResumeBuilder.find({ user: req.user._id }).sort({ updatedAt: -1 });
    ApiResponse.success(res, { resumes });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);
    const resume = await ResumeBuilder.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return ApiResponse.notFound(res, 'Resume not found');
    ApiResponse.success(res, { resume });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);
    const resume = await ResumeBuilder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!resume) return ApiResponse.notFound(res, 'Resume not found');
    ApiResponse.success(res, { resume }, 'Resume updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);
    const resume = await ResumeBuilder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) return ApiResponse.notFound(res, 'Resume not found');
    ApiResponse.success(res, null, 'Resume deleted successfully');
  } catch (error) {
    next(error);
  }
};
