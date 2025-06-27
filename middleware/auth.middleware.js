const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const RateLimit = require('express-rate-limit');

// Rate limiting for authentication endpoints
const authLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Token verification with additional security checks
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key',
      { algorithms: ['HS256'] }, // Specify allowed algorithm
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
};

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check multiple possible token locations
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        code: 'NO_TOKEN_PROVIDED'
      });
    }

    try {
      // Verify token with additional security checks
      const decoded = await verifyToken(token);

      // Check token expiration manually (redundant but adds safety)
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Get user with session validation (if using sessions)
      const user = await User.findById(decoded.id)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check if token was issued before password change
      if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
        return res.status(401).json({
          success: false,
          message: 'User recently changed password. Please log in again.',
          code: 'PASSWORD_CHANGED'
        });
      }

      // Attach minimal user data to request
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      };

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);

      let message = 'Not authorized to access this route';
      let code = 'INVALID_TOKEN';

      if (error.name === 'TokenExpiredError') {
        message = 'Token has expired';
        code = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
      }

      return res.status(401).json({
        success: false,
        message,
        code,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error in authentication',
      code: 'AUTH_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'No user information found',
        code: 'NO_USER_INFO'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
        code: 'UNAUTHORIZED_ROLE',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Additional security middleware
exports.security = {
  // Rate limiter for authentication endpoints
  authLimiter,

  // HSTS header middleware
  hsts: (req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  },

  // CSRF protection (to be used with CSRF token)
  csrf: (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
      if (!csrfToken || csrfToken !== req.csrfToken()) {
        return res.status(403).json({
          success: false,
          message: 'Invalid CSRF token',
          code: 'INVALID_CSRF'
        });
      }
    }
    next();
  },

  // CORS configuration
  cors: (allowedOrigins = []) => {
    return (req, res, next) => {
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
        );
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        );
      }

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }
};

// Token blacklisting check (if implementing token invalidation)
exports.checkTokenBlacklist = async (req, res, next) => {
  if (req.user && req.user.jti) { // jti = JWT ID
    const isBlacklisted = await checkIfTokenIsBlacklisted(req.user.jti);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated',
        code: 'TOKEN_INVALIDATED'
      });
    }
  }
  next();
};