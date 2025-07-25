const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Benefit = require('../models/benefit');
const Request = require('../models/request');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const { getGfs, gfs, upload,gridFSManager } = require('../utils/fileUtils');
require('dotenv').config();
const JWT_SECRET = 'secret'
const ADMIN_ROLE = 'employer';

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

// Verify admin specifically
const verifyAdmin = async (req) => {
  const { error, status, userId, user } = await verifyUser(req);
  if (error) return { error, status };
  
  if (user.role !== ADMIN_ROLE) {
    return { error: 'Admin privileges required', status: 403 };
  }
  
  return { userId };
};

// Base handler for requests
const handleRequest = async (req, res, operation, requireAdmin = false) => {
  const verifier = requireAdmin ? verifyAdmin : verifyUser;
  const { error, status } = await verifier(req);
  if (error) return res.status(status).json({ success: false, error });
  
  try {
    return await operation();
  } catch (err) {
    console.error('Request error:', err);
    const status = err.name === 'ValidationError' ? 400 : 
                  err.name === 'CastError' ? 400 : 500;
    res.status(status).json({ 
      success: false, 
      error: err.message || 'Request processing failed' 
    });
  }
};

// Configure timeout based on file size (minimum 2 minutes, +1s per MB)
const calculateTimeout = (fileSize, attempt = 1) => {
  const baseTimeout = 7500; // 5 minutes base timeout
  const sizeFactor = Math.floor(fileSize / (1024 * 1024)) * 1000; // +1s per MB
  const attemptFactor = Math.min(attempt * 300, 3000); // +30s per attempt up to 5min
  return baseTimeout + sizeFactor + attemptFactor;
};

// Get all requests (admin view)
exports.getAllRequests = async (req, res) => {
  await handleRequest(req, res, async () => {
    const requests = await Request.find({})
      .populate({
        path: 'user',
        select: 'firstName lastName email rank role',
        model: 'User'
      })
      .populate('benefit', 'name description benefitType amount rateTiers eligibleRanks minTenure')
      .populate('reviewerComments.reviewedBy', 'firstName lastName');

    res.status(200).json({ success: true, data: requests });
  }, true);
};

// Get user's requests (employee view)
exports.getUserRequests = async (req, res) => {
  await handleRequest(req, res, async () => {
    const { userId, user } = await verifyUser(req);
    
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid user ID format');
    }

    const requests = await Request.find({ 
      user: new mongoose.Types.ObjectId(userId) 
    })
    .populate({
      path: 'benefit',
      select: 'name description benefitType amount rateTiers eligibleRanks minTenure',
      model: 'benefit'
    })
    .populate({
      path: 'user',
      select: 'firstName lastName email rank',
      model: 'User'
    })
    .populate('reviewerComments.reviewedBy', 'firstName lastName');

    res.status(200).json({ success: true, data: requests });
  });
};

// Request a benefit
exports.requestBenefit = async (req, res) => {
  await handleRequest(req, res, async () => {
    const { userId, user } = await verifyUser(req);
    
    if (user.role === ADMIN_ROLE) {
      return res.status(403).json({ success: false, error: 'This route is for employees only' });
    }

    const { benefitId, documents = [] } = req.body; // Default to empty array if documents not provided

    // Make documents optional - only validate if they exist
    if (documents && !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        error: 'Documents must be provided as an array of objects with name and url fields'
      });
    }

    // Validate document fields only if documents exist
    if (documents && documents.some(doc => !doc?.name || !doc?.url)) {
      return res.status(400).json({
        success: false,
        error: 'Each document must contain both name and url fields'
      });
    }

    const benefit = await Benefit.findOne({
      _id: benefitId,
      isActive: true,
      eligibleRanks: user.rank
    });

    if (!benefit) {
      return res.status(400).json({ 
        success: false, 
        error: 'Benefit not available or you are not eligible' 
      });
    }

    if (user.tenureMonths < benefit.minTenure) {
      return res.status(400).json({
        success: false,
        error: `Minimum tenure requirement not met (${benefit.minTenure} months required)`
      });
    }

    const existingRequest = await Request.findOne({
      user: userId,
      benefit: benefitId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest || benefit.autoApply) {
      return res.status(400).json({
        success: false,
        error: 'Benefit already applied for or auto-applied'
      });
    }

    // Skip document requirement check for development
    const request = await Request.create({
      user: userId,
      benefit: benefitId,
      status: 'pending',
      documents: documents ? documents.map(doc => ({
        name: doc.name,
        url: doc.url,
        ...(doc.s3Key && { s3Key: doc.s3Key })
      })) : [] // Default to empty array if no documents
    });

    res.status(201).json({ 
      success: true, 
      data: request,
      message: 'Benefit request submitted successfully'
    });
  });
};

