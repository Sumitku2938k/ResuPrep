const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/faq.controller');

router.get('/', getAll);

module.exports = router;
