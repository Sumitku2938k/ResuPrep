const Template = require('../models/Template');
const ApiResponse = require('../utils/apiResponse');

exports.getAll = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category && category !== 'all') filter.category = category;

    const templates = await Template.find(filter).sort({ name: 1 });
    ApiResponse.success(res, { templates });
  } catch (error) {
    next(error);
  }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const template = await Template.findOne({ slug: req.params.slug, isActive: true });
    if (!template) return ApiResponse.notFound(res, 'Template not found');
    ApiResponse.success(res, { template });
  } catch (error) {
    next(error);
  }
};
