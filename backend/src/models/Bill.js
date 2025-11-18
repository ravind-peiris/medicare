import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  billNumber: {
    type: String,
    uppercase: true,
    match: [/^BILL\d{8}$/, 'Bill number must be in format BILL followed by 8 digits']
  },
  items: [{
    description: {
      type: String,
      required: true,
      maxlength: [200, 'Item description cannot exceed 200 characters']
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    },
    category: {
      type: String,
      enum: ['Consultation', 'Medication', 'Test', 'Procedure', 'Other'],
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountRate: {
    type: Number,
    default: 0,
    min: [0, 'Discount rate cannot be negative'],
    max: [100, 'Discount rate cannot exceed 100%']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Insurance', 'Bank Transfer', 'Cheque']
  },
  insuranceClaim: {
    claimNumber: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Partially Approved']
    },
    approvedAmount: Number,
    rejectedReason: String
  },
  hospitalName: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  consultantFee: {
    type: Number,
    default: 0,
    min: [0, 'Consultant fee cannot be negative']
  },
  hospitalFee: {
    type: Number,
    default: 0,
    min: [0, 'Hospital fee cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days overdue
billSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'Overdue' || (this.status === 'Pending' && new Date() > this.dueDate)) {
    const today = new Date();
    const diffTime = today - this.dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for payment status
billSchema.virtual('isOverdue').get(function() {
  return this.status === 'Overdue' || (this.status === 'Pending' && new Date() > this.dueDate);
});

// Index for better query performance
billSchema.index({ patient: 1, createdAt: -1 });
billSchema.index({ billNumber: 1 }, { unique: true });
billSchema.index({ status: 1 });
billSchema.index({ dueDate: 1 });
billSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate totals
billSchema.pre('save', function(next) {
  // If totalAmount is not provided, calculate from fees
  if (!this.totalAmount) {
    this.totalAmount = (this.consultantFee || 0) + (this.hospitalFee || 0);
  }

  // Calculate item totals
  this.items.forEach(item => {
    item.total = item.quantity * item.unitPrice;
  });

  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);

  // If subtotal doesn't match totalAmount, update items to match
  if (this.subtotal !== this.totalAmount) {
    this.items = [{
      description: this.description || 'Medical Services',
      quantity: 1,
      unitPrice: this.totalAmount,
      total: this.totalAmount,
      category: 'Consultation'
    }];
    this.subtotal = this.totalAmount;
  }

  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;

  // Calculate discount amount
  this.discountAmount = (this.subtotal * this.discountRate) / 100;

  // Recalculate total
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;

  // Set due date if not provided (default to 30 days from creation)
  if (!this.dueDate) {
    this.dueDate = new Date();
    this.dueDate.setDate(this.dueDate.getDate() + 30);
  }

  next();
});

// Pre-save middleware to generate bill number
billSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNumber) {
    const count = await this.constructor.countDocuments();
    this.billNumber = `BILL${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

const Bill = mongoose.model('Bill', billSchema);

export default Bill;

