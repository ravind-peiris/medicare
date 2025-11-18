import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than 0']
  },
  method: {
    type: String,
    enum: ['Cash', 'Card', 'Insurance', 'Bank Transfer', 'Cheque'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Success', 'Failed', 'Refunded', 'Cancelled'],
    default: 'Pending'
  },
  transactionId: {
    type: String
    // Index defined separately below to avoid duplicate
  },
  referenceNumber: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date
  },
  failureReason: {
    type: String,
    maxlength: [200, 'Failure reason cannot exceed 200 characters']
  },
  cardDetails: {
    lastFourDigits: String,
    cardType: {
      type: String,
      enum: ['Visa', 'Mastercard', 'American Express', 'Discover', 'Other']
    },
    expiryMonth: Number,
    expiryYear: Number
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    routingNumber: String
  },
  insuranceDetails: {
    claimNumber: String,
    policyNumber: String,
    approvedAmount: Number
  },
  refundDetails: {
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    refundMethod: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for payment status display
paymentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'Pending': 'Processing',
    'Success': 'Completed',
    'Failed': 'Failed',
    'Refunded': 'Refunded',
    'Cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR'
  }).format(this.amount);
});

// Index for better query performance
paymentSchema.index({ bill: 1 });
paymentSchema.index({ patient: 1, paymentDate: -1 });
paymentSchema.index({ referenceNumber: 1 }, { unique: true });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: -1 });

// Pre-save middleware to generate reference number
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.referenceNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    this.referenceNumber = `PAY${year}${month}${day}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to update bill status
paymentSchema.post('save', async function() {
  if (this.status === 'Success') {
    const Bill = mongoose.model('Bill');
    const bill = await Bill.findById(this.bill);
    
    if (bill) {
      // Calculate total payments for this bill
      const totalPayments = await this.constructor.aggregate([
        { $match: { bill: bill._id, status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const paidAmount = totalPayments.length > 0 ? totalPayments[0].total : 0;
      
      // Update bill status based on payment amount
      if (paidAmount >= bill.totalAmount) {
        bill.status = 'Paid';
        bill.paidDate = this.paymentDate;
        bill.paymentMethod = this.method;
        bill.paidBy = this.processedBy;
      } else if (paidAmount > 0) {
        bill.status = 'Partially Paid';
      }
      
      await bill.save();
    }
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

