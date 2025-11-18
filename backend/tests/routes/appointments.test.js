import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';

// Mock all middleware before importing the router
jest.mock('../src/middleware/auth.js', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'Patient'
    };
    next();
  })
}));

jest.mock('../src/middleware/validation.js', () => ({
  validateAppointment: jest.fn((req, res, next) => next()),
  validateObjectId: jest.fn(() => (req, res, next) => next()),
  validatePagination: jest.fn((req, res, next) => next())
}));

// Mock all models
jest.mock('../src/models/Appointment.js', () => {
  const mockAppointment = {
    _id: '507f1f77bcf86cd799439011',
    patient: '507f1f77bcf86cd799439012',
    doctor: '507f1f77bcf86cd799439013',
    hospital: '507f1f77bcf86cd799439014',
    date: new Date('2024-12-25'),
    time: '10:00',
    reason: 'Regular checkup',
    status: 'Scheduled',
    createdBy: '507f1f77bcf86cd799439011',
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      patient: '507f1f77bcf86cd799439012',
      doctor: '507f1f77bcf86cd799439013',
      date: new Date('2024-12-25'),
      time: '10:00',
      reason: 'Regular checkup',
      status: 'Scheduled'
    })
  };

  return {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn()
  };
});

jest.mock('../src/models/Bill.js', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  deleteMany: jest.fn()
}));

jest.mock('../src/models/Doctor.js', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../src/models/Patient.js', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../src/models/Hospital.js', () => ({
  findById: jest.fn()
}));

jest.mock('../src/models/User.js', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  connection: {
    readyState: 1
  },
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || '507f1f77bcf86cd799439011')
  }
}));

// Import the actual router after all mocks are set up
import appointmentsRouter from '../src/routes/appointments.js';
import Appointment from '../src/models/Appointment.js';
import Bill from '../src/models/Bill.js';
import Doctor from '../src/models/Doctor.js';
import Patient from '../src/models/Patient.js';
import Hospital from '../src/models/Hospital.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentsRouter);

