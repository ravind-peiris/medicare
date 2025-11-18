import request from 'supertest';
import express from 'express';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ id: '507f1f77bcf86cd799439011' }))
}));

// Mock middleware
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
  validateUserRegistration: jest.fn((req, res, next) => next()),
  validateUserLogin: jest.fn((req, res, next) => next()),
  validateUserUpdate: jest.fn((req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/User.js', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByCredentials: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

jest.mock('../src/models/Patient.js', () => ({
  create: jest.fn()
}));

jest.mock('../src/models/Doctor.js', () => ({
  create: jest.fn()
}));

// Mock process.env
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '7d';

// Import after mocks
import authRouter from '../src/routes/auth.js';
import User from '../src/models/User.js';
import Patient from '../src/models/Patient.js';
import Doctor from '../src/models/Doctor.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Authentication Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/debug-register', () => {
    test('should return debug data successfully', async () => {
      const debugData = {
        username: 'testuser',
        email: 'test@example.com',
        role: 'Patient'
      };

      const response = await request(app)
        .post('/api/auth/debug-register')
        .send(debugData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Debug data received');
      expect(response.body.data).toEqual(debugData);
    });

    test('should handle errors', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // This route doesn't actually throw errors in the current implementation
      const response = await request(app)
        .post('/api/auth/debug-register')
        .send({});

      expect(response.status).toBe(200);
      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register patient successfully', async () => {
      const userData = {
        username: 'testpatient',
        email: 'patient@example.com',
        password: 'password123',
        role: 'Patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-01'),
          address: '123 Test St',
          gender: 'Male',
          emergencyContact: '+1234567891'
        },
        patientInfo: {
          bloodType: 'O+',
          allergies: ['None'],
          insurance: {
            provider: 'Test Insurance',
            policyNumber: 'POL123',
            coverageType: 'Full',
            expiryDate: new Date('2025-12-31')
          }
        }
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...userData,
        password: undefined
      });
      Patient.create.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        user: '507f1f77bcf86cd799439011',
        cardNumber: 'HC123456789'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBe('mock-jwt-token');
      expect(response.body.data.user.username).toBe('testpatient');
      expect(User.create).toHaveBeenCalled();
      expect(Patient.create).toHaveBeenCalled();
    });

    test('should register doctor successfully', async () => {
      const userData = {
        username: 'testdoctor',
        email: 'doctor@example.com',
        password: 'password123',
        role: 'Doctor',
        profile: {
          firstName: 'Dr. Jane',
          lastName: 'Smith',
          phone: '+1234567890',
          dateOfBirth: new Date('1985-01-01'),
          address: '456 Doctor St',
          gender: 'Female',
          emergencyContact: '+1234567891'
        },
        doctorInfo: {
          specialization: 'Cardiology',
          department: 'Cardiology',
          licenseNumber: 'DR123456',
          experience: 10,
          consultationFee: 5000,
          availability: [{
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true
          }],
          qualifications: 'MD, PhD',
          languages: 'English, Spanish',
          bio: 'Experienced cardiologist'
        }
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...userData,
        password: undefined
      });
      Doctor.create.mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        user: '507f1f77bcf86cd799439011',
        specialization: 'Cardiology',
        licenseNumber: 'DR123456'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBe('mock-jwt-token');
      expect(Doctor.create).toHaveBeenCalled();
    });

    test('should return 400 for existing user', async () => {
      User.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'patient@example.com'
      });

      const userData = {
        username: 'testpatient',
        email: 'patient@example.com',
        password: 'password123',
        role: 'Patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-01'),
          address: '123 Test St',
          gender: 'Male',
          emergencyContact: '+1234567891'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User with this email or username already exists');
    });

    test('should handle registration errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));

      const userData = {
        username: 'testpatient',
        email: 'patient@example.com',
        password: 'password123',
        role: 'Patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-01'),
          address: '123 Test St',
          gender: 'Male',
          emergencyContact: '+1234567891'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: 'Patient',
        password: undefined, // Should be removed by createSendToken
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          role: 'Patient',
          lastLogin: new Date()
        })
      };

      User.findByCredentials.mockResolvedValue(mockUser);

      const loginData = {
        identifier: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBe('mock-jwt-token');
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should return 401 for invalid credentials', async () => {
      User.findByCredentials.mockRejectedValue(new Error('Invalid credentials'));

      const loginData = {
        identifier: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should get current user successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: 'Patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.username).toBe('testuser');
      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });

    test('should handle user not found', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/auth/me', () => {
    test('should update user successfully', async () => {
      const updatedUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'newemail@example.com',
        role: 'Patient',
        profile: {
          firstName: 'John',
          lastName: 'Updated'
        }
      };

      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const updateData = {
        email: 'newemail@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Updated'
        }
      };

      const response = await request(app)
        .put('/api/auth/me')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('newemail@example.com');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { email: 'newemail@example.com', profile: { firstName: 'John', lastName: 'Updated' } },
        { new: true, runValidators: true }
      );
    });

    test('should return 401 without token', async () => {
      const response = await request(app).put('/api/auth/me');
      expect(response.status).toBe(401);
    });

    test('should handle update errors', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/auth/me')
        .set('Authorization', 'Bearer test-token')
        .send({ email: 'new@example.com' });

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    test('should change password successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        password: 'hashedpassword',
        correctPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          password: 'newhashedpassword'
        })
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer test-token')
        .send({
          currentPassword: 'current123',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password updated successfully');
      expect(mockUser.correctPassword).toHaveBeenCalledWith('current123', 'hashedpassword');
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should return 400 for missing passwords', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer test-token')
        .send({ currentPassword: 'current123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Current password and new password are required');
    });

    test('should return 400 for short password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer test-token')
        .send({
          currentPassword: 'current123',
          newPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('New password must be at least 6 characters long');
    });

    test('should return 400 for incorrect current password', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        password: 'hashedpassword',
        correctPassword: jest.fn().mockResolvedValue(false)
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer test-token')
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Current password is incorrect');
    });
  });

  describe('DELETE /api/auth/me', () => {
    test('should deactivate account successfully', async () => {
      User.findByIdAndUpdate.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        isActive: false
      });

      const response = await request(app)
        .delete('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account deactivated successfully');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { isActive: false }
      );
    });

    test('should return 401 without token', async () => {
      const response = await request(app).delete('/api/auth/me');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).post('/api/auth/logout');
      expect(response.status).toBe(401);
    });
  });
});
