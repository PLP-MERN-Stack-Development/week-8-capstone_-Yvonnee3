// controllers/employeeDashboardController.js
const Benefit = require('../models/benefit');
const Request = require('../models/request');
require('dotenv').config();
const JWT_SECRET = 'secret'
// Helper: Verify user from JWT cookie
const verifyUser = async (req) => {
  const token = req.cookies.jwt;
  if (!token) return { error: 'Authentication token missing', status: 401 };
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return { error: 'User not found', status: 404 };
    return { userId: decoded.id, user };
  } catch (err) {
    return { 
      error: err.name === 'JsonWebTokenError' ? 'Invalid token' : 'Authorization failed', 
      status: 401 
    };
  }
};



exports.getEmployeeDashboardStats = async (req, res) => {
  try {
    // Now req.user should be available from the auth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const userId = req.user._id;
    const userRank = req.user.rank;
    const userTenure = req.user.tenureMonths;

    // Get available benefits (those the employee is eligible for)
    const availableBenefits = await Benefit.countDocuments({
      $and: [
        { isActive: true },
        { 
          $or: [
            { eligibleRanks: userRank },
            { eligibleRanks: { $size: 0 } } // Benefits with no rank restrictions
          ]
        },
        { minTenure: { $lte: userTenure } }
      ]
    });

    // Get active benefits (those the employee has been approved for)
    const activeBenefits = await Request.countDocuments({
      user: userId,
      status: 'approved'
    });

    // Get request counts
    const pendingRequests = await Request.countDocuments({
      user: userId,
      status: 'pending'
    });

    const approvedRequests = await Request.countDocuments({
      user: userId,
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      data: {
        availableBenefits,
        activeBenefits,
        pendingRequests,
        approvedRequests
      }
    });
  } catch (error) {
    console.error('Error fetching employee dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};