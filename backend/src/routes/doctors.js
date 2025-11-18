import express from 'express';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Payment from '../models/Payment.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateDoctorRegistration, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { specialization, department } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }
    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    const doctors = await Doctor.find(filter)
      .populate('user', 'username email profile')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Doctor.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: doctors.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        doctors
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'username email profile');

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        doctor
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create new doctor
// @route   POST /api/doctors
// @access  Private (Manager, Healthcare Manager)
router.post('/', protect, restrictTo('Manager', 'Healthcare Manager'), validateDoctorRegistration, async (req, res) => {
  try {
    const { user, ...doctorData } = req.body;

    // Check if user exists and is a doctor
    const userDoc = await User.findById(user);
    if (!userDoc || userDoc.role !== 'Doctor') {
      return res.status(400).json({
        status: 'error',
        message: 'User not found or is not a doctor'
      });
    }

    // Check if doctor profile already exists
    const existingDoctor = await Doctor.findOne({ user });
    if (existingDoctor) {
      return res.status(400).json({
        status: 'error',
        message: 'Doctor profile already exists for this user'
      });
    }

    const doctor = await Doctor.create({
      user,
      ...doctorData
    });

    await doctor.populate('user', 'username email profile');

    res.status(201).json({
      status: 'success',
      data: {
        doctor
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private (Doctor, Manager)
router.put('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    // Check if user can update this doctor
    if (req.user.role === 'Doctor' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const allowedUpdates = [
      'specialization', 'department', 'experience', 'consultationFee',
      'bio', 'languages', 'qualifications', 'availability'
    ];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'username email profile');

    res.status(200).json({
      status: 'success',
      data: {
        doctor: updatedDoctor
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get doctor availability
// @route   GET /api/doctors/:id/availability
// @access  Public
router.get('/:id/availability', validateObjectId('id'), async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    // If specific date is requested, return availability for that day
    if (date) {
      const requestedDate = new Date(date);
      const dayOfWeek = requestedDate.getDay();
      
      const dayAvailability = doctor.availability.find(avail => 
        avail.dayOfWeek === dayOfWeek && avail.isAvailable
      );

      if (!dayAvailability) {
        return res.status(200).json({
          status: 'success',
          data: {
            available: false,
            message: 'Doctor not available on this day'
          }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          available: true,
          startTime: dayAvailability.startTime,
          endTime: dayAvailability.endTime,
          date: requestedDate.toISOString().split('T')[0]
        }
      });
    }

    // Return general availability
    res.status(200).json({
      status: 'success',
      data: {
        availability: doctor.availability
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Search doctors
// @route   GET /api/doctors/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    const doctors = await Doctor.find({
      $or: [
        { specialization: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
        { 'user.profile.firstName': { $regex: q, $options: 'i' } },
        { 'user.profile.lastName': { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
      .populate('user', 'username email profile')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments({
      $or: [
        { specialization: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
        { 'user.profile.firstName': { $regex: q, $options: 'i' } },
        { 'user.profile.lastName': { $regex: q, $options: 'i' } }
      ],
      isActive: true
    });

    res.status(200).json({
      status: 'success',
      results: doctors.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: {
        doctors
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get specializations
// @route   GET /api/doctors/specializations
// @access  Public
router.get('/specializations', async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization', { isActive: true });
    
    res.status(200).json({
      status: 'success',
      data: {
        specializations
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get departments
// @route   GET /api/doctors/departments
// @access  Public
router.get('/departments', async (req, res) => {
  try {
    const departments = await Doctor.distinct('department', { isActive: true });
    
    res.status(200).json({
      status: 'success',
      data: {
        departments
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get doctor's own profile and dashboard data
// @route   GET /api/doctors/me/profile
// @access  Private (Doctor)
router.get('/me/profile', protect, restrictTo('Doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id })
      .populate('user', 'username email profile role');
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        doctor
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get doctor's patients
// @route   GET /api/doctors/me/patients
// @access  Private (Doctor)
router.get('/me/patients', protect, restrictTo('Doctor'), async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('user', 'username email profile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: patients.length,
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

// @desc    Get doctor's appointments
// @route   GET /api/doctors/me/appointments
// @access  Private (Doctor)
router.get('/me/appointments', protect, restrictTo('Doctor'), async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'user cardNumber')
      .populate('patient.user', 'username email profile')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      status: 'success',
      results: appointments.length,
      data: {
        appointments
      }
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get doctor's availability
// @route   GET /api/doctors/me/availability
// @access  Private (Doctor)
router.get('/me/availability', protect, restrictTo('Doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        availability: doctor.availability || [],
        consultationDuration: doctor.consultationDuration || 30,
        breakDuration: doctor.breakDuration || 15
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update doctor's availability
// @route   PUT /api/doctors/me/availability
// @access  Private (Doctor)
router.put('/me/availability', protect, restrictTo('Doctor'), async (req, res) => {
  try {
    const { availability, consultationDuration, breakDuration } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { 
        availability: availability || [],
        consultationDuration: consultationDuration || 30,
        breakDuration: breakDuration || 15
      },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        availability: doctor.availability,
        consultationDuration: doctor.consultationDuration,
        breakDuration: doctor.breakDuration
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get doctor's revenue data
// @route   GET /api/doctors/me/revenue
// @access  Private (Doctor)
router.get('/me/revenue', protect, restrictTo('Doctor'), async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get all payments related to doctor's appointments
    const payments = await Payment.find({
      appointment: { $exists: true }
    })
      .populate({
        path: 'appointment',
        match: { doctor: doctorId },
        populate: {
          path: 'patient',
          select: 'user cardNumber',
          populate: {
            path: 'user',
            select: 'profile.firstName profile.lastName'
          }
        }
      })
      .sort({ paymentDate: -1 });

    // Filter out payments that don't belong to this doctor
    const doctorPayments = payments.filter(payment => payment.appointment);

    // Calculate revenue statistics
    const totalRevenue = doctorPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = doctorPayments
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Weekly revenue (current week)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyRevenue = doctorPayments
      .filter(payment => new Date(payment.paymentDate) >= startOfWeek)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Daily revenue (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dailyRevenue = doctorPayments
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= today && paymentDate < tomorrow;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    res.status(200).json({
      status: 'success',
      data: {
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          weekly: weeklyRevenue,
          daily: dailyRevenue
        },
        payments: doctorPayments,
        statistics: {
          totalTransactions: doctorPayments.length,
          averageTransactionValue: doctorPayments.length > 0 ? totalRevenue / doctorPayments.length : 0,
          successRate: doctorPayments.length > 0 
            ? (doctorPayments.filter(p => p.status === 'completed').length / doctorPayments.length) * 100 
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor revenue:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Deactivate doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Manager, Healthcare Manager)
router.delete('/:id', protect, restrictTo('Manager', 'Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Doctor deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
