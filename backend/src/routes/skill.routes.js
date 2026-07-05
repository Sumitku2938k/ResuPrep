const express = require('express');
const router = express.Router();
const { getTaxonomy, gapAnalysis } = require('../controllers/skill.controller');

router.get('/taxonomy/:role', getTaxonomy);
router.post('/gap-analysis', gapAnalysis);

module.exports = router;
