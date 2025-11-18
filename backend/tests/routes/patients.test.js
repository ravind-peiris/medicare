import request from 'supertest';
import express from 'express';

// Mock middleware
jest.mock('../src/middleware/auth.js', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'Patient'
    };
    next();
  }),
  restrictTo: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../src/middleware/validation.js', () => ({
  validatePatientRegistration: jest.fn((req, res, next) => next()),
  validateObjectId: jest.fn(() => (req, res, next) => next()),
  validatePagination: jest.fn((req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/Patient.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn()
}));

jest.mock('../src/models/User.js', () => ({
  findById: jest.fn()
}));

// Import after mocks
import patientsRouter from '../src/routes/patients.js';
import Patient from '../src/models/Patient.js';
import User from '../src/models/User.js';

const app = express();
app.use(express.json());
app.use('/api/patients', patientsRouter);

describe('Patients Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/patients', () => {
    test('should get all patients for doctor/manager', async () => {
      const mockPatients = [{
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        },
        isActive: true
      }];

      Patient.find.mockResolvedValue(mockPatients);
      Patient.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.patients).toHaveLength(1);
      expect(Patient.find).toHaveBeenCalledWith(
        { isActive: true },
        expect.any(Object)
      );
    });

    test('should return 401 for non-authorized user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/patients/me', () => {
    test('should get current patient profile', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        },
        medicalHistory: []
      };

      Patient.findOne.mockResolvedValue(mockPatient);

      const response = await request(app)
        .get('/api/patients/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.patient.cardNumber).toBe('HC123456789');
      expect(Patient.findOne).toHaveBeenCalledWith({
        user: '507f1f77bcf86cd799439011'
      });
    });

    test('should return 404 for patient profile not found', async () => {
      Patient.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/patients/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient profile not found');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/patients/me');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/patients/:id', () => {
    test('should get patient by ID for patient themselves', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        },
        medicalHistory: []
      };

      Patient.findById.mockResolvedValue(mockPatient);

      const response = await request(app)
        .get('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.patient.cardNumber).toBe('HC123456789');
      expect(Patient.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: {
          _id: '507f1f77bcf86cd799439013' // Different user
        }
      };

      Patient.findById.mockResolvedValue(mockPatient);

      const response = await request(app)
        .get('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('GET /api/patients/card/:cardNumber', () => {
    test('should get patient by card number', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789',
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        },
        isActive: true
      };

      Patient.findOne.mockResolvedValue(mockPatient);

      const response = await request(app)
        .get('/api/patients/card/HC123456789')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.patient.cardNumber).toBe('HC123456789');
      expect(Patient.findOne).toHaveBeenCalledWith({
        cardNumber: 'HC123456789',
        isActive: true
      });
    });

    test('should return 404 for non-existent card number', async () => {
      Patient.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/patients/card/HC123456789')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    test('should return 401 for non-authorized user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/patients/card/HC123456789')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/patients', () => {
    test('should create patient successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'Patient'
      };

      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: mockUser._id,
        cardNumber: 'HC123456789',
        bloodType: 'O+',
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      User.findById.mockResolvedValue(mockUser);
      Patient.findOne.mockResolvedValue(null); // No existing patient
      Patient.create.mockResolvedValue(mockPatient);

      const patientData = {
        user: '507f1f77bcf86cd799439011',
        bloodType: 'O+',
        allergies: ['None'],
        insurance: {
          provider: 'Test Insurance',
          policyNumber: 'POL123',
          coverageType: 'Full',
          expiryDate: '2025-12-31'
        }
      };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send(patientData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(Patient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: '507f1f77bcf86cd799439011',
          bloodType: 'O+'
        })
      );
    });

    test('should return 400 for non-patient user', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'Doctor'
      };

      User.findById.mockResolvedValue(mockUser);

      const patientData = {
        user: '507f1f77bcf86cd799439011',
        bloodType: 'O+'
      };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send(patientData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User not found or is not a patient');
    });

    test('should return 400 for existing patient profile', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'Patient'
      };

      User.findById.mockResolvedValue(mockUser);
      Patient.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        user: '507f1f77bcf86cd799439011'
      });

      const patientData = {
        user: '507f1f77bcf86cd799439011',
        bloodType: 'O+'
      };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send(patientData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Patient profile already exists for this user');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer test-token')
        .send({ user: '507f1f77bcf86cd799439011' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/patients/:id', () => {
    test('should update patient successfully', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: '507f1f77bcf86cd799439011',
        bloodType: 'O+',
        allergies: []
      };

      const updatedPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: '507f1f77bcf86cd799439011',
        bloodType: 'A+',
        allergies: ['Penicillin'],
        user: { profile: { firstName: 'John' } }
      };

      Patient.findById.mockResolvedValue(mockPatient);
      Patient.findByIdAndUpdate.mockResolvedValue(updatedPatient);

      const updateData = {
        bloodType: 'A+',
        allergies: ['Penicillin']
      };

      const response = await request(app)
        .put('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.patient.bloodType).toBe('A+');
      expect(Patient.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should return 403 for unauthorized update', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: '507f1f77bcf86cd799439013' // Different user
      };

      Patient.findById.mockResolvedValue(mockPatient);

      const response = await request(app)
        .put('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token')
        .send({ bloodType: 'A+' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token')
        .send({ bloodType: 'A+' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });
  });

  describe('POST /api/patients/:id/medical-history', () => {
    test('should add medical history successfully', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        medicalHistory: [],
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439012',
          medicalHistory: [{
            date: new Date(),
            type: 'Consultation',
            description: 'Regular checkup',
            doctor: '507f1f77bcf86cd799439011',
            department: 'General Medicine'
          }]
        })
      };

      Patient.findById.mockResolvedValue(mockPatient);

      const medicalData = {
        type: 'Consultation',
        description: 'Regular checkup',
        department: 'General Medicine'
      };

      const response = await request(app)
        .post('/api/patients/507f1f77bcf86cd799439012/medical-history')
        .set('Authorization', 'Bearer test-token')
        .send(medicalData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(mockPatient.save).toHaveBeenCalled();
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/patients/507f1f77bcf86cd799439012/medical-history')
        .set('Authorization', 'Bearer test-token')
        .send({ type: 'Consultation' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Type, description, and department are required');
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const medicalData = {
        type: 'Consultation',
        description: 'Regular checkup',
        department: 'General Medicine'
      };

      const response = await request(app)
        .post('/api/patients/507f1f77bcf86cd799439012/medical-history')
        .set('Authorization', 'Bearer test-token')
        .send(medicalData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    test('should return 401 for non-authorized user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .post('/api/patients/507f1f77bcf86cd799439012/medical-history')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'Consultation',
          description: 'Test',
          department: 'General'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/patients/search', () => {
    test('should search patients successfully', async () => {
      const mockPatients = [{
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789',
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          },
          email: 'john@example.com'
        },
        isActive: true
      }];

      Patient.find.mockResolvedValue(mockPatients);
      Patient.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/patients/search?q=john&page=1&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.patients).toHaveLength(1);
      expect(Patient.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { 'user.profile.firstName': { $regex: 'john', $options: 'i' } }
          ]),
          isActive: true
        }),
        expect.any(Object)
      );
    });

    test('should return 400 for missing search query', async () => {
      const response = await request(app)
        .get('/api/patients/search')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Search query is required');
    });

    test('should return 401 for non-authorized user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/patients/search?q=john')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/patients/:id', () => {
    test('should deactivate patient successfully', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        isActive: true
      };

      Patient.findByIdAndUpdate.mockResolvedValue({
        ...mockPatient,
        isActive: false
      });

      const response = await request(app)
        .delete('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Patient deactivated successfully');
      expect(Patient.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        { isActive: false },
        { new: true }
      );
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .delete('/api/patients/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/patients/:id/health-records', () => {
    test('should get patient health records', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: {
          _id: '507f1f77bcf86cd799439011'
        },
        medicalHistory: [{
          date: new Date(),
          type: 'Consultation',
          description: 'Regular checkup',
          doctor: {
            profile: {
              firstName: 'Dr. John'
            }
          }
        }]
      };

      Patient.findById.mockResolvedValue(mockPatient);

      const response = await request(app)
        .get('/api/patients/507f1f77bcf86cd799439012/health-records')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.healthRecords).toHaveLength(1);
      expect(Patient.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: {
          _id: '507f1f77bcf86cd799439013' // Different user
        }
      };

      const mockUserPatient = {
        _id: '507f1f77bcf86cd799439014' // Current user's patient
      };

      Patient.findById.mockResolvedValue(mockPatient);
      Patient.findOne.mockResolvedValue(mockUserPatient);

      const response = await request(app)
        .get('/api/patients/507f1f77bcf86cd799439012/health-records')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/patients/507f1f77bcf86cd799439012/health-records')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });
  });

  describe('POST /api/patients/:id/health-records', () => {
    test('should add health record successfully', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        medicalHistory: [],
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439012',
          medicalHistory: [{
            date: new Date(),
            type: 'Consultation',
            description: 'Regular checkup',
            doctor: '507f1f77bcf86cd799439011',
            department: 'General Medicine'
          }]
        })
      };

      Patient.findById.mockResolvedValue(mockPatient);

      const healthData = {
        type: 'Consultation',
        description: 'Regular checkup',
        department: 'General Medicine',
        attachments: []
      };

      const response = await request(app)
        .post('/api/patients/507f1f77bcf86cd799439012/health-records')
        .set('Authorization', 'Bearer test-token')
        .send(healthData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(mockPatient.save).toHaveBeenCalled();
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const healthData = {
        type: 'Consultation',
        description: 'Regular checkup',
        department: 'General Medicine'
      };

      const response = await request(app)
        .post('/api/patients/507f1f77bcf86cd799439012/health-records')
        .set('Authorization', 'Bearer test-token')
        .send(healthData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    test('should return 401 for non-authorized user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .post('/api/patients/507f1f77bcf86cd799439012/health-records')
        .set('Authorization', 'Bearer test-token')
        .send({
          type: 'Consultation',
          description: 'Test',
          department: 'General'
        });

      expect(response.status).toBe(401);
    });
  });
});
