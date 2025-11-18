import express from 'express';
import HealthRecord from '../models/HealthRecord.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all health records for a patient
// @route   GET /api/health-records/patient/:patientId
// @access  Private (Patient, Doctor, Manager)
router.get('/patient/:patientId', protect, validateObjectId('patientId'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'Patient') {
      const userPatient = await Patient.findOne({ user: req.user._id });
      if (!userPatient || userPatient._id.toString() !== req.params.patientId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    const records = await HealthRecord.find({ 
      patient: req.params.patientId,
      isActive: true 
    })
      .populate('doctor')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'profile'
        }
      })
      .sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      results: records.length,
      data: {
        records
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get health records for current patient
// @route   GET /api/health-records/me
// @access  Private (Patient)
router.get('/me', protect, restrictTo('Patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    const records = await HealthRecord.find({ 
      patient: patient._id,
      isActive: true 
    })
      .populate('doctor')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'profile'
        }
      })
      .sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      results: records.length,
      data: {
        records
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get single health record
// @route   GET /api/health-records/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id)
      .populate('patient')
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'profile'
        }
      })
      .populate('doctor')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'profile'
        }
      });

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Health record not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'Patient') {
      const patient = await Patient.findOne({ user: req.user._id });
      if (!patient || record.patient._id.toString() !== patient._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        record
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create new health record
// @route   POST /api/health-records
// @access  Private (Doctor, Manager, Healthcare Manager) - Doctor field is optional
router.post('/', protect, restrictTo('Doctor', 'Manager', 'Healthcare Manager'), async (req, res) => {
  try {
    const { patientId, diagnosis, treatment, prescription, notes, vitalSigns, followUpDate } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Get doctor profile if user is a doctor (optional)
    let doctor = null;
    if (req.user.role === 'Doctor') {
      doctor = await Doctor.findOne({ user: req.user._id });
      // Don't fail if doctor profile not found - allow creation without doctor
      if (!doctor) {
        console.warn(`Doctor profile not found for user ${req.user._id}. Creating record without doctor assignment.`);
      }
    }

    const record = await HealthRecord.create({
      patient: patientId,
      doctor: doctor ? doctor._id : undefined,
      date: new Date(),
      diagnosis,
      treatment,
      prescription,
      notes,
      vitalSigns,
      followUpDate
    });

    await record.populate('doctor');
    await record.populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'profile'
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        record
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update health record
// @route   PUT /api/health-records/:id
// @access  Private (Doctor, Manager, Healthcare Manager) - Doctors can edit any records, ownership verified only if record has assigned doctor
router.put('/:id', protect, restrictTo('Doctor', 'Manager', 'Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Health record not found'
      });
    }

    // If doctor, verify they have a doctor profile (allow editing any records as a doctor)
    if (req.user.role === 'Doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(403).json({
          status: 'error',
          message: 'Doctor profile not found'
        });
      }
      // If record has a doctor assigned, verify ownership (but allow editing records without doctors)
      if (record.doctor && record.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied - you can only edit your own records'
        });
      }
    }

    // If doctor is editing and record has no doctor assigned, assign them
    if (req.user.role === 'Doctor' && !record.doctor) {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (doctor) {
        updates.doctor = doctor._id;
      }
    }

    const allowedUpdates = ['diagnosis', 'treatment', 'prescription', 'notes', 'vitalSigns', 'followUpDate', 'doctor'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedRecord = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('doctor')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'profile'
        }
      });

    res.status(200).json({
      status: 'success',
      data: {
        record: updatedRecord
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Delete health record (soft delete)
// @route   DELETE /api/health-records/:id
// @access  Private (Doctor, Manager)
router.delete('/:id', protect, restrictTo('Doctor', 'Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Health record not found'
      });
    }

    // If doctor, verify they have a doctor profile (allow deleting any records as a doctor)
    if (req.user.role === 'Doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(403).json({
          status: 'error',
          message: 'Doctor profile not found'
        });
      }
      // If record has a doctor assigned, verify ownership (but allow deleting records without doctors)
      if (record.doctor && record.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied - you can only delete your own records'
        });
      }
    }

    record.isActive = false;
    await record.save();

    res.status(200).json({
      status: 'success',
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
