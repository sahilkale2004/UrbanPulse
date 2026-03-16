const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Protect routes
exports.protect = async (req, res, next) => {
  // Demo Override
  if (req.headers['x-municipal-pass'] === '123456') {
    req.user = { _id: 'demo-authority-id', role: 'authority', name: 'Demo Admin' };
    return next();
  }

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

// Optional auth for public routes
exports.optionalAuth = async (req, res, next) => {
  // Demo Override — also works for municipal access to public GET routes
  if (req.headers['x-municipal-pass'] === '123456') {
    req.user = { _id: 'demo-authority-id', role: 'authority', name: 'Demo Admin' };
    return next();
  }

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      console.error("Optional auth token failed:", error);
    }
  }
  next();
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