describe('Appointments Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/appointments', () => {
    test('should get appointments successfully', async () => {
      const mockAppointments = [{
        _id: '507f1f77bcf86cd799439011',
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        date: new Date('2024-12-25'),
        time: '10:00',
        reason: 'Regular checkup',
        status: 'Scheduled',
        toObject: () => ({
          _id: '507f1f77bcf86cd799439011',
          patient: '507f1f77bcf86cd799439012',
          doctor: '507f1f77bcf86cd799439013',
          date: new Date('2024-12-25'),
          time: '10:00',
          reason: 'Regular checkup',
          status: 'Scheduled'
        })
      }];

      Appointment.find.mockResolvedValue(mockAppointments);
      Appointment.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.appointments).toHaveLength(1);
      expect(Appointment.find).toHaveBeenCalled();
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/appointments');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    test('should handle database connection error', async () => {
      // Mock mongoose to simulate connection failure
      const mongoose = require('mongoose');
      mongoose.connection.readyState = 0;

      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Database connection is not ready');
    });

    test('should filter appointments by status', async () => {
      const mockAppointments = [{
        _id: '507f1f77bcf86cd799439011',
        status: 'Confirmed',
        toObject: () => ({ _id: '507f1f77bcf86cd799439011', status: 'Confirmed' })
      }];

      Appointment.find.mockResolvedValue(mockAppointments);

      const response = await request(app)
        .get('/api/appointments?status=Confirmed')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Appointment.find).toHaveBeenCalledWith({
        status: 'Confirmed',
        $or: expect.any(Array)
      });
    });
  });

  describe('GET /api/appointments/:id', () => {
    test('should get appointment by ID', async () => {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439011',
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        hospital: '507f1f77bcf86cd799439014',
        date: new Date('2024-12-25'),
        time: '10:00',
        reason: 'Regular checkup',
        status: 'Scheduled',
        createdBy: '507f1f77bcf86cd799439011',
        toObject: () => ({
          _id: '507f1f77bcf86cd799439011',
          patient: { _id: '507f1f77bcf86cd799439012', firstName: 'John', lastName: 'Doe' },
          doctor: { _id: '507f1f77bcf86cd799439013', firstName: 'Dr. Smith' },
          hospital: { _id: '507f1f77bcf86cd799439014', name: 'Test Hospital' },
          date: new Date('2024-12-25'),
          time: '10:00',
          reason: 'Regular checkup',
          status: 'Scheduled'
        })
      };

      Appointment.findById.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .get('/api/appointments/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Appointment.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 404 for non-existent appointment', async () => {
      Appointment.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/appointments/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Appointment not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/appointments/invalid-id')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid appointment ID format');
    });
  });

  describe('POST /api/appointments', () => {
    test('should create appointment successfully', async () => {
      // Mock successful model responses
      Patient.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        user: { firstName: 'John', lastName: 'Doe' }
      });
      Doctor.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        user: { firstName: 'Dr. Smith' },
        consultationFee: 5000
      });
      Hospital.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        name: 'Test Hospital'
      });
      Appointment.findOne.mockResolvedValue(null); // No conflicts
      Appointment.create.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        hospital: '507f1f77bcf86cd799439014',
        date: new Date('2024-12-25'),
        time: '10:00',
        reason: 'Regular checkup',
        status: 'Pending'
      });

      const appointmentData = {
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        hospital: '507f1f77bcf86cd799439014',
        date: '2024-12-25',
        time: '10:00',
        reason: 'Regular checkup'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', 'Bearer test-token')
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(Appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patient: '507f1f77bcf86cd799439012',
          doctor: '507f1f77bcf86cd799439013',
          status: 'Pending'
        })
      );
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const appointmentData = {
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        date: '2024-12-25',
        time: '10:00',
        reason: 'Test appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', 'Bearer test-token')
        .send(appointmentData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    test('should return 400 for time slot conflict', async () => {
      Patient.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });
      Doctor.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439013' });
      Appointment.findOne.mockResolvedValue({
        _id: 'existing_appointment',
        date: new Date('2024-12-25'),
        time: '10:00'
      });

      const appointmentData = {
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        date: '2024-12-25',
        time: '10:00',
        reason: 'Conflicting appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', 'Bearer test-token')
        .send(appointmentData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Time slot is already booked');
    });
  });

  describe('PUT /api/appointments/:id', () => {
    test('should update appointment successfully', async () => {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439011',
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        status: 'Pending'
      };

      Appointment.findById.mockResolvedValue(mockAppointment);
      Appointment.findByIdAndUpdate.mockResolvedValue({
        ...mockAppointment,
        reason: 'Updated appointment',
        time: '11:00'
      });

      const response = await request(app)
        .put('/api/appointments/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token')
        .send({ reason: 'Updated appointment', time: '11:00' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Appointment.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should create bill when status changes to confirmed', async () => {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439011',
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        hospital: '507f1f77bcf86cd799439014',
        status: 'Pending'
      };

      Appointment.findById.mockResolvedValue(mockAppointment);
      Appointment.findByIdAndUpdate.mockResolvedValue({
        ...mockAppointment,
        status: 'Confirmed'
      });

      const mockBill = {
        _id: '507f1f77bcf86cd799439015',
        appointment: '507f1f77bcf86cd799439011',
        totalAmount: 6000,
        status: 'Pending'
      };
      Bill.create.mockResolvedValue(mockBill);

      const response = await request(app)
        .put('/api/appointments/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'Confirmed' });

      expect(response.status).toBe(200);
      expect(Bill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment: '507f1f77bcf86cd799439011',
          totalAmount: 6000,
          status: 'Pending'
        })
      );
    });

    test('should return 404 for non-existent appointment', async () => {
      Appointment.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/appointments/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token')
        .send({ reason: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Appointment not found');
    });
  });

  describe('PUT /api/appointments/:id/cancel', () => {
    test('should cancel appointment successfully', async () => {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439011',
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        status: 'Scheduled',
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          status: 'Cancelled',
          cancelledAt: new Date(),
          cancelledBy: '507f1f77bcf86cd799439011',
          cancellationReason: 'Patient request'
        })
      };

      Appointment.findById.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .put('/api/appointments/507f1f77bcf86cd799439011/cancel')
        .set('Authorization', 'Bearer test-token')
        .send({ cancellationReason: 'Patient request' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Appointment cancelled successfully');
      expect(mockAppointment.save).toHaveBeenCalled();
    });

    test('should return 400 for already cancelled appointment', async () => {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Cancelled'
      };

      Appointment.findById.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .put('/api/appointments/507f1f77bcf86cd799439011/cancel')
        .set('Authorization', 'Bearer test-token')
        .send({ cancellationReason: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot cancel cancelled appointment');
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    test('should delete appointment successfully', async () => {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Pending'
      };

      Appointment.findById.mockResolvedValue(mockAppointment);
      Appointment.findByIdAndDelete.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .delete('/api/appointments/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Appointment deleted successfully');
      expect(Appointment.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 400 for non-pending appointment', async () => {
      const mockAppointment = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Confirmed'
      };

      Appointment.findById.mockResolvedValue(mockAppointment);

      const response = await request(app)
        .delete('/api/appointments/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Only pending appointments can be deleted');
    });
  });

  describe('GET /api/appointments/available-slots', () => {
    test('should return available slots', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        availability: [{
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }]
      };

      Doctor.findById.mockResolvedValue(mockDoctor);
      Appointment.find.mockResolvedValue([]); // No booked appointments

      const response = await request(app)
        .get('/api/appointments/available-slots?doctor=507f1f77bcf86cd799439013&date=2024-12-23');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.available).toBe(true);
      expect(Array.isArray(response.body.data.slots)).toBe(true);
    });

    test('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/api/appointments/available-slots');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Doctor ID and date are required');
    });

    test('should return 404 for non-existent doctor', async () => {
      Doctor.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/appointments/available-slots?doctor=507f1f77bcf86cd799439013&date=2024-12-23');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor not found');
    });

    test('should return unavailable for doctor not available on given day', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        availability: [{
          dayOfWeek: 1, // Monday only
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }]
      };

      Doctor.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .get('/api/appointments/available-slots?doctor=507f1f77bcf86cd799439013&date=2024-12-22'); // Sunday

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
      expect(response.body.data.message).toBe('Doctor not available on this day');
    });
  });
});
