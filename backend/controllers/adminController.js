const { ErrorResponse } = require('../utils/errorHandlers');
const Request = require('../models/request');
const User = require('../models/user');
const Benefit = require('../models/benefit');
const AuditLog = require('../models/auditLog');

// Get all benefit requests (admin dashboard)

exports.getAllRequests = async (req, res, next) => {
  try {
    const { status, rank } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (rank) filter['user.rank'] = rank;

    const requests = await Request.find(filter)
      .populate('user', 'email rank')
      .populate('benefit', 'name eligibleRanks')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err) {
    next(err);
  }
};

// Get all users (admin dashboard)

exports.getUsers = async (req, res, next) => {
  try {
    const { role, rank } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (rank) filter.rank = rank;

    const users = await User.find(filter)
      .select('-password -__v')
      .sort({ rank: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

