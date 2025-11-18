import express from 'express';
import Payment from '../models/Payment.js';
import Bill from '../models/Bill.js';
import Patient from '../models/Patient.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validatePayment, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, method, dateFrom, dateTo } = req.query;

    // Build filter based on user role
    let filter = {};
    
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient profile not found'
        });
      }
      filter.patient = patientDoc._id;
    }

    // Add additional filters
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) filter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.paymentDate.$lte = new Date(dateTo);
    }

    const payments = await Payment.find(filter)
      .populate('bill', 'billNumber totalAmount')
      .populate('patient', 'cardNumber')
      .populate('patient.user', 'profile')
      .populate('processedBy', 'profile')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        payments
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bill', 'billNumber totalAmount')
      .populate('patient', 'cardNumber')
      .populate('patient.user', 'profile')
      .populate('processedBy', 'profile');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    // Check if user can access this payment
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || payment.patient._id.toString() !== patientDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
router.post('/', protect, validatePayment, async (req, res) => {
  try {
    const { bill, amount, method, notes, cardDetails, bankDetails, insuranceDetails } = req.body;

    // Check if bill exists
    const billDoc = await Bill.findById(bill);
    if (!billDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Bill not found'
      });
    }

    // Check if user can make payment for this bill
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || billDoc.patient.toString() !== patientDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only pay for your own bills'
        });
      }
    }

    if (billDoc.status === 'Paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Bill is already paid'
      });
    }

    // Check if payment amount is valid
    if (amount > billDoc.totalAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment amount cannot exceed bill total'
      });
    }

    // Get patient for payment record
    const patientDoc = await Patient.findById(billDoc.patient);

    const paymentData = {
      bill,
      patient: patientDoc._id,
      amount,
      method,
      notes,
      processedBy: req.user._id
    };

    // Add method-specific details
    if (method === 'Card' && cardDetails) {
      paymentData.cardDetails = cardDetails;
    }
    if (method === 'Bank Transfer' && bankDetails) {
      paymentData.bankDetails = bankDetails;
    }
    if (method === 'Insurance' && insuranceDetails) {
      paymentData.insuranceDetails = insuranceDetails;
    }

    const payment = await Payment.create(paymentData);

    await payment.populate([
      { path: 'bill', select: 'billNumber totalAmount' },
      { path: 'patient', select: 'cardNumber' },
      { path: 'patient.user', select: 'profile' },
      { path: 'processedBy', select: 'profile' }
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update payment status
// @route   PUT /api/payments/:id/status
// @access  Private (Healthcare Manager)
router.put('/:id/status', protect, restrictTo('Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const { status, failureReason } = req.body;

    if (!['Success', 'Failed', 'Processing', 'Refunded', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment status'
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    payment.status = status;
    payment.processedDate = new Date();

    if (status === 'Failed' && failureReason) {
      payment.failureReason = failureReason;
    }

    await payment.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Process refund
// @route   POST /api/payments/:id/refund
// @access  Private (Healthcare Manager)
router.post('/:id/refund', protect, restrictTo('Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const { refundAmount, refundReason, refundMethod } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'Success') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only refund successful payments'
      });
    }

    const refundAmountValue = refundAmount || payment.amount;

    if (refundAmountValue > payment.amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    payment.status = 'Refunded';
    payment.refundDetails = {
      refundAmount: refundAmountValue,
      refundDate: new Date(),
      refundReason,
      refundMethod: refundMethod || payment.method
    };
    payment.refundedBy = req.user._id;

    await payment.save();

    res.status(200).json({
      status: 'success',
      message: 'Refund processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get payment by reference number
// @route   GET /api/payments/reference/:referenceNumber
// @access  Private
router.get('/reference/:referenceNumber', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({ 
      referenceNumber: req.params.referenceNumber 
    })
      .populate('bill', 'billNumber totalAmount')
      .populate('patient', 'cardNumber')
      .populate('patient.user', 'profile')
      .populate('processedBy', 'profile');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    // Check if user can access this payment
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || payment.patient._id.toString() !== patientDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get payment statistics
// @route   GET /api/payments/statistics
// @access  Private (Healthcare Manager)
router.get('/statistics', protect, restrictTo('Healthcare Manager'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const filter = {};
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) filter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.paymentDate.$lte = new Date(dateTo);
    }

    const stats = await Payment.aggregate([
      { $match: { ...filter, status: 'Success' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    const methodStats = await Payment.aggregate([
      { $match: { ...filter, status: 'Success' } },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const dailyStats = await Payment.aggregate([
      { $match: { ...filter, status: 'Success' } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
            day: { $dayOfMonth: '$paymentDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: stats[0] || { totalAmount: 0, totalCount: 0, averageAmount: 0 },
        methodBreakdown: methodStats,
        dailyStats
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;

