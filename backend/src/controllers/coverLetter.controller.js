const CoverLetter = require('../models/CoverLetter');
const { generateCoverLetter } = require('../services/ai.service');
const ApiResponse = require('../utils/apiResponse');

exports.generate = async (req, res, next) => {
  try {
    const generatedLetter = await generateCoverLetter(req.body);

    const coverLetter = await CoverLetter.create({
      ...req.body,
      generatedLetter,
      user: req.user ? req.user._id : null,
    });

    ApiResponse.created(res, { coverLetter }, 'Cover letter generated successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);
    const letters = await CoverLetter.find({ user: req.user._id }).sort({ createdAt: -1 });
    ApiResponse.success(res, { coverLetters: letters });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);
    const letter = await CoverLetter.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!letter) return ApiResponse.notFound(res, 'Cover letter not found');
    ApiResponse.success(res, { coverLetter: letter }, 'Updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);
    const letter = await CoverLetter.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!letter) return ApiResponse.notFound(res, 'Cover letter not found');
    ApiResponse.success(res, null, 'Deleted successfully');
  } catch (error) {
    next(error);
  }
};
