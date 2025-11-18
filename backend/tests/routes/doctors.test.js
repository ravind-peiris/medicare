import request from 'supertest';
import express from 'express';

// Mock middleware
jest.mock('../src/middleware/auth.js', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'Patient',
      id: '507f1f77bcf86cd799439011'
    };
    next();
  }),
  restrictTo: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../src/middleware/validation.js', () => ({
  validateDoctorRegistration: jest.fn((req, res, next) => next()),
  validateObjectId: jest.fn(() => (req, res, next) => next()),
  validatePagination: jest.fn((req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/Doctor.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  distinct: jest.fn()
}));

jest.mock('../src/models/User.js', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../src/models/Appointment.js', () => ({
  find: jest.fn()
}));

jest.mock('../src/models/Patient.js', () => ({
  find: jest.fn()
}));

jest.mock('../src/models/Payment.js', () => ({
  find: jest.fn(),
  populate: jest.fn()
}));

// Import after mocks
import doctorsRouter from '../src/routes/doctors.js';
import Doctor from '../src/models/Doctor.js';
import User from '../src/models/User.js';
import Appointment from '../src/models/Appointment.js';
import Patient from '../src/models/Patient.js';
import Payment from '../src/models/Payment.js';

const app = express();
app.use(express.json());
app.use('/api/doctors', doctorsRouter);

