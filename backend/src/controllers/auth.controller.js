const User = require('../models/User');
const { generateToken, setTokenCookie } = require('../services/token.service');
const ApiResponse = require('../utils/apiResponse');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.badRequest(res, 'Email already registered');
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    ApiResponse.created(res, { user, token }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.unauthorized(res, 'Invalid email or password');
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    ApiResponse.success(res, { user, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  ApiResponse.success(res, null, 'Logged out successfully');
};

exports.getMe = async (req, res) => {
  ApiResponse.success(res, { user: req.user });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return ApiResponse.badRequest(res, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    ApiResponse.success(res, { token }, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
