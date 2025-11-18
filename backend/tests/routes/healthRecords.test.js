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
  validateObjectId: jest.fn(() => (req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/HealthRecord.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

jest.mock('../src/models/Patient.js', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../src/models/Doctor.js', () => ({
  findOne: jest.fn()
}));

// Import after mocks
import healthRecordsRouter from '../src/routes/healthRecords.js';
import HealthRecord from '../src/models/HealthRecord.js';
import Patient from '../src/models/Patient.js';
import Doctor from '../src/models/Doctor.js';

const app = express();
app.use(express.json());
app.use('/api/health-records', healthRecordsRouter);

describe('Health Records Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health-records/patient/:patientId', () => {
    test('should get health records for patient', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      const mockRecords = [
        {
          _id: '507f1f77bcf86cd799439014',
          patient: mockPatient._id,
          diagnosis: 'Hypertension',
          treatment: 'Medication',
          date: new Date(),
          doctor: {
            _id: '507f1f77bcf86cd799439013',
            user: {
              profile: {
                firstName: 'Dr. Smith'
              }
            }
          }
        }
      ];

      Patient.findById.mockResolvedValue(mockPatient);
      HealthRecord.find.mockResolvedValue(mockRecords);

      const response = await request(app)
        .get('/api/health-records/patient/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.records).toHaveLength(1);
      expect(response.body.results).toBe(1);
      expect(Patient.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(HealthRecord.find).toHaveBeenCalledWith({
        patient: '507f1f77bcf86cd799439012',
        isActive: true
      });
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/health-records/patient/507f1f77bcf86cd799439012')
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

      const mockUserPatient = {
        _id: '507f1f77bcf86cd799439015' // Current user's patient
      };

      Patient.findById.mockResolvedValue(mockPatient);
      Patient.findOne.mockResolvedValue(mockUserPatient);

      const response = await request(app)
        .get('/api/health-records/patient/507f1f77bcf86cd799439012')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/health-records/patient/507f1f77bcf86cd799439012');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/health-records/me', () => {
    test('should get current patient health records', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      const mockRecords = [
        {
          _id: '507f1f77bcf86cd799439014',
          patient: mockPatient._id,
          diagnosis: 'Hypertension',
          date: new Date(),
          doctor: {
            user: {
              profile: {
                firstName: 'Dr. Smith'
              }
            }
          }
        }
      ];

      Patient.findOne.mockResolvedValue(mockPatient);
      HealthRecord.find.mockResolvedValue(mockRecords);

      const response = await request(app)
        .get('/api/health-records/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.records).toHaveLength(1);
      expect(Patient.findOne).toHaveBeenCalledWith({
        user: '507f1f77bcf86cd799439011'
      });
    });

    test('should return 404 for patient profile not found', async () => {
      Patient.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/health-records/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient profile not found');
    });

    test('should return 401 for non-patient user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/health-records/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/health-records/me');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/health-records/:id', () => {
    test('should get single health record', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      const mockRecord = {
        _id: '507f1f77bcf86cd799439014',
        patient: mockPatient,
        doctor: {
          _id: '507f1f77bcf86cd799439013',
          user: {
            profile: {
              firstName: 'Dr. Smith'
            }
          }
        },
        diagnosis: 'Hypertension',
        treatment: 'Medication',
        date: new Date()
      };

      Patient.findOne.mockResolvedValue(mockPatient);
      HealthRecord.findById.mockResolvedValue(mockRecord);

      const response = await request(app)
        .get('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.record.diagnosis).toBe('Hypertension');
      expect(HealthRecord.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
    });

    test('should return 404 for non-existent health record', async () => {
      HealthRecord.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Health record not found');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockRecord = {
        _id: '507f1f77bcf86cd799439014',
        patient: {
          _id: '507f1f77bcf86cd799439013' // Different patient
        }
      };

      const mockPatient = {
        _id: '507f1f77bcf86cd799439015' // Current user's patient
      };

      HealthRecord.findById.mockResolvedValue(mockRecord);
      Patient.findOne.mockResolvedValue(mockPatient);

      const response = await request(app)
        .get('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/health-records/507f1f77bcf86cd799439014');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/health-records', () => {
    test('should create health record successfully', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        user: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'Dr. Smith'
          }
        }
      };

      const mockRecord = {
        _id: '507f1f77bcf86cd799439014',
        patient: mockPatient._id,
        doctor: mockDoctor,
        diagnosis: 'Hypertension',
        treatment: 'Medication',
        date: new Date()
      };

      Patient.findById.mockResolvedValue(mockPatient);
      Doctor.findOne.mockResolvedValue(mockDoctor);
      HealthRecord.create.mockResolvedValue(mockRecord);

      const recordData = {
        patientId: '507f1f77bcf86cd799439012',
        diagnosis: 'Hypertension',
        treatment: 'Medication',
        prescription: ['Medicine A', 'Medicine B'],
        notes: 'Patient showing improvement',
        vitalSigns: {
          bloodPressure: '120/80',
          temperature: '98.6'
        },
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/health-records')
        .set('Authorization', 'Bearer test-token')
        .send(recordData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.record.diagnosis).toBe('Hypertension');
      expect(HealthRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patient: '507f1f77bcf86cd799439012',
          doctor: '507f1f77bcf86cd799439013',
          diagnosis: 'Hypertension'
        })
      );
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const recordData = {
        patientId: '507f1f77bcf86cd799439012',
        diagnosis: 'Hypertension',
        treatment: 'Medication'
      };

      const response = await request(app)
        .post('/api/health-records')
        .set('Authorization', 'Bearer test-token')
        .send(recordData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    test('should return 404 for doctor profile not found', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012'
      };

      Patient.findById.mockResolvedValue(mockPatient);
      Doctor.findOne.mockResolvedValue(null);

      const recordData = {
        patientId: '507f1f77bcf86cd799439012',
        diagnosis: 'Hypertension',
        treatment: 'Medication'
      };

      const response = await request(app)
        .post('/api/health-records')
        .set('Authorization', 'Bearer test-token')
        .send(recordData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Doctor profile not found');
    });

    test('should return 401 for non-doctor user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .post('/api/health-records')
        .set('Authorization', 'Bearer test-token')
        .send({
          patientId: '507f1f77bcf86cd799439012',
          diagnosis: 'Hypertension',
          treatment: 'Medication'
        });

      expect(response.status).toBe(401);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).post('/api/health-records');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/health-records/:id', () => {
    test('should update health record successfully', async () => {
      const mockRecord = {
        _id: '507f1f77bcf86cd799439014',
        patient: '507f1f77bcf86cd799439012',
        doctor: '507f1f77bcf86cd799439013',
        diagnosis: 'Hypertension'
      };

      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        user: {
          _id: '507f1f77bcf86cd799439011'
        }
      };

      const updatedRecord = {
        _id: '507f1f77bcf86cd799439014',
        diagnosis: 'Controlled Hypertension',
        treatment: 'Updated treatment',
        doctor: {
          user: {
            profile: {
              firstName: 'Dr. Smith'
            }
          }
        }
      };

      HealthRecord.findById.mockResolvedValue(mockRecord);
      Doctor.findOne.mockResolvedValue(mockDoctor);
      HealthRecord.findByIdAndUpdate.mockResolvedValue(updatedRecord);

      const updateData = {
        diagnosis: 'Controlled Hypertension',
        treatment: 'Updated treatment',
        prescription: ['Updated Medicine']
      };

      const response = await request(app)
        .put('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.record.diagnosis).toBe('Controlled Hypertension');
      expect(HealthRecord.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        expect.objectContaining({
          diagnosis: 'Controlled Hypertension',
          treatment: 'Updated treatment'
        }),
        { new: true, runValidators: true }
      );
    });

    test('should return 404 for non-existent health record', async () => {
      HealthRecord.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token')
        .send({ diagnosis: 'Updated diagnosis' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Health record not found');
    });

    test('should return 403 for unauthorized doctor', async () => {
      const mockRecord = {
        _id: '507f1f77bcf86cd799439014',
        doctor: '507f1f77bcf86cd799439013' // Different doctor
      };

      HealthRecord.findById.mockResolvedValue(mockRecord);
      Doctor.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439015' // Current user's doctor
      });

      const response = await request(app)
        .put('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token')
        .send({ diagnosis: 'Updated diagnosis' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should return 401 for non-doctor user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .put('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token')
        .send({ diagnosis: 'Updated diagnosis' });

      expect(response.status).toBe(401);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).put('/api/health-records/507f1f77bcf86cd799439014');
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/health-records/:id', () => {
    test('should delete health record successfully', async () => {
      const mockRecord = {
        _id: '507f1f77bcf86cd799439014',
        doctor: '507f1f77bcf86cd799439013',
        isActive: true,
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439014',
          isActive: false
        })
      };

      const mockDoctor = {
        _id: '507f1f77bcf86cd799439013',
        user: {
          _id: '507f1f77bcf86cd799439011'
        }
      };

      HealthRecord.findById.mockResolvedValue(mockRecord);
      Doctor.findOne.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .delete('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Health record deleted successfully');
      expect(mockRecord.save).toHaveBeenCalled();
    });

    test('should return 404 for non-existent health record', async () => {
      HealthRecord.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Health record not found');
    });

    test('should return 403 for unauthorized doctor', async () => {
      const mockRecord = {
        _id: '507f1f77bcf86cd799439014',
        doctor: '507f1f77bcf86cd799439013' // Different doctor
      };

      HealthRecord.findById.mockResolvedValue(mockRecord);
      Doctor.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439015' // Current user's doctor
      });

      const response = await request(app)
        .delete('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should allow manager to delete any record', async () => {
      const mockRecord = {
        _id: '507f1f77bcf86cd799439014',
        doctor: '507f1f77bcf86cd799439013',
        isActive: true,
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439014',
          isActive: false
        })
      };

      HealthRecord.findById.mockResolvedValue(mockRecord);
      Doctor.findOne.mockResolvedValue(null); // Manager doesn't have doctor profile

      const response = await request(app)
        .delete('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockRecord.save).toHaveBeenCalled();
    });

    test('should return 401 for non-authorized user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .delete('/api/health-records/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).delete('/api/health-records/507f1f77bcf86cd799439014');
      expect(response.status).toBe(401);
    });
  });
});