describe('Doctors Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/doctors', () => {
    test('should get all doctors successfully', async () => {
      const mockDoctors = [{
        _id: '507f1f77bcf86cd799439013',
        specialization: 'Cardiology',
        department: 'Cardiology',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'Dr. John',
            lastName: 'Smith'
          }
        },
        rating: { average: 4.5 },
        isActive: true
      }];

      Doctor.find.mockResolvedValue(mockDoctors);
      Doctor.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/doctors');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.doctors).toHaveLength(1);
      expect(Doctor.find).toHaveBeenCalledWith(
        { isActive: true },
        expect.any(Object)
      );
    });

    test('should filter doctors by specialization', async () => {
      const mockDoctors = [{
        _id: '507f1f77bcf86cd799439013',
        specialization: 'Cardiology',
        user: { profile: { firstName: 'Dr. John' } }
      }];

      Doctor.find.mockResolvedValue(mockDoctors);

      const response = await request(app)
        .get('/api/doctors?specialization=cardiology');

      expect(response.status).toBe(200);
      expect(Doctor.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          specialization: { $regex: 'cardiology', $options: 'i' }
        }),
        expect.any(Object)
      );
    });

    test('should filter doctors by department', async () => {
      const mockDoctors = [{
        _id: '507f1f77bcf86cd799439013',
        department: 'Emergency',
        user: { profile: { firstName: 'Dr. Jane' } }
      }];

      Doctor.find.mockResolvedValue(mockDoctors);

      const response = await request(app)
        .get('/api/doctors?department=emergency');

      expect(response.status).toBe(200);
      expect(Doctor.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          department: { $regex: 'emergency', $options: 'i' }
        }),
        expect.any(Object)
      );
    });
  });

  describe('GET /api/doctors/:id', () => {
    test('should get doctor by ID', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        specialization: 'Cardiology',
        department: 'Cardiology',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'Dr. John',
            lastName: 'Smith'
          }
        },
        isActive: true
      };

      Doctor.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .get('/api/doctors/507f1f77bcf86cd799439013');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.doctor.specialization).toBe('Cardiology');
      expect(Doctor.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
    });

    test('should return 404 for non-existent doctor', async () => {
      Doctor.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/doctors/507f1f77bcf86cd799439013');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor not found');
    });

    test('should return 404 for inactive doctor', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        isActive: false
      };

      Doctor.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .get('/api/doctors/507f1f77bcf86cd799439013');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor not found');
    });
  });

  describe('POST /api/doctors', () => {
    test('should create doctor successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'Doctor'
      };

      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        user: mockUser._id,
        specialization: 'Cardiology',
        department: 'Cardiology',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: { firstName: 'Dr. John' }
        }
      };

      User.findById.mockResolvedValue(mockUser);
      Doctor.findOne.mockResolvedValue(null); // No existing doctor
      Doctor.create.mockResolvedValue(mockDoctor);

      const doctorData = {
        user: '507f1f77bcf86cd799439011',
        specialization: 'Cardiology',
        department: 'Cardiology',
        licenseNumber: 'DR123456',
        experience: 10,
        consultationFee: 5000
      };

      const response = await request(app)
        .post('/api/doctors')
        .set('Authorization', 'Bearer test-token')
        .send(doctorData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(Doctor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: '507f1f77bcf86cd799439011',
          specialization: 'Cardiology'
        })
      );
    });

    test('should return 400 for non-doctor user', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'Patient'
      };

      User.findById.mockResolvedValue(mockUser);

      const doctorData = {
        user: '507f1f77bcf86cd799439011',
        specialization: 'Cardiology'
      };

      const response = await request(app)
        .post('/api/doctors')
        .set('Authorization', 'Bearer test-token')
        .send(doctorData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User not found or is not a doctor');
    });

    test('should return 400 for existing doctor profile', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'Doctor'
      };

      User.findById.mockResolvedValue(mockUser);
      Doctor.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        user: '507f1f77bcf86cd799439011'
      });

      const doctorData = {
        user: '507f1f77bcf86cd799439011',
        specialization: 'Cardiology'
      };

      const response = await request(app)
        .post('/api/doctors')
        .set('Authorization', 'Bearer test-token')
        .send(doctorData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Doctor profile already exists for this user');
    });
  });

  describe('PUT /api/doctors/:id', () => {
    test('should update doctor successfully', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        user: '507f1f77bcf86cd799439011',
        specialization: 'Cardiology'
      };

      const updatedDoctor = {
        _id: '507f1f77bcf86cd799439013',
        specialization: 'Neurology',
        department: 'Neurology',
        user: { profile: { firstName: 'Dr. John' } }
      };

      Doctor.findById.mockResolvedValue(mockDoctor);
      Doctor.findByIdAndUpdate.mockResolvedValue(updatedDoctor);

      const updateData = {
        specialization: 'Neurology',
        department: 'Neurology'
      };

      const response = await request(app)
        .put('/api/doctors/507f1f77bcf86cd799439013')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.doctor.specialization).toBe('Neurology');
      expect(Doctor.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should return 403 for unauthorized doctor update', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        user: '507f1f77bcf86cd799439012' // Different user
      };

      Doctor.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .put('/api/doctors/507f1f77bcf86cd799439013')
        .set('Authorization', 'Bearer test-token')
        .send({ specialization: 'Neurology' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should return 404 for non-existent doctor', async () => {
      Doctor.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/doctors/507f1f77bcf86cd799439013')
        .set('Authorization', 'Bearer test-token')
        .send({ specialization: 'Neurology' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor not found');
    });
  });

  describe('GET /api/doctors/:id/availability', () => {
    test('should get doctor availability for specific date', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        availability: [{
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }],
        isActive: true
      };

      Doctor.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .get('/api/doctors/507f1f77bcf86cd799439013/availability?date=2024-12-23'); // Monday

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.available).toBe(true);
      expect(response.body.data.startTime).toBe('09:00');
      expect(response.body.data.endTime).toBe('17:00');
    });

    test('should return unavailable for non-working day', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        availability: [{
          dayOfWeek: 1, // Monday only
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }],
        isActive: true
      };

      Doctor.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .get('/api/doctors/507f1f77bcf86cd799439013/availability?date=2024-12-22'); // Sunday

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
      expect(response.body.data.message).toBe('Doctor not available on this day');
    });

    test('should return general availability without date', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }],
        isActive: true
      };

      Doctor.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .get('/api/doctors/507f1f77bcf86cd799439013/availability');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.availability).toHaveLength(1);
    });

    test('should return 404 for non-existent doctor', async () => {
      Doctor.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/doctors/507f1f77bcf86cd799439013/availability');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor not found');
    });
  });

  describe('GET /api/doctors/search', () => {
    test('should search doctors successfully', async () => {
      const mockDoctors = [{
        _id: '507f1f77bcf86cd799439013',
        specialization: 'Cardiology',
        user: { profile: { firstName: 'Dr. John' } }
      }];

      Doctor.find.mockResolvedValue(mockDoctors);
      Doctor.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/doctors/search?q=cardiology&page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.doctors).toHaveLength(1);
      expect(Doctor.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { specialization: { $regex: 'cardiology', $options: 'i' } }
          ]),
          isActive: true
        }),
        expect.any(Object)
      );
    });

    test('should return 400 for missing search query', async () => {
      const response = await request(app)
        .get('/api/doctors/search');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Search query is required');
    });
  });

  describe('GET /api/doctors/specializations', () => {
    test('should get all specializations', async () => {
      const specializations = ['Cardiology', 'Neurology', 'Orthopedics'];
      Doctor.distinct.mockResolvedValue(specializations);

      const response = await request(app)
        .get('/api/doctors/specializations');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.specializations).toEqual(specializations);
      expect(Doctor.distinct).toHaveBeenCalledWith('specialization', { isActive: true });
    });
  });

  describe('GET /api/doctors/departments', () => {
    test('should get all departments', async () => {
      const departments = ['Emergency', 'Surgery', 'Internal Medicine'];
      Doctor.distinct.mockResolvedValue(departments);

      const response = await request(app)
        .get('/api/doctors/departments');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.departments).toEqual(departments);
      expect(Doctor.distinct).toHaveBeenCalledWith('department', { isActive: true });
    });
  });

  describe('GET /api/doctors/me/profile', () => {
    test('should get doctor profile', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        specialization: 'Cardiology',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: { firstName: 'Dr. John' }
        }
      };

      Doctor.findOne.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .get('/api/doctors/me/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.doctor.specialization).toBe('Cardiology');
      expect(Doctor.findOne).toHaveBeenCalledWith({
        user: '507f1f77bcf86cd799439011'
      });
    });

    test('should return 404 for doctor profile not found', async () => {
      Doctor.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/doctors/me/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor profile not found');
    });

    test('should return 401 for non-doctor user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/doctors/me/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/doctors/me/patients', () => {
    test('should get doctor patients', async () => {
      const mockPatients = [{
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: { firstName: 'John', lastName: 'Doe' }
        }
      }];

      Patient.find.mockResolvedValue(mockPatients);

      const response = await request(app)
        .get('/api/doctors/me/patients')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.patients).toHaveLength(1);
      expect(Patient.find).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
    });

    test('should return 401 for non-doctor user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/doctors/me/patients')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/doctors/me/appointments', () => {
    test('should get doctor appointments', async () => {
      const mockAppointments = [{
        _id: '507f1f77bcf86cd799439011',
        date: new Date('2024-12-25'),
        time: '10:00',
        patient: {
          _id: '507f1f77bcf86cd799439012',
          user: { profile: { firstName: 'John' } }
        }
      }];

      Appointment.find.mockResolvedValue(mockAppointments);

      const response = await request(app)
        .get('/api/doctors/me/appointments')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.appointments).toHaveLength(1);
      expect(Appointment.find).toHaveBeenCalledWith({
        doctor: '507f1f77bcf86cd799439011'
      });
    });

    test('should return 401 for non-doctor user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/doctors/me/appointments')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/doctors/me/availability', () => {
    test('should get doctor availability', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }],
        consultationDuration: 30,
        breakDuration: 15
      };

      Doctor.findOne.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .get('/api/doctors/me/availability')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.availability).toHaveLength(1);
      expect(response.body.data.consultationDuration).toBe(30);
      expect(response.body.data.breakDuration).toBe(15);
    });

    test('should return 404 for doctor not found', async () => {
      Doctor.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/doctors/me/availability')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor profile not found');
    });
  });

  describe('PUT /api/doctors/me/availability', () => {
    test('should update doctor availability', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }],
        consultationDuration: 45,
        breakDuration: 20
      };

      Doctor.findOneAndUpdate.mockResolvedValue(mockDoctor);

      const updateData = {
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }],
        consultationDuration: 45,
        breakDuration: 20
      };

      const response = await request(app)
        .put('/api/doctors/me/availability')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Doctor.findOneAndUpdate).toHaveBeenCalledWith(
        { user: '507f1f77bcf86cd799439011' },
        expect.objectContaining({
          availability: updateData.availability,
          consultationDuration: 45,
          breakDuration: 20
        }),
        { new: true, runValidators: true }
      );
    });
  });

  describe('GET /api/doctors/me/revenue', () => {
    test('should get doctor revenue data', async () => {
      const mockPayments = [
        {
          _id: '507f1f77bcf86cd799439014',
          amount: 5000,
          paymentDate: new Date(),
          status: 'completed',
          appointment: {
            _id: '507f1f77bcf86cd799439011',
            doctor: '507f1f77bcf86cd799439011',
            patient: {
              user: { profile: { firstName: 'John', lastName: 'Doe' } }
            }
          }
        }
      ];

      Payment.find.mockResolvedValue(mockPayments);

      const response = await request(app)
        .get('/api/doctors/me/revenue')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.revenue.total).toBe(5000);
      expect(response.body.data.payments).toHaveLength(1);
      expect(Payment.find).toHaveBeenCalledWith({
        appointment: { $exists: true }
      });
    });

    test('should return 401 for non-doctor user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/doctors/me/revenue')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/doctors/:id', () => {
    test('should deactivate doctor successfully', async () => {
      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        isActive: true
      };

      Doctor.findByIdAndUpdate.mockResolvedValue({
        ...mockDoctor,
        isActive: false
      });

      const response = await request(app)
        .delete('/api/doctors/507f1f77bcf86cd799439013')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Doctor deactivated successfully');
      expect(Doctor.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        { isActive: false },
        { new: true }
      );
    });

    test('should return 404 for non-existent doctor', async () => {
      Doctor.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/doctors/507f1f77bcf86cd799439013')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor not found');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .delete('/api/doctors/507f1f77bcf86cd799439013')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });
});
