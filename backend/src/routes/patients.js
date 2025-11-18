import express from 'express';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validatePatientRegistration, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Doctor, Manager, Healthcare Manager)
router.get('/', protect, restrictTo('Doctor', 'Manager', 'Healthcare Manager'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const patients = await Patient.find({ isActive: true })
      .populate('user', 'username email profile')
      .populate('medicalHistory.doctor', 'profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Patient.countDocuments({ isActive: true });

    res.status(200).json({
      status: 'success',
      results: patients.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        patients
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get current user's patient record
// @route   GET /api/patients/me
// @access  Private (Patient)
router.get('/me', protect, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
      .populate('user', 'username email profile')
      .populate('medicalHistory.doctor', 'profile');

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        patient
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('user', 'username email profile')
      .populate('medicalHistory.doctor', 'profile');

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Check if user can access this patient
    if (req.user.role === 'Patient' && patient.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        patient
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get patient by card number
// @route   GET /api/patients/card/:cardNumber
// @access  Private (Doctor, Manager, Healthcare Manager)
router.get('/card/:cardNumber', protect, restrictTo('Doctor', 'Manager', 'Healthcare Manager'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ 
      cardNumber: req.params.cardNumber.toUpperCase(),
      isActive: true 
    })
      .populate('user', 'username email profile')
      .populate('medicalHistory.doctor', 'profile');

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        patient
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (Manager)
router.post('/', protect, restrictTo('Manager'), validatePatientRegistration, async (req, res) => {
  try {
    const { user, ...patientData } = req.body;

    // Check if user exists and is a patient
    const userDoc = await User.findById(user);
    if (!userDoc || userDoc.role !== 'Patient') {
      return res.status(400).json({
        status: 'error',
        message: 'User not found or is not a patient'
      });
    }

    // Check if patient profile already exists
    const existingPatient = await Patient.findOne({ user });
    if (existingPatient) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient profile already exists for this user'
      });
    }

    const patient = await Patient.create({
      user,
      ...patientData
    });

    await patient.populate('user', 'username email profile');

    res.status(201).json({
      status: 'success',
      data: {
        patient
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
router.put('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Check if user can update this patient
    if (req.user.role === 'Patient' && patient.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const allowedUpdates = [
      'bloodType', 'allergies', 'insurance', 'emergencyContacts'
    ];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'username email profile');

    res.status(200).json({
      status: 'success',
      data: {
        patient: updatedPatient
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Add medical record
// @route   POST /api/patients/:id/medical-history
// @access  Private (Doctor, Manager)
router.post('/:id/medical-history', protect, restrictTo('Doctor', 'Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const { type, description, department } = req.body;

    if (!type || !description || !department) {
      return res.status(400).json({
        status: 'error',
        message: 'Type, description, and department are required'
      });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    const medicalRecord = {
      date: new Date(),
      type,
      description,
      doctor: req.user._id,
      department
    };

    patient.medicalHistory.push(medicalRecord);
    await patient.save();

    await patient.populate('medicalHistory.doctor', 'profile');

    res.status(201).json({
      status: 'success',
      data: {
        medicalRecord: patient.medicalHistory[patient.medicalHistory.length - 1]
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private (Doctor, Manager, Healthcare Manager)
router.get('/search', protect, restrictTo('Doctor', 'Manager', 'Healthcare Manager'), async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    const patients = await Patient.find({
      $or: [
        { cardNumber: { $regex: q, $options: 'i' } },
        { 'user.profile.firstName': { $regex: q, $options: 'i' } },
        { 'user.profile.lastName': { $regex: q, $options: 'i' } },
        { 'user.email': { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
      .populate('user', 'username email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments({
      $or: [
        { cardNumber: { $regex: q, $options: 'i' } },
        { 'user.profile.firstName': { $regex: q, $options: 'i' } },
        { 'user.profile.lastName': { $regex: q, $options: 'i' } },
        { 'user.email': { $regex: q, $options: 'i' } }
      ],
      isActive: true
    });

    res.status(200).json({
      status: 'success',
      results: patients.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: {
        patients
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Deactivate patient
// @route   DELETE /api/patients/:id
// @access  Private (Manager)
router.delete('/:id', protect, restrictTo('Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Patient deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});


// @desc    Get patient health records
// @route   GET /api/patients/:id/health-records
// @access  Private
router.get('/:id/health-records', protect, validateObjectId('id'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('user', 'profile')
      .populate('medicalHistory.doctor', 'profile');

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Check if user can access this patient's records
    if (req.user.role === 'Patient') {
      const userPatient = await Patient.findOne({ user: req.user._id });
      if (!userPatient || patient._id.toString() !== userPatient._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        healthRecords: patient.medicalHistory || []
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Add health record to patient
// @route   POST /api/patients/:id/health-records
// @access  Private (Doctor, Manager)
router.post('/:id/health-records', protect, restrictTo('Doctor', 'Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const { type, description, department, attachments } = req.body;

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    const healthRecord = {
      date: new Date(),
      type,
      description,
      doctor: req.user._id,
      department,
      attachments: attachments || []
    };

    patient.medicalHistory.push(healthRecord);
    await patient.save();

    await patient.populate('medicalHistory.doctor', 'profile');

    res.status(201).json({
      status: 'success',
      data: {
        healthRecord: patient.medicalHistory[patient.medicalHistory.length - 1]
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

