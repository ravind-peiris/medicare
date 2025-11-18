import jwt from 'jsonwebtoken';
import { protect, restrictTo } from '../../src/middleware/auth.js';
import User from '../../src/models/User.js';

// Mock the User model
jest.mock('../../src/models/User.js');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    test('should call next() when valid token is provided', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'Patient'
      };
      
      const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET || 'test-secret');
      mockReq.headers.authorization = `Bearer ${token}`;
      
      User.findById = jest.fn().mockResolvedValue(mockUser);

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(mockUser);
    });

    test('should return 401 when no token is provided', async () => {
      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when invalid token is provided', async () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer invalid-token';

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access denied. Invalid token.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not found', async () => {
      // Arrange
      const token = jwt.sign({ id: 'nonexistent' }, process.env.JWT_SECRET || 'test-secret');
      mockReq.headers.authorization = `Bearer ${token}`;
      
      User.findById = jest.fn().mockResolvedValue(null);

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access denied. User not found.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when token is expired', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { id: 'user123' }, 
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired token
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access denied. Token expired.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('restrictTo middleware', () => {
    test('should call next() when user has required role', () => {
      // Arrange
      mockReq.user = { role: 'Doctor' };
      const requiredRoles = ['Doctor', 'Healthcare Manager'];

      // Act
      restrictTo(...requiredRoles)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 403 when user does not have required role', () => {
      // Arrange
      mockReq.user = { role: 'Patient' };
      const requiredRoles = ['Doctor', 'Healthcare Manager'];

      // Act
      restrictTo(...requiredRoles)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access denied. You do not have permission to perform this action.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not authenticated', () => {
      // Arrange
      mockReq.user = null;
      const requiredRoles = ['Doctor'];

      // Act
      restrictTo(...requiredRoles)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access denied. Please log in.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should work with single role', () => {
      // Arrange
      mockReq.user = { role: 'Healthcare Manager' };
      const requiredRoles = ['Healthcare Manager'];

      // Act
      restrictTo(...requiredRoles)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    test('should work with multiple roles', () => {
      // Arrange
      mockReq.user = { role: 'Doctor' };
      const requiredRoles = ['Doctor', 'Healthcare Manager', 'Admin'];

      // Act
      restrictTo(...requiredRoles)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Integration tests', () => {
    test('should work with protect and restrictTo together', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'doctor@example.com',
        role: 'Doctor'
      };
      
      const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET || 'test-secret');
      mockReq.headers.authorization = `Bearer ${token}`;
      
      User.findById = jest.fn().mockResolvedValue(mockUser);

      // Act - First protect middleware
      await protect(mockReq, mockRes, mockNext);
      
      // Reset mocks for restrictTo
      mockNext.mockClear();
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      // Then restrictTo middleware
      restrictTo('Doctor')(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(2); // Once for protect, once for restrictTo
    });
  });
});
