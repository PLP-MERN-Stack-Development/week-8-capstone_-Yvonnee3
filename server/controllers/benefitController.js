const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Benefit = require('../models/benefit');
const Request = require('../models/request');
require('dotenv').config();

const ADMIN_ROLE = 'employer';
const JWT_SECRET = 'secret'
// Helper: Verify admin status from JWT cookie
const verifyAdmin = async (req) => {
  const token = req.cookies.jwt;
  if (!token) return { error: 'Authentication token missing', status: 401 };
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const adminUser = await User.findById(decoded.id).select('role');
    
    if (!adminUser || adminUser.role !== ADMIN_ROLE) {
      return { error: 'Admin privileges required', status: 403 };
    }
    
    return { userId: decoded.id };
  } catch (err) {
    return { error: err.name === 'JsonWebTokenError' ? 'Invalid token' : 'Authorization failed', status: 401 };
  }
};

// Base handler for admin operations
const handleAdminOperation = async (req, res, operation) => {
  const { error, status, userId } = await verifyAdmin(req);
  if (error) return res.status(status).json({ success: false, error });
  
  try {
    return await operation(userId);
  } catch (err) {
    console.error('Operation error:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid benefit ID format' });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Benefit already exists' });
    }
    
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// Get all benefits for admin
exports.getBenefits = async (req, res) => {
  await handleAdminOperation(req, res, async () => {
    const benefits = await Benefit.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: benefits });
  });
};

// Create new benefit (Admin only)
exports.createBenefit = async (req, res) => {
  await handleAdminOperation(req, res, async (userId) => {
    const { benefitType, rateTiers, ...rest } = req.body;
    
    // Validate benefit data
    if (benefitType === 'fixed' && !rest.amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount is required for fixed benefits' 
      });
    }
    
    if (benefitType === 'tiered' && (!rateTiers || rateTiers.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rate tiers are required for tiered benefits' 
      });
    }
    
    const benefitData = {
      ...rest,
      benefitType,
      createdBy: userId,
      rateTiers: benefitType === 'tiered' ? rateTiers : undefined
    };
    
    const benefit = await Benefit.create(benefitData);
    res.status(201).json({ success: true, data: benefit });
  });
};

// Update Benefit (Admin Only)
exports.updateBenefit = async (req, res) => {
  await handleAdminOperation(req, res, async (userId) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw { name: 'ValidationError', errors: { body: { message: 'No update data provided' } } };
    }
    
    const { benefitType, rateTiers, ...updateData } = req.body;
    
    // Prepare update object
    const update = {
      ...updateData,
      lastModifiedBy: userId,
      updatedAt: new Date()
    };
    
    // Handle tier updates if benefit type is tiered
    if (benefitType === 'tiered') {
      update.rateTiers = rateTiers;
    }
    
    const updated = await Benefit.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    
    if (!updated) throw new Error('Benefit not found');
    res.status(200).json({ success: true, data: updated });
  });
};

// Delete Benefit (Admin Only)
exports.deleteBenefit = async (req, res) => {
  await handleAdminOperation(req, res, async (userId) => {
    const deleted = await Benefit.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      throw new Error('Benefit not found');
    }
    
    // Also delete any pending requests for this benefit
    await Request.deleteMany({ benefit: deleted._id });
    
    res.status(200).json({ 
      success: true,
      data: { id: deleted._id, name: deleted.name },
      message: 'Benefit permanently deleted'
    });
  });
};

// Get benefits for employee
exports.getEmployeeBenefits = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) throw new Error('No authentication token found');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('rank role tenureMonths');
    
    if (!user) throw new Error('User not found');
    if (user.role === ADMIN_ROLE) {
      return res.status(403).json({ success: false, error: 'This route is for employees only' });
    }

    // Get all active benefits for user's rank
    const benefits = await Benefit.find({ 
      eligibleRanks: user.rank, 
      isActive: true 
    });

    // Get user's requested benefits
    const userRequests = await Request.find({ 
      user: user._id,
      status: { $in: ['pending', 'approved'] }
    }).select('benefit status');

    const requestedBenefitIds = userRequests.map(r => r.benefit.toString());

    // Enhance benefits with applicable rates and request status
    const enhancedBenefits = benefits.map(benefit => {
      const benefitObj = benefit.toObject();
      
      // Check if benefit is auto-applied or already requested
      benefitObj.isRequested = requestedBenefitIds.includes(benefit._id.toString()) || benefit.autoApply;
      benefitObj.requestStatus = userRequests.find(r => 
        r.benefit.toString() === benefit._id.toString()
      )?.status || (benefit.autoApply ? 'auto-applied' : null);

      // Add rate info for tiered benefits
      if (benefit.benefitType === 'tiered') {
        const tier = benefit.rateTiers.find(t => t.rank === user.rank);
        benefitObj.applicableRate = tier ? tier.rate : null;
        benefitObj.rateDescription = tier ? tier.description : 'Rate not available for your rank';
      }

      return benefitObj;
    });

    res.status(200).json({ success: true, data: enhancedBenefits });
    
  } catch (err) {
    const status = err.name === 'JsonWebTokenError' ? 401 : 
                  err.message === 'User not found' ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

exports.getBenefitsStats = async (req, res) => {
  try {
    // Count all benefits
    const totalBenefits = await Benefit.countDocuments();
    
    // Count active benefits
    const activeBenefits = await Benefit.countDocuments({ isActive: true });
    
    // Count auto-applied benefits
    const autoAppliedBenefits = await Benefit.countDocuments({ autoApply: true });

    res.status(200).json({
      success: true,
      data: {
        totalBenefits,
        activeBenefits,
        autoAppliedBenefits
      }
    });
  } catch (error) {
    console.error('Error fetching benefits stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benefits statistics'
    });
  }
};