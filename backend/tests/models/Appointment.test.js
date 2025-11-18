import mongoose from 'mongoose';
import Appointment from '../../src/models/Appointment.js';
import User from '../../src/models/User.js';
import Doctor from '../../src/models/Doctor.js';
import Patient from '../../src/models/Patient.js';
import Hospital from '../../src/models/Hospital.js';

describe('Appointment Model', () => {
  let testUser, testDoctor, testPatient, testHospital;

  // Helper function to generate unique test data
  const generateUniqueUserData = (role = 'Patient') => {
    const timestamp = Date.now();
    const baseData = {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123',
      role: role,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        address: '123 Test Street',
        gender: 'Male',
        emergencyContact: '+1234567891'
      }
    };

    // Add Doctor-specific fields if role is Doctor
    if (role === 'Doctor') {
      baseData.doctorInfo = {
        specialization: 'Cardiology',
        department: 'Cardiology',
        licenseNumber: `DR${timestamp.toString().slice(-6)}`,
        experience: 5
      };
    }

    return baseData;
  };

  beforeEach(async () => {
    // Clear all collections
    await Appointment.deleteMany({});
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Hospital.deleteMany({});

    // Create test user
    const userData = generateUniqueUserData('Patient');
    testUser = await User.create(userData);

    // Create test doctor
    const doctorData = generateUniqueUserData('Doctor');
    const doctorUser = await User.create(doctorData);

    testDoctor = await Doctor.create({
      user: doctorUser._id,
      specialization: 'Cardiology',
      department: 'Cardiology',
      licenseNumber: `DR${Date.now().toString().slice(-6)}`,
      experience: 5,
      consultationFee: 5000,
      availability: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }
      ]
    });

    // Create test patient
    testPatient = await Patient.create({
      user: testUser._id,
      cardNumber: `HC${Date.now().toString().slice(-9)}`,
      bloodType: 'O+',
      allergies: ['Penicillin'],
      insurance: {
        provider: 'Test Insurance',
        policyNumber: 'POL123456',
        coverageType: 'Comprehensive',
        expiryDate: new Date('2025-12-31')
      },
      emergencyContacts: [{
        name: 'Emergency Contact',
        relationship: 'Spouse',
        phone: '+1234567892',
        email: 'emergency@example.com'
      }]
    });

    // Create test hospital
    testHospital = await Hospital.create({
      name: 'Test Hospital',
      type: 'Private',
      address: {
        street: '789 Hospital Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      contact: {
        phone: '+1234567893',
        email: 'hospital@example.com',
        website: 'www.testhospital.com'
      },
      departments: ['Cardiology', 'General Medicine'],
      facilities: ['ICU', 'Emergency'],
      operatingHours: {
        weekdays: { open: '08:00', close: '20:00' },
        weekends: { open: '09:00', close: '18:00' }
      },
      emergencyServices: true,
      isActive: true
    });
  });

  describe('Appointment Creation', () => {
    test('should create a valid appointment', async () => {
      // Arrange - Use a future date that won't trigger validation
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        hospital: testHospital._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        notes: 'Annual health check',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment._id).toBeDefined();
      expect(savedAppointment.patient.toString()).toBe(testPatient._id.toString());
      expect(savedAppointment.doctor.toString()).toBe(testDoctor._id.toString());
      expect(savedAppointment.hospital.toString()).toBe(testHospital._id.toString());
      expect(savedAppointment.date).toEqual(appointmentData.date);
      expect(savedAppointment.time).toBe(appointmentData.time);
      expect(savedAppointment.reason).toBe(appointmentData.reason);
      expect(savedAppointment.status).toBe('Pending'); // Default status
    });

    test('should create appointment without hospital (optional field)', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '14:30',
        reason: 'Consultation',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment._id).toBeDefined();
      expect(savedAppointment.patient.toString()).toBe(testPatient._id.toString());
      expect(savedAppointment.doctor.toString()).toBe(testDoctor._id.toString());
      expect(savedAppointment.hospital).toBeUndefined();
      expect(savedAppointment.status).toBe('Pending');
    });

    test('should set default status to Pending', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '09:15',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment.status).toBe('Pending');
    });

    test('should set timestamps on creation', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 4);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '11:00',
        reason: 'Follow-up appointment',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment.createdAt).toBeDefined();
      expect(savedAppointment.updatedAt).toBeDefined();
      expect(savedAppointment.createdAt).toBeInstanceOf(Date);
      expect(savedAppointment.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Appointment Validation', () => {
    test('should require patient', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Path `patient` is required');
    });

    test('should require doctor', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Path `doctor` is required');
    });

    test('should require date', async () => {
      // Arrange
      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Path `date` is required');
    });

    test('should require time', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Path `time` is required');
    });

    test('should require reason', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Path `reason` is required');
    });

    test('should require createdBy', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup'
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Path `createdBy` is required');
    });

    test('should validate time format correctly', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '25:00', // Invalid time format
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Invalid time format');
    });

    test('should accept valid time formats', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const validTimes = ['09:00', '15:30', '23:59', '00:00', '8:15'];

      for (const time of validTimes) {
        const appointmentData = {
          patient: testPatient._id,
          doctor: testDoctor._id,
          date: futureDate,
          time: time,
          reason: 'Regular checkup',
          createdBy: testUser._id
        };

        // Act
        const appointment = new Appointment(appointmentData);
        const savedAppointment = await appointment.save();

        // Assert
        expect(savedAppointment.time).toBe(time);
      }
    });

    test('should validate status enum values', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        status: 'InvalidStatus',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow();
    });

    test('should accept valid status enum values', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const validStatuses = ['Pending', 'Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'];

      for (const status of validStatuses) {
        const appointmentData = {
          patient: testPatient._id,
          doctor: testDoctor._id,
          date: futureDate,
          time: '10:00',
          reason: 'Regular checkup',
          status: status,
          createdBy: testUser._id
        };

        // Act
        const appointment = new Appointment(appointmentData);
        const savedAppointment = await appointment.save();

        // Assert
        expect(savedAppointment.status).toBe(status);
      }
    });

    test('should validate reason length constraint', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const longReason = 'A'.repeat(501); // Exceeds 500 character limit
      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: longReason,
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Reason cannot exceed 500 characters');
    });

    test('should accept maximum length reason', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const maxReason = 'A'.repeat(500); // Exactly 500 characters
      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: maxReason,
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment.reason).toBe(maxReason);
    });

    test('should validate notes length constraint', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const longNotes = 'A'.repeat(1001); // Exceeds 1000 character limit
      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        notes: longNotes,
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Notes cannot exceed 1000 characters');
    });
  });

  describe('Appointment Virtuals', () => {
    test('should calculate duration as 30 minutes', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment.duration).toBe(30);
    });

    test('should calculate end time correctly for various start times', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const testCases = [
        { time: '09:00', expectedEndTime: '09:30' },
        { time: '10:15', expectedEndTime: '10:45' },
        { time: '15:45', expectedEndTime: '16:15' },
        { time: '23:30', expectedEndTime: '00:00' } // This should wrap to next day
      ];

      for (const testCase of testCases) {
        const appointmentData = {
          patient: testPatient._id,
          doctor: testDoctor._id,
          date: futureDate,
          time: testCase.time,
          reason: 'Regular checkup',
          createdBy: testUser._id
        };

        // Act
        const appointment = new Appointment(appointmentData);
        const savedAppointment = await appointment.save();

        // Assert
        expect(savedAppointment.endTime).toBe(testCase.expectedEndTime);
      }
    });
  });

  describe('Appointment Pre-save Middleware', () => {
    test('should prevent scheduling appointment in the past', async () => {
      // Arrange
      const pastDate = new Date('2020-01-01');
      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: pastDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Cannot schedule appointment in the past');
    });

    test('should prevent scheduling appointment too far in the future', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2); // 2 years from now
      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act & Assert
      const appointment = new Appointment(appointmentData);
      await expect(appointment.save()).rejects.toThrow('Cannot schedule appointment more than 1 year in advance');
    });

    test('should allow scheduling appointment within valid date range', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now (within 1 year)

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment._id).toBeDefined();
      expect(savedAppointment.date).toEqual(futureDate);
    });

    test('should allow scheduling appointment exactly 1 year in future', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // Exactly 1 year

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment._id).toBeDefined();
      expect(savedAppointment.date).toEqual(futureDate);
    });
  });

  describe('Appointment Updates', () => {
    test('should update appointment status', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      savedAppointment.status = 'Confirmed';
      const updatedAppointment = await savedAppointment.save();

      // Assert
      expect(updatedAppointment.status).toBe('Confirmed');
    });

    test('should update appointment notes', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      savedAppointment.notes = 'Updated notes for the appointment';
      const updatedAppointment = await savedAppointment.save();

      // Assert
      expect(updatedAppointment.notes).toBe('Updated notes for the appointment');
    });

    test('should update appointment diagnosis', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      savedAppointment.diagnosis = 'Hypertension stage 1';
      const updatedAppointment = await savedAppointment.save();

      // Assert
      expect(updatedAppointment.diagnosis).toBe('Hypertension stage 1');
    });

    test('should add prescription to appointment', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      savedAppointment.prescription.push({
        medication: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '3 months',
        instructions: 'Take in the morning'
      });
      const updatedAppointment = await savedAppointment.save();

      // Assert
      expect(updatedAppointment.prescription).toHaveLength(1);
      expect(updatedAppointment.prescription[0].medication).toBe('Lisinopril');
      expect(updatedAppointment.prescription[0].dosage).toBe('10mg');
    });

    test('should set follow-up date and notes', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 30);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      savedAppointment.followUpDate = followUpDate;
      savedAppointment.followUpNotes = 'Return for follow-up in 4 weeks';
      const updatedAppointment = await savedAppointment.save();

      // Assert
      expect(updatedAppointment.followUpDate).toEqual(followUpDate);
      expect(updatedAppointment.followUpNotes).toBe('Return for follow-up in 4 weeks');
    });

    test('should handle appointment cancellation', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      savedAppointment.status = 'Cancelled';
      savedAppointment.cancelledBy = testUser._id;
      savedAppointment.cancellationReason = 'Patient requested cancellation';
      savedAppointment.cancelledAt = new Date();
      const updatedAppointment = await savedAppointment.save();

      // Assert
      expect(updatedAppointment.status).toBe('Cancelled');
      expect(updatedAppointment.cancelledBy.toString()).toBe(testUser._id.toString());
      expect(updatedAppointment.cancellationReason).toBe('Patient requested cancellation');
      expect(updatedAppointment.cancelledAt).toBeDefined();
    });
  });

  describe('Appointment Queries', () => {
    beforeEach(async () => {
      // Create test appointments with various statuses and dates
      const baseDate = new Date();
      await Appointment.create([
        {
          patient: testPatient._id,
          doctor: testDoctor._id,
          hospital: testHospital._id,
          date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          time: '10:00',
          reason: 'Regular checkup',
          status: 'Scheduled',
          createdBy: testUser._id
        },
        {
          patient: testPatient._id,
          doctor: testDoctor._id,
          hospital: testHospital._id,
          date: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          time: '11:00',
          reason: 'Follow-up',
          status: 'Completed',
          createdBy: testUser._id
        },
        {
          patient: testPatient._id,
          doctor: testDoctor._id,
          hospital: testHospital._id,
          date: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
          time: '14:30',
          reason: 'Consultation',
          status: 'Confirmed',
          createdBy: testUser._id
        }
      ]);
    });

    test('should find appointments by status', async () => {
      // Act
      const scheduledAppointments = await Appointment.find({ status: 'Scheduled' });
      const completedAppointments = await Appointment.find({ status: 'Completed' });
      const confirmedAppointments = await Appointment.find({ status: 'Confirmed' });

      // Assert
      expect(scheduledAppointments).toHaveLength(1);
      expect(completedAppointments).toHaveLength(1);
      expect(confirmedAppointments).toHaveLength(1);

      expect(scheduledAppointments[0].status).toBe('Scheduled');
      expect(completedAppointments[0].status).toBe('Completed');
      expect(confirmedAppointments[0].status).toBe('Confirmed');
    });

    test('should find appointments by patient', async () => {
      // Act
      const patientAppointments = await Appointment.find({ patient: testPatient._id });

      // Assert
      expect(patientAppointments).toHaveLength(3);
      patientAppointments.forEach(appointment => {
        expect(appointment.patient.toString()).toBe(testPatient._id.toString());
      });
    });

    test('should find appointments by doctor', async () => {
      // Act
      const doctorAppointments = await Appointment.find({ doctor: testDoctor._id });

      // Assert
      expect(doctorAppointments).toHaveLength(3);
      doctorAppointments.forEach(appointment => {
        expect(appointment.doctor.toString()).toBe(testDoctor._id.toString());
      });
    });

    test('should find appointments by date range', async () => {
      // Arrange
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 25);

      // Act
      const appointments = await Appointment.find({
        date: { $gte: startDate, $lte: endDate }
      });

      // Assert
      expect(appointments).toHaveLength(3);
    });

    test('should count total appointments', async () => {
      // Act
      const appointmentCount = await Appointment.countDocuments();

      // Assert
      expect(appointmentCount).toBe(3);
    });

    test('should find appointments with pagination', async () => {
      // Act
      const page1 = await Appointment.find()
        .sort({ date: 1 })
        .limit(1)
        .skip(0);

      const page2 = await Appointment.find()
        .sort({ date: 1 })
        .limit(1)
        .skip(1);

      // Assert
      expect(page1).toHaveLength(1);
      expect(page2).toHaveLength(1);
      expect(page1[0]._id.toString()).not.toBe(page2[0]._id.toString());
    });

    test('should populate patient details', async () => {
      // Act
      const appointments = await Appointment.find()
        .populate('patient')
        .sort({ date: 1 });

      // Assert
      expect(appointments).toHaveLength(3);
      expect(appointments[0].patient).toBeDefined();
      expect(appointments[0].patient.user).toBeDefined();
    });

    test('should populate doctor details', async () => {
      // Act
      const appointments = await Appointment.find()
        .populate('doctor')
        .sort({ date: 1 });

      // Assert
      expect(appointments).toHaveLength(3);
      expect(appointments[0].doctor).toBeDefined();
      expect(appointments[0].doctor.user).toBeDefined();
    });
  });

  describe('Appointment Edge Cases', () => {
    test('should handle appointment with minimum valid data', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const minimalAppointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Checkup',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(minimalAppointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment._id).toBeDefined();
      expect(savedAppointment.status).toBe('Pending');
      expect(savedAppointment.hospital).toBeUndefined();
      expect(savedAppointment.notes).toBeUndefined();
      expect(savedAppointment.duration).toBe(30);
    });

    test('should handle appointment with all optional fields filled', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const completeAppointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        hospital: testHospital._id,
        date: futureDate,
        time: '10:00',
        reason: 'Comprehensive health check',
        notes: 'Patient has been experiencing fatigue',
        status: 'Confirmed',
        diagnosis: 'No significant issues found',
        prescription: [{
          medication: 'Vitamin D',
          dosage: '1000 IU',
          frequency: 'Once daily',
          duration: '1 month',
          instructions: 'Take with food'
        }],
        followUpDate: new Date(futureDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        followUpNotes: 'Return in 4 weeks for follow-up',
        createdBy: testUser._id
      };

      // Act
      const appointment = new Appointment(completeAppointmentData);
      const savedAppointment = await appointment.save();

      // Assert
      expect(savedAppointment.notes).toBe('Patient has been experiencing fatigue');
      expect(savedAppointment.diagnosis).toBe('No significant issues found');
      expect(savedAppointment.prescription).toHaveLength(1);
      expect(savedAppointment.followUpDate).toBeDefined();
      expect(savedAppointment.followUpNotes).toBe('Return in 4 weeks for follow-up');
    });

    test('should handle multiple prescriptions', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      savedAppointment.prescription.push(
        {
          medication: 'Aspirin',
          dosage: '81mg',
          frequency: 'Once daily',
          duration: 'Indefinite',
          instructions: 'Take in morning'
        },
        {
          medication: 'Omega-3',
          dosage: '1000mg',
          frequency: 'Once daily',
          duration: '3 months',
          instructions: 'Take with meals'
        }
      );
      const updatedAppointment = await savedAppointment.save();

      // Assert
      expect(updatedAppointment.prescription).toHaveLength(2);
      expect(updatedAppointment.prescription[0].medication).toBe('Aspirin');
      expect(updatedAppointment.prescription[1].medication).toBe('Omega-3');
    });

    test('should handle appointment with attachments', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      savedAppointment.attachments.push({
        filename: 'lab-results.pdf',
        url: 'https://example.com/lab-results.pdf'
      });
      const updatedAppointment = await savedAppointment.save();

      // Assert
      expect(updatedAppointment.attachments).toHaveLength(1);
      expect(updatedAppointment.attachments[0].filename).toBe('lab-results.pdf');
      expect(updatedAppointment.attachments[0].url).toBe('https://example.com/lab-results.pdf');
      expect(updatedAppointment.attachments[0].uploadedAt).toBeDefined();
    });

    test('should handle status transitions properly', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act & Assert - Test valid status transitions
      const statusTransitions = [
        { from: 'Pending', to: 'Scheduled' },
        { from: 'Scheduled', to: 'Confirmed' },
        { from: 'Confirmed', to: 'In Progress' },
        { from: 'In Progress', to: 'Completed' }
      ];

      let currentAppointment = savedAppointment;
      for (const transition of statusTransitions) {
        currentAppointment.status = transition.to;
        currentAppointment = await currentAppointment.save();
        expect(currentAppointment.status).toBe(transition.to);
      }
    });

    test('should validate cancellation reason length', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentData = {
        patient: testPatient._id,
        doctor: testDoctor._id,
        date: futureDate,
        time: '10:00',
        reason: 'Regular checkup',
        createdBy: testUser._id
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      // Act
      const longReason = 'A'.repeat(201); // Exceeds 200 character limit
      savedAppointment.cancellationReason = longReason;
      savedAppointment.status = 'Cancelled';

      // Assert
      await expect(savedAppointment.save()).rejects.toThrow('Cancellation reason cannot exceed 200 characters');
    });
  });
});
