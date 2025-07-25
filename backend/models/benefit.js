const mongoose = require('mongoose');

const rateTierSchema = new mongoose.Schema({
  rank: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  description: {
    type: String
  }
});

const benefitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Benefit name required'],
    unique: true
  },
  description: {
    type: String
  },
  benefitType: {
    type: String,
    enum: ['fixed', 'tiered'],
    default: 'fixed',
    required: true
  },
  // For fixed benefits
  amount: {
    type: Number,
    required: function() { return this.benefitType === 'fixed'; }
  },
  // For tiered benefits
  rateTiers: [rateTierSchema],
  eligibleRanks: [{ 
    type: String,
    required: true
  }],
  minTenure: {
    type: Number,
    default: 0
  },
  documentsRequired: [{
    name: String,
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  autoApply: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add validation for rateTiers
benefitSchema.pre('validate', function(next) {
  if (this.benefitType === 'tiered' && (!this.rateTiers || this.rateTiers.length === 0)) {
    this.invalidate('rateTiers', 'Rate tiers are required for tiered benefits');
  }
  next();
});

// Indexes
benefitSchema.index({ eligibleRanks: 1, minTenure: 1 });
benefitSchema.index({ 'rateTiers.rank': 1 });
benefitSchema.index({ autoApply: 1, isActive: 1 }); // New index for requestable benefits

const Benefit = mongoose.model('benefit', benefitSchema);

module.exports = Benefit;