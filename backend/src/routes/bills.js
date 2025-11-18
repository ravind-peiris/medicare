import express from 'express';
import Bill from '../models/Bill.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBill, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, patient, dateFrom, dateTo } = req.query;

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
    if (patient) filter.patient = patient;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const bills = await Bill.find(filter)
      .populate('patient', 'cardNumber')
      .populate('patient.user', 'profile')
      .populate('appointment', 'date time reason')
      .populate('createdBy', 'profile')
      .populate('paidBy', 'profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bill.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: bills.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        bills
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get bill by ID
// @route   GET /api/bills/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patient', 'cardNumber')
      .populate('patient.user', 'profile')
      .populate('appointment', 'date time reason')
      .populate('createdBy', 'profile')
      .populate('paidBy', 'profile');

    if (!bill) {
      return res.status(404).json({
        status: 'error',
        message: 'Bill not found'
      });
    }

    // Check if user can access this bill
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || bill.patient._id.toString() !== patientDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        bill
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create new bill
// @route   POST /api/bills
// @access  Private (Doctor, Healthcare Manager)
router.post('/', protect, restrictTo('Doctor', 'Healthcare Manager'), validateBill, async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      billNumber,
      consultantFee,
      hospitalFee,
      doctorName,
      hospitalName,
      totalAmount,
      description
    } = req.body;

    // Check if patient exists
    const patientDoc = await Patient.findById(patientId);
    if (!patientDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Check if appointment exists (if provided)
    if (appointmentId) {
      const appointmentDoc = await Appointment.findById(appointmentId);
      if (!appointmentDoc) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }
    }

    const bill = await Bill.create({
      patient: patientId,
      appointment: appointmentId || undefined,
      billNumber: billNumber || undefined, // Let pre-save handle if not provided
      hospitalName,
      doctorName,
      consultantFee,
      hospitalFee,
      totalAmount,
      description,
      createdBy: req.user._id,
      items: [{
        description: description || 'Medical Services',
        quantity: 1,
        unitPrice: totalAmount,
        total: totalAmount,
        category: 'Consultation'
      }],
      subtotal: totalAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    await bill.populate([
      { path: 'patient', select: 'cardNumber' },
      { path: 'patient.user', select: 'profile' },
      { path: 'appointment', select: 'date time reason' },
      { path: 'createdBy', select: 'profile' }
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        bill
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private (Doctor, Healthcare Manager)
router.put('/:id', protect, restrictTo('Doctor', 'Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        status: 'error',
        message: 'Bill not found'
      });
    }

    const allowedUpdates = [
      'status', 'notes', 'taxRate', 'discountRate'
    ];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If updating status to Paid, set paidDate and paidBy
    if (updates.status === 'Paid') {
      updates.paidDate = new Date();
      updates.paidBy = req.user._id;
    }

    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'cardNumber' },
      { path: 'patient.user', select: 'profile' },
      { path: 'appointment', select: 'date time reason' },
      { path: 'createdBy', select: 'profile' },
      { path: 'paidBy', select: 'profile' }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        bill: updatedBill
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get bill by bill number
// @route   GET /api/bills/bill-number/:billNumber
// @access  Private
router.get('/bill-number/:billNumber', protect, async (req, res) => {
  try {
    const bill = await Bill.findOne({ 
      billNumber: req.params.billNumber.toUpperCase() 
    })
      .populate('patient', 'cardNumber')
      .populate('patient.user', 'profile')
      .populate('appointment', 'date time reason')
      .populate('createdBy', 'profile')
      .populate('paidBy', 'profile');

    if (!bill) {
      return res.status(404).json({
        status: 'error',
        message: 'Bill not found'
      });
    }

    // Check if user can access this bill
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || bill.patient._id.toString() !== patientDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        bill
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get overdue bills
// @route   GET /api/bills/overdue
// @access  Private (Healthcare Manager)
router.get('/overdue', protect, restrictTo('Healthcare Manager'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const today = new Date();
    const bills = await Bill.find({
      status: { $in: ['Pending', 'Overdue'] },
      dueDate: { $lt: today }
    })
      .populate('patient', 'cardNumber')
      .populate('patient.user', 'profile')
      .populate('appointment', 'date time reason')
      .populate('createdBy', 'profile')
      .populate('paidBy', 'profile')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Bill.countDocuments({
      status: { $in: ['Pending', 'Overdue'] },
      dueDate: { $lt: today }
    });

    res.status(200).json({
      status: 'success',
      results: bills.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        bills
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Mark bill as paid
// @route   PUT /api/bills/:id/mark-paid
// @access  Private (Healthcare Manager)
router.put('/:id/mark-paid', protect, restrictTo('Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        status: 'error',
        message: 'Bill not found'
      });
    }

    if (bill.status === 'Paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Bill is already paid'
      });
    }

    bill.status = 'Paid';
    bill.paidDate = new Date();
    bill.paymentMethod = paymentMethod || 'Cash';
    bill.paidBy = req.user._id;

    await bill.save();

    res.status(200).json({
      status: 'success',
      message: 'Bill marked as paid successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Delete bill
// @route   DELETE /api/bills/:id
// @access  Private (Healthcare Manager)
router.delete('/:id', protect, restrictTo('Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        status: 'error',
        message: 'Bill not found'
      });
    }

    if (bill.status === 'Paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete paid bill'
      });
    }

    await Bill.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;

