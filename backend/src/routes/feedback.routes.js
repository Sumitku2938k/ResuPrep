const express = require('express');
const router = express.Router();
const { create, getPublic } = require('../controllers/feedback.controller');
const validate = require('../middleware/validate');
const { feedbackSchema } = require('../validators/schemas');

router.post('/', validate(feedbackSchema), create);
router.get('/public', getPublic);

module.exports = router;
