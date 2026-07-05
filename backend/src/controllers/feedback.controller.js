const Feedback = require('../models/Feedback');
const ApiResponse = require('../utils/apiResponse');

exports.create = async (req, res, next) => {
  try {
    const feedback = await Feedback.create(req.body);
    ApiResponse.created(res, { feedback }, 'Thank you for your feedback!');
  } catch (error) {
    next(error);
  }
};

exports.getPublic = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(50);
    ApiResponse.success(res, { feedback });
  } catch (error) {
    next(error);
  }
};
