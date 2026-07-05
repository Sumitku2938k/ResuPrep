const ApiResponse = require('../utils/apiResponse');

const notFound = (req, res) => {
  ApiResponse.notFound(res, `Route not found: ${req.originalUrl}`);
};

module.exports = notFound;
