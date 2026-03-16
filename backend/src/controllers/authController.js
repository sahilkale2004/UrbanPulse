const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider
    }
  });
};

// @desc    Register user (Local)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      if (user.authProvider === 'google') {
        return res.status(400).json({ success: false, error: 'Email registered with Google. Please use Continue with Google.' });
      }
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: role || 'citizen',
      authProvider: 'local'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (Local)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.authProvider === 'google' && !user.password) {
       return res.status(401).json({ success: false, error: 'Please use Continue with Google to login.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Sync Supabase Google Login
// @route   POST /api/auth/google
// @access  Public
// Called by the frontend after a successful Google login via Supabase
exports.googleLogin = async (req, res, next) => {
  try {
    const { email, name, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required from Google Auth' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but is local, we could link it, or just log them in
      // For now, let them login normally since they own the email
      sendTokenResponse(user, 200, res);
    } else {
      // Create a new user from Google payload
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        role: role || 'citizen',
        authProvider: 'google'
      });
      sendTokenResponse(user, 201, res);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