// Cancel a benefit request
exports.cancelRequest = async (req, res) => {
  await handleRequest(req, res, async () => {
    const { userId } = await verifyUser(req);
    const { requestId } = req.params;

    const deletedRequest = await Request.findOneAndDelete({
      _id: requestId,
      user: userId,
      status: 'pending'
    });

    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or cannot be canceled'
      });
    }

    res.status(200).json({
      success: true,
      data: { id: deletedRequest._id },
      message: 'Request canceled successfully'
    });
  });
};

// Review/update request status (admin)
exports.reviewRequest = async (req, res) => {
  await handleRequest(req, res, async () => {
    const { userId } = await verifyAdmin(req);
    const { requestId } = req.params;
    const { status, comment, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'needs_revision', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be either "approved", "rejected", or "needs_revision"'
      });
    }

    // Validate rejection reason if status is rejected
    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required when rejecting a request'
      });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    const reviewDate = new Date();
    const update = {
      status,
      lastReviewDate: reviewDate,
      // Update the rejection reason at the request level if status is rejected
      ...(status === 'rejected' && { rejectionReason }),
      $push: {
        reviewerComments: {
          text: comment || '',
          reviewedBy: userId,
          statusAtReview: status,
          createdAt: reviewDate,
          // Include rejection reason in the review comment if applicable
          ...(status === 'rejected' && { rejectionReason })
        }
      }
    };

    // If this is the first approval/rejection, set processedAt
    if (request.status === 'pending' && status !== 'pending') {
      update.processedAt = reviewDate;
    }

    // Clear rejection reason if status is no longer rejected
    if (status !== 'rejected' && request.rejectionReason) {
      update.rejectionReason = undefined;
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      update,
      { new: true }
    )
    .populate('reviewerComments.reviewedBy', 'firstName lastName')
    .populate('user', 'firstName lastName email rank')
    .populate('benefit', 'name description benefitType');

    res.status(200).json({
      success: true,
      data: updatedRequest,
      message: `Request status updated to ${status} successfully`
    });
  }, true); // true indicates admin-only access
};

exports.getRequestsStats = async (req, res) => {
  try {
    // Count all requests
    const totalRequests = await Request.countDocuments();
    
    // Count requests by status
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const approvedRequests = await Request.countDocuments({ status: 'approved' });
    const rejectedRequests = await Request.countDocuments({ status: 'rejected' });
    // Add more status counts if needed

    res.status(200).json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests
      }
    });
  } catch (error) {
    console.error('Error fetching requests stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests statistics'
    });
  }
};

