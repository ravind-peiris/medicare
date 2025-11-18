import request from 'supertest';
import express from 'express';

// Mock middleware
jest.mock('../src/middleware/auth.js', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'Healthcare Manager'
    };
    next();
  }),
  restrictTo: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../src/middleware/validation.js', () => ({
  validateObjectId: jest.fn(() => (req, res, next) => next()),
  validatePagination: jest.fn((req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/Hospital.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn()
}));

// Import after mocks
import hospitalsRouter from '../src/routes/hospitals.js';
import Hospital from '../src/models/Hospital.js';

const app = express();
app.use(express.json());
app.use('/api/hospitals', hospitalsRouter);

describe('Hospitals Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/hospitals', () => {
    test('should get all hospitals successfully', async () => {
      const mockHospitals = [{
        _id: '507f1f77bcf86cd799439014',
        name: 'Test Hospital',
        type: 'Private',
        address: {
          city: 'Test City',
          state: 'Test State'
        },
        isActive: true,
        rating: { average: 4.5 }
      }];

      Hospital.find.mockResolvedValue(mockHospitals);
      Hospital.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/hospitals');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.hospitals).toHaveLength(1);
      expect(response.body.total).toBe(1);
      expect(Hospital.find).toHaveBeenCalledWith(
        { isActive: true },
        expect.any(Object)
      );
    });

    test('should filter hospitals by type', async () => {
      const mockHospitals = [{
        _id: '507f1f77bcf86cd799439014',
        name: 'Private Hospital',
        type: 'Private',
        isActive: true
      }];

      Hospital.find.mockResolvedValue(mockHospitals);

      const response = await request(app)
        .get('/api/hospitals?type=Private');

      expect(response.status).toBe(200);
      expect(Hospital.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          type: 'Private'
        }),
        expect.any(Object)
      );
    });

    test('should filter hospitals by city', async () => {
      const mockHospitals = [{
        _id: '507f1f77bcf86cd799439014',
        name: 'City Hospital',
        address: { city: 'New York' },
        isActive: true
      }];

      Hospital.find.mockResolvedValue(mockHospitals);

      const response = await request(app)
        .get('/api/hospitals?city=new');

      expect(response.status).toBe(200);
      expect(Hospital.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          'address.city': { $regex: 'new', $options: 'i' }
        }),
        expect.any(Object)
      );
    });
  });

  describe('GET /api/hospitals/:id', () => {
    test('should get hospital by ID', async () => {
      const mockHospital = {
        _id: '507f1f77bcf86cd799439014',
        name: 'Test Hospital',
        type: 'Private',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        contact: {
          phone: '+1234567890',
          email: 'hospital@test.com'
        },
        departments: ['Emergency', 'Surgery'],
        facilities: ['ICU', 'MRI'],
        isActive: true
      };

      Hospital.findById.mockResolvedValue(mockHospital);

      const response = await request(app)
        .get('/api/hospitals/507f1f77bcf86cd799439014');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.hospital.name).toBe('Test Hospital');
      expect(Hospital.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
    });

    test('should return 404 for non-existent hospital', async () => {
      Hospital.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/hospitals/507f1f77bcf86cd799439014');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Hospital not found');
    });

    test('should return 404 for inactive hospital', async () => {
      const mockHospital = {
        _id: '507f1f77bcf86cd799439014',
        isActive: false
      };

      Hospital.findById.mockResolvedValue(mockHospital);

      const response = await request(app)
        .get('/api/hospitals/507f1f77bcf86cd799439014');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Hospital not found');
    });
  });

  describe('POST /api/hospitals', () => {
    test('should create hospital successfully', async () => {
      const mockHospital = {
        _id: '507f1f77bcf86cd799439014',
        name: 'New Hospital',
        type: 'Private',
        address: {
          street: '456 New St',
          city: 'New City',
          state: 'New State',
          zipCode: '67890',
          country: 'New Country'
        },
        contact: {
          phone: '+1987654321',
          email: 'new@hospital.com'
        },
        departments: ['Emergency', 'General Medicine'],
        facilities: ['ICU', 'Laboratory'],
        isActive: true
      };

      Hospital.create.mockResolvedValue(mockHospital);

      const hospitalData = {
        name: 'New Hospital',
        type: 'Private',
        address: {
          street: '456 New St',
          city: 'New City',
          state: 'New State',
          zipCode: '67890',
          country: 'New Country'
        },
        contact: {
          phone: '+1987654321',
          email: 'new@hospital.com'
        },
        departments: ['Emergency', 'General Medicine'],
        facilities: ['ICU', 'Laboratory'],
        operatingHours: {
          weekdays: { open: '08:00', close: '20:00' },
          weekends: { open: '09:00', close: '18:00' }
        },
        emergencyServices: true
      };

      const response = await request(app)
        .post('/api/hospitals')
        .set('Authorization', 'Bearer test-token')
        .send(hospitalData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.hospital.name).toBe('New Hospital');
      expect(Hospital.create).toHaveBeenCalledWith(hospitalData);
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .post('/api/hospitals')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Test Hospital' });

      expect(response.status).toBe(401);
    });

    test('should handle creation errors', async () => {
      Hospital.create.mockRejectedValue(new Error('Creation failed'));

      const hospitalData = {
        name: 'Test Hospital',
        type: 'Private'
      };

      const response = await request(app)
        .post('/api/hospitals')
        .set('Authorization', 'Bearer test-token')
        .send(hospitalData);

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Creation failed');
    });
  });

  describe('PUT /api/hospitals/:id', () => {
    test('should update hospital successfully', async () => {
      const mockHospital = {
        _id: '507f1f77bcf86cd799439014',
        name: 'Original Hospital',
        type: 'Private'
      };

      const updatedHospital = {
        _id: '507f1f77bcf86cd799439014',
        name: 'Updated Hospital',
        type: 'Public',
        address: {
          street: '789 Updated St',
          city: 'Updated City'
        }
      };

      Hospital.findByIdAndUpdate.mockResolvedValue(updatedHospital);

      const updateData = {
        name: 'Updated Hospital',
        type: 'Public',
        address: {
          street: '789 Updated St',
          city: 'Updated City'
        }
      };

      const response = await request(app)
        .put('/api/hospitals/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.hospital.name).toBe('Updated Hospital');
      expect(Hospital.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        updateData,
        { new: true, runValidators: true }
      );
    });

    test('should return 404 for non-existent hospital', async () => {
      Hospital.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/hospitals/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Updated Hospital' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Hospital not found');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .put('/api/hospitals/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Updated Hospital' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/hospitals/:id', () => {
    test('should delete hospital successfully', async () => {
      const mockHospital = {
        _id: '507f1f77bcf86cd799439014',
        name: 'Test Hospital',
        isActive: true
      };

      Hospital.findByIdAndUpdate.mockResolvedValue({
        ...mockHospital,
        isActive: false
      });

      const response = await request(app)
        .delete('/api/hospitals/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Hospital deleted successfully');
      expect(Hospital.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        { isActive: false },
        { new: true }
      );
    });

    test('should return 404 for non-existent hospital', async () => {
      Hospital.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/hospitals/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Hospital not found');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .delete('/api/hospitals/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should handle deletion errors', async () => {
      Hospital.findByIdAndUpdate.mockRejectedValue(new Error('Deletion failed'));

      const response = await request(app)
        .delete('/api/hospitals/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Deletion failed');
    });
  });
});
