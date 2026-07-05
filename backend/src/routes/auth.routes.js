const express = require('express');
const router = express.Router();
const { signup, login, logout, getMe, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema, changePasswordSchema } = require('../validators/schemas');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);

module.exports = router;