// controllers/requestController.js
exports.getRecentRequests = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user is authenticated
    
    const recentRequests = await Request.find({ user: userId })
      .sort({ requestedAt: -1 }) // Most recent first
      .limit(5) // Limit to 5 most recent
      .populate('benefit', 'name description') // Include benefit details
      .lean(); // Return plain JS objects

    res.status(200).json({
      success: true,
      data: recentRequests.map(request => ({
        ...request,
        // Format date for display
        requestedAt: new Date(request.requestedAt).toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching recent requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent requests'
    });
  }
};

// Upload documents to a request
exports.uploadRequestDocuments = [
  upload.array('documents', 5),
  async (req, res) => {
    let uploadedDocuments = [];
    let gfs;
    let activeUploads = []; // Track active upload streams

    try {
      const { user } = await verifyUser(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const { requestId } = req.params;
      uploadedDocuments = [];

      // 1. Validate request ID format
      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid request ID format' 
        });
      }

      // 2. Verify files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      // 3. Verify request exists and is in editable state
      const request = await Request.findOne({
        _id: requestId,
        status: 'pending'
      }).populate('user');

      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'Request not found or not in editable state'
        });
      }

      // 4. Verify user has permission
      if (!user._id.equals(request.user._id) && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to modify this request'
        });
      }

      // 5. Initialize GridFS
      gfs = await gridFSManager.initialize();

      // 6. Process each file with dynamic timeout
      // 6. Process each file with retry logic
      for (const file of req.files) {
        let lastError;
        let attempt = 1;
        const maxAttempts = 3;
        
        while (attempt <= maxAttempts) {
          try {
            const fileId = new mongoose.Types.ObjectId();
            const timeoutDuration = calculateTimeout(file.size, attempt);
            const fileExt = path.extname(file.originalname);
            const filename = `${fileId.toString()}${fileExt}`;

            console.log(`Attempt ${attempt}: Uploading ${file.originalname} (${(file.size/1024/1024).toFixed(2)}MB) with ${timeoutDuration/1000}s timeout`);

            const uploadStream = gfs.openUploadStream(filename, {
              _id: fileId,
              metadata: {
                requestId,
                originalName: file.originalname,
                uploadedBy: user._id,
                size: file.size,
                mimetype: file.mimetype
              }
            });

            activeUploads.push(uploadStream);

            const document = {
              _id: fileId,
              filename,
              originalName: file.originalname,
              size: file.size,
              uploadDate: new Date(),
            };

            // Enhanced upload handling with chunk monitoring
            let bytesUploaded = 0;
            const uploadPromise = new Promise((resolve, reject) => {
              uploadStream.on('finish', () => {
                activeUploads = activeUploads.filter(u => u !== uploadStream);
                uploadedDocuments.push(document);
                resolve();
              });
              
              uploadStream.on('error', reject);
              
              uploadStream.on('data', (chunk) => {
                bytesUploaded += chunk.length;
                console.log(`Upload progress: ${((bytesUploaded/file.size)*100).toFixed(1)}%`);
              });
              
              uploadStream.end(file.buffer);
            });

            await Promise.race([
              uploadPromise,
              new Promise((_, reject) => setTimeout(() => {
                uploadStream.destroy();
                reject(new Error(`Upload timeout after ${timeoutDuration/1000}s`));
              }, timeoutDuration))
            ]);

            // Verify upload
            const fileDoc = await gfs.find({ _id: fileId }).next();
            if (!fileDoc) throw new Error('Upload verification failed');
            
            break; // Success - exit retry loop
          } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error.message);
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 5000 * attempt)); // Backoff delay
            }
            attempt++;
          }
        }

        if (attempt > maxAttempts && lastError) {
          throw lastError;
        }
      }

      // 7. Update request
      request.documents.push(...uploadedDocuments);
      request.lastUpdated = new Date();
      await request.save();

      return res.status(201).json({
        success: true,
        message: `${uploadedDocuments.length} document(s) uploaded successfully`,
        documents: uploadedDocuments.map(doc => ({
          id: doc._id,
          name: doc.originalName,
          size: doc.size,
          type: doc.contentType,
          url: `/api/documents/${doc._id}`
        }))
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      // Cleanup any partial uploads
      if (uploadedDocuments.length > 0 && gfs) {
        await Promise.all(
          uploadedDocuments.map(async (doc) => {
            try {
              // Check if file exists before attempting deletion
              const fileExists = await gfs.find({ _id: doc._id }).hasNext();
              if (fileExists) {
                await gfs.delete(doc._id);
                console.log(`Cleaned up ${doc._id}`);
              }
            } catch (cleanupError) {
              console.error(`Cleanup warning for ${doc._id}:`, cleanupError.message);
            }
          })
        );
      }

      // Abort any active upload streams
      activeUploads.forEach(uploadStream => {
        try {
          uploadStream.destroy();
        } catch (e) {
          console.error('Error aborting upload stream:', e);
        }
      });

      return res.status(500).json({
        success: false,
        error: error.message,
        retriesExhausted: error.retriesExhausted,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.stack
        })
      });
    }
  }
];


// Get document download stream
exports.getDocument = async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const file = await gfs.find({ _id: fileId }).next();
    
    if (!file) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found' 
      });
    }

    // Set proper headers
    res.set('Content-Type', file.metadata.mimetype);
    res.set('Content-Disposition', `attachment; filename="${file.metadata.originalName}"`);

    const downloadStream = gfs.openDownloadStream(fileId);
    downloadStream.pipe(res);
    
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      error: 'Invalid file ID' 
    });
  }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  await handleRequest(req, res, async () => {
    const { userId } = await verifyUser(req);
    const { requestId, fileId } = req.params;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: 'Request not found' 
      });
    }

    // Check if user owns the request
    if (request.user.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to modify this request' 
      });
    }

    // Remove from GridFS
    await gfs.delete(new mongoose.Types.ObjectId(fileId));

    // Remove from request documents
    request.documents = request.documents.filter(
      doc => doc.gridFSId.toString() !== fileId
    );
    await request.save();

    res.status(200).json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  });
};