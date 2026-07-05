const express = require('express');
const router = express.Router();
const { analyze, getHistory, getHistoryById, deleteHistory } = require('../controllers/resume.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/analyze', optionalAuth, upload.single('resume'), analyze);
router.get('/history', protect, getHistory);
router.get('/history/:id', protect, getHistoryById);
router.delete('/history/:id', protect, deleteHistory);

module.exports = router;
