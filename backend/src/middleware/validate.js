const ApiResponse = require('../utils/apiResponse');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const target = req[property] || {};
    const { error, value } = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return ApiResponse.badRequest(res, 'Validation failed', errors);
    }

    req[property] = value;
    next();
  };
};

module.exports = validate;
