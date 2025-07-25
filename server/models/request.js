const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  benefit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'benefit',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_revision'],
    default: 'pending'
  },
  rejectionReason: String,

  documents: [{
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, required: true },
    metadata: { type: Object }  // For additional GridFS metadata
  }],

  reviewerComments: [{
    text: String,
    reviewedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'user' 
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    statusAtReview: String // Track status at time of review
  }],
  requestedAt: {
    type: Date,
    default: Date.now
  },
  lastReviewDate: Date, // New field to track last review date
  processedAt: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
requestSchema.index({ user: 1, status: 1 });
requestSchema.index({ benefit: 1, status: 1 });
requestSchema.index({ lastReviewDate: -1 }); // New index for sorting by review date

// Virtuals
requestSchema.virtual('benefitDetails', {
  ref: 'Benefit',
  localField: 'benefit',
  foreignField: '_id',
  justOne: true
});

requestSchema.virtual('userDetails', {
  ref: 'user',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Add a pre-save hook to update processedAt when status changes from pending
requestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.processedAt) {
    this.processedAt = new Date();
  }
  next();
});

const Request = mongoose.model('request', requestSchema);

module.exports = Request;