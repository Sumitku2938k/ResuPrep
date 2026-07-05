const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

const parseFile = async (buffer, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    throw new Error('Unsupported file type');
  } catch (error) {
    logger.error(`File parsing error: ${error.message}`);
    throw new Error('Failed to parse file. Please ensure it is a valid PDF or DOCX.');
  }
};

module.exports = { parseFile };
