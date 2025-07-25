const jwt = require('jsonwebtoken');
const { ErrorResponse } = require('../utils/errorHandlers');
const User = require('../models/user')
require('dotenv').config();
const JWT_SECRET = 'secret'
// Protect routes with JWT
// exports.authenticate = async (req, res, next) => {
//   try {
//     // 1. Get token from HTTP-only cookie
//     const token = req.cookies.token;
    
//     if (!token) {
//       return next({
//         success: false,
//         error: {
//           message: 'Not authorized',
//           statusCode: 401
//         }
//       });
//     }

//     // 2. Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // 3. Attach user to request object
//     req.user = await User.findById(decoded.id).select('-password');
    
//     if (!req.user) {
//       return next({
//         success: false,
//         error: {
//           message: 'User not found',
//           statusCode: 404
//         }
//       });
//     }

//     next();
//   } catch (err) {
//     return next({
//       success: false,
//       error: {
//         message: 'Invalid token',
//         statusCode: 401,
//         details: process.env.NODE_ENV === 'development' ? err.message : undefined
//       }
//     });
//   }
// };

module.exports.checkAuth = (req, res) => {
  const token = req.cookies.jwt;
  
  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  };

  try {
    // jwt.verify returns the decoded token - you need to capture it
    const decodedToken = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ 
      isAuthenticated: true, 
      user: decodedToken.id // Now this will work
    });
  } catch(err) {
    console.error('JWT verification error:', err.message);
    res.status(401).json({ 
      isAuthenticated: false,
      error: 'Invalid token' // Helpful for debugging
    });
  }
};


// Define role hierarchy (ascending order)
const rank_hierarchy = [
  'Support Staff',
  'Junior Officer',
  'Officer',
  'Senior Officer',
  'Assistant Director',
  'Deputy Director',
  'Director'
];

// Check if user has required rank or higher
exports.requireRank = (requiredRank) => (req, res, next) => {
  const userRankIndex = rank_hierarchy.indexOf(req.user.rank);
  const requiredRankIndex = rank_hierarchy.indexOf(requiredRank);

  if (userRankIndex === -1 || requiredRankIndex === -1) {
    return next(new ErrorResponse('Invalid rank specified', 400));
  }

  if (userRankIndex < requiredRankIndex) {
    return next(new ErrorResponse(`Access denied. Requires ${requiredRank} or higher`, 403));
  }

  next();
};

// Admin-only access
exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Admin access required', 403));
  }
  next();
};

// middleware/auth.js
exports.isAdmin = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Please log in' 
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Forbidden - Admin access required' 
    });
  }

  // User is admin, proceed to next middleware/route
  next();
};

exports.protect = async (req, res, next) => {
  try {
    // 1. Get token from cookies
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized - no token provided'
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 4. Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Not authorized - token failed'
    });
  }
};



