const FAQ = require('../models/FAQ');
const ApiResponse = require('../utils/apiResponse');

exports.getAll = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const faqs = await FAQ.find(filter).sort({ category: 1, order: 1 });
    ApiResponse.success(res, { faqs });
  } catch (error) {
    next(error);
  }
};
