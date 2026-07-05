const ApiResponse = require('../utils/apiResponse');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return ApiResponse.badRequest(res, 'Validation failed', errors);
    }

    req.body = value;
    next();
  };
};

module.exports = validate;
