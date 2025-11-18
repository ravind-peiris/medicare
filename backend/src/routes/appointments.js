import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Hospital from '../models/Hospital.js';
import Bill from '../models/Bill.js';
import { protect } from '../middleware/auth.js';
import { validateAppointment, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    // Validate MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection is not ready');
    }

    if (!Appointment) {
      throw new Error('Appointment model is not loaded');
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, doctor, patient, date } = req.query;

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
    } else if (req.user.role === 'Doctor') {
      const doctorDoc = await Doctor.findOne({ user: req.user._id });
      if (!doctorDoc) {
        return res.status(404).json({
          status: 'error',
          message: 'Doctor profile not found'
        });
      }
      filter.doctor = doctorDoc._id;
    }

    // Add additional filters
    if (status) filter.status = { $regex: `^${status}$`, $options: 'i' }; // case-insensitive match
    if (doctor) {
      const doctorDoc = await Doctor.findOne({ user: doctor });
      if (doctorDoc) {
        filter.doctor = doctorDoc._id;
      } else {
        filter.doctor = doctor;
      }
    }
    if (patient) filter.patient = patient;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(filter)
      .populate({
        path: 'patient',
        select: 'cardNumber user',
        populate: {
          path: 'user',
          select: 'profile'
        }
      })
      .populate({
        path: 'doctor',
        select: 'specialization department user',
        populate: {
          path: 'user',
          select: 'profile'
        }
      })
      .populate({ path: 'hospital', select: 'name address type' })
      .populate({ path: 'createdBy', select: 'profile' })
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: appointments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        appointments
      }
    });
  } catch (error) {
    console.error('Error in GET /appointments:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'patient',
        select: 'cardNumber user',
        populate: {
          path: 'user',
          select: 'profile'
        }
      })
      .populate({
        path: 'doctor',
        select: 'specialization department user',
        populate: {
          path: 'user',
          select: 'profile'
        }
      })
      .populate({ path: 'hospital', select: 'name address type' })
      .populate({ path: 'createdBy', select: 'profile' });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user can access this appointment
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || appointment.patient._id.toString() !== patientDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    } else if (req.user.role === 'Doctor') {
      const doctorDoc = await Doctor.findOne({ user: req.user._id });
      if (!doctorDoc || appointment.doctor._id.toString() !== doctorDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        appointment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
router.post('/', protect, validateAppointment, async (req, res) => {
  try {
    console.log('Received appointment creation request:', {
      body: req.body,
      user: req.user._id,
      role: req.user.role
    });

    const { patient, doctor, hospital, date, time, reason, notes } = req.body;

    // Check if patient exists
    const patientDoc = await Patient.findById(patient);
    if (!patientDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Check if doctor exists
    const doctorDoc = await Doctor.findById(doctor);
    if (!doctorDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    // Check if hospital exists
    if (hospital) {
      const hospitalDoc = await Hospital.findById(hospital);
      if (!hospitalDoc) {
        return res.status(404).json({
          status: 'error',
          message: 'Hospital not found'
        });
      }
    }

    // Check if patient is trying to book for themselves
    if (req.user.role === 'Patient') {
      const userPatientDoc = await Patient.findOne({ user: req.user._id });
      if (!userPatientDoc || userPatientDoc._id.toString() !== patient) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only book appointments for yourself'
        });
      }
    }

    // Check for conflicting appointments
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      doctor,
      date: appointmentDate,
      time,
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        status: 'error',
        message: 'Time slot is already booked'
      });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      hospital,
      date: appointmentDate,
      time,
      reason,
      notes,
      createdBy: req.user._id
    });

    await appointment.populate({
      path: 'patient',
      select: 'cardNumber user',
      populate: { path: 'user', select: 'profile' }
    });
    await appointment.populate({
      path: 'doctor',
      select: 'specialization department user',
      populate: { path: 'user', select: 'profile' }
    });
    if (hospital) {
      await appointment.populate({ path: 'hospital', select: 'name address type' });
    }
    await appointment.populate({ path: 'createdBy', select: 'profile' });

    res.status(201).json({
      status: 'success',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);

    // More specific error handling
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid ID format',
        errors: [{
          field: error.path,
          message: `Invalid ${error.path} format`
        }]
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create appointment'
    });
  }
});

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
router.put('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user can update this appointment
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || appointment.patient.toString() !== patientDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    } else if (req.user.role === 'Doctor') {
      const doctorDoc = await Doctor.findOne({ user: req.user._id });
      if (!doctorDoc || appointment.doctor.toString() !== doctorDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    const allowedUpdates = [
      'date', 'time', 'reason', 'notes', 'status', 'diagnosis',
      'prescription', 'followUpDate', 'followUpNotes'
    ];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle status change to confirmed - create bill automatically
    if (updates.status === 'Confirmed' || updates.status === 'confirmed') {
      updates.status = 'Confirmed'; // Normalize to consistent case

      // Check if a bill already exists for this appointment
      const existingBill = await Bill.findOne({ appointment: req.params.id });
      if (!existingBill) {
        const doctorDoc = await Doctor.findById(appointment.doctor).populate('user');
        const patientDoc = await Patient.findById(appointment.patient);
        const hospitalDoc = appointment.hospital ? await Hospital.findById(appointment.hospital) : null;

        const consultationFee = doctorDoc?.consultationFee || 3000;
        const hospitalFee = hospitalDoc ? 1000 : 0;
        const totalAmount = consultationFee + hospitalFee;

        const billData = {
          patient: appointment.patient,
          appointment: req.params.id,
          hospitalName: hospitalDoc?.name || 'MediPulse General Hospital',
          doctorName: `Dr. ${doctorDoc.user.profile.firstName} ${doctorDoc.user.profile.lastName}`,
          consultantFee: consultationFee,
          hospitalFee: hospitalFee,
          totalAmount: totalAmount,
          createdBy: req.user._id,
          description: `Medical consultation for ${appointment.reason || 'General consultation'}`,
          items: [{
            description: 'Medical consultation',
            quantity: 1,
            unitPrice: consultationFee,
            total: consultationFee,
            category: 'Consultation'
          }],
          subtotal: totalAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };

        if (hospitalFee > 0) {
          billData.items.push({
            description: 'Hospital charges',
            quantity: 1,
            unitPrice: hospitalFee,
            total: hospitalFee,
            category: 'Other'
          });
        }

        await Bill.create(billData);
        console.log(`Bill created automatically for appointment ${req.params.id}`);
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'patient',
        select: 'cardNumber user',
        populate: { path: 'user', select: 'profile' }
      })
      .populate({
        path: 'doctor',
        select: 'specialization department user',
        populate: { path: 'user', select: 'profile' }
      })
      .populate({ path: 'hospital', select: 'name address type' })
      .populate({ path: 'createdBy', select: 'profile' });

    res.status(200).json({
      status: 'success',
      data: {
        appointment: updatedAppointment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get available time slots
// @route   GET /api/appointments/available-slots
// @access  Public
router.get('/available-slots', async (req, res) => {
  try {
    const { doctor, date } = req.query;

    if (!doctor || !date) {
      return res.status(400).json({
        status: 'error',
        message: 'Doctor ID and date are required'
      });
    }

    const doctorDoc = await Doctor.findById(doctor);
    if (!doctorDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Get doctor's availability for this day
    const dayAvailability = doctorDoc.availability.find(avail => 
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

    // Generate time slots
    const slots = [];
    const startTime = dayAvailability.startTime;
    const endTime = dayAvailability.endTime;
    const slotDuration = 30; // 30 minutes per slot

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      slots.push(timeString);
    }

    // Check which slots are already booked
    const bookedAppointments = await Appointment.find({
      doctor,
      date: appointmentDate,
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    }).select('time');

    const bookedTimes = bookedAppointments.map(apt => apt.time);
    const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));

    res.status(200).json({
      status: 'success',
      data: {
        available: true,
        date: appointmentDate.toISOString().split('T')[0],
        slots: availableSlots
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, validateObjectId('id'), async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot modify cancelled appointment'
      });
    }

    if (appointment.status === 'Completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel completed appointment'
      });
    }

    // Check if user can cancel this appointment
    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || appointment.patient.toString() !== patientDoc._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    appointment.status = 'Cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = cancellationReason;

    await appointment.save();

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Patient can delete their own pending appointments)
router.delete('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user can delete this appointment
    let canDelete = false;

    if (req.user.role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (patientDoc && appointment.patient.toString() === patientDoc._id.toString()) {
        // Patients can only delete their own pending appointments
        if (appointment.status === 'Pending') {
          canDelete = true;
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'Only pending appointments can be deleted'
          });
        }
      }
    } else if (req.user.role === 'Healthcare Manager') {
      // Healthcare managers can delete any appointment
      canDelete = true;
    } else if (req.user.role === 'Doctor') {
      const doctorDoc = await Doctor.findOne({ user: req.user._id });
      if (doctorDoc && appointment.doctor.toString() === doctorDoc._id.toString()) {
        // Doctors can delete their own appointments
        canDelete = true;
      }
    }

    if (!canDelete) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied - you can only delete your own appointments'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;

