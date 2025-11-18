import { body, validationResult } from 'express-validator';
import { validateAppointment, validateObjectId, validatePagination } from '../../src/middleware/validation.js';

describe('Validation Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('validateAppointment', () => {
    test('should call next() when appointment data is valid', async () => {
      // Arrange
      mockReq.body = {
        patient: '507f1f77bcf86cd799439011',
        doctor: '507f1f77bcf86cd799439012',
        hospital: '507f1f77bcf86cd799439013',
        date: '2024-12-25',
        time: '10:00',
        reason: 'Regular checkup',
        notes: 'Annual health check'
      };

      // Mock validation result
      const mockValidationResult = {
        isEmpty: () => true,
        array: () => []
      };
      jest.spyOn(require('express-validator'), 'validationResult').mockReturnValue(mockValidationResult);

      // Act
      await validateAppointment(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 400 when appointment data is invalid', async () => {
      // Arrange
      mockReq.body = {
        // Missing required fields
        date: '2024-12-25',
        time: '10:00'
      };

      // Mock validation result with errors
      const mockValidationResult = {
        isEmpty: () => false,
        array: () => [
          { msg: 'Patient is required', param: 'patient' },
          { msg: 'Doctor is required', param: 'doctor' },
          { msg: 'Reason is required', param: 'reason' }
        ]
      };
      jest.spyOn(require('express-validator'), 'validationResult').mockReturnValue(mockValidationResult);

      // Act
      await validateAppointment(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation failed',
        errors: mockValidationResult.array()
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should validate date format', async () => {
      // Arrange
      mockReq.body = {
        patient: '507f1f77bcf86cd799439011',
        doctor: '507f1f77bcf86cd799439012',
        date: 'invalid-date',
        time: '10:00',
        reason: 'Regular checkup'
      };

      // Mock validation result with date error
      const mockValidationResult = {
        isEmpty: () => false,
        array: () => [
          { msg: 'Please provide a valid date', param: 'date' }
        ]
      };
      jest.spyOn(require('express-validator'), 'validationResult').mockReturnValue(mockValidationResult);

      // Act
      await validateAppointment(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation failed',
        errors: mockValidationResult.array()
      });
    });

    test('should validate time format', async () => {
      // Arrange
      mockReq.body = {
        patient: '507f1f77bcf86cd799439011',
        doctor: '507f1f77bcf86cd799439012',
        date: '2024-12-25',
        time: '25:00', // Invalid time
        reason: 'Regular checkup'
      };

      // Mock validation result with time error
      const mockValidationResult = {
        isEmpty: () => false,
        array: () => [
          { msg: 'Please provide a valid time in HH:MM format', param: 'time' }
        ]
      };
      jest.spyOn(require('express-validator'), 'validationResult').mockReturnValue(mockValidationResult);

      // Act
      await validateAppointment(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Validation failed',
        errors: mockValidationResult.array()
      });
    });
  });

  describe('validateObjectId', () => {
    test('should call next() when valid ObjectId is provided', () => {
      // Arrange
      const paramName = 'id';
      mockReq.params[paramName] = '507f1f77bcf86cd799439011';

      // Act
      validateObjectId(paramName)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 400 when invalid ObjectId is provided', () => {
      // Arrange
      const paramName = 'id';
      mockReq.params[paramName] = 'invalid-id';

      // Act
      validateObjectId(paramName)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid ID format'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 when ObjectId is missing', () => {
      // Arrange
      const paramName = 'id';
      // No param set

      // Act
      validateObjectId(paramName)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid ID format'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should work with different parameter names', () => {
      // Arrange
      const paramName = 'appointmentId';
      mockReq.params[paramName] = '507f1f77bcf86cd799439011';

      // Act
      validateObjectId(paramName)(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validatePagination', () => {
    test('should call next() when valid pagination parameters are provided', () => {
      // Arrange
      mockReq.query = {
        page: '1',
        limit: '10'
      };

      // Act
      validatePagination(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    test('should set default values when no pagination parameters are provided', () => {
      // Arrange
      mockReq.query = {};

      // Act
      validatePagination(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.query.page).toBe('1');
      expect(mockReq.query.limit).toBe('10');
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 400 when invalid page number is provided', () => {
      // Arrange
      mockReq.query = {
        page: '0', // Invalid page
        limit: '10'
      };

      // Act
      validatePagination(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Page must be a positive integer'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 when invalid limit is provided', () => {
      // Arrange
      mockReq.query = {
        page: '1',
        limit: '0' // Invalid limit
      };

      // Act
      validatePagination(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Limit must be a positive integer between 1 and 100'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 when limit exceeds maximum', () => {
      // Arrange
      mockReq.query = {
        page: '1',
        limit: '101' // Exceeds maximum
      };

      // Act
      validatePagination(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Limit must be a positive integer between 1 and 100'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 when non-numeric values are provided', () => {
      // Arrange
      mockReq.query = {
        page: 'abc',
        limit: 'xyz'
      };

      // Act
      validatePagination(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Page and limit must be valid numbers'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Integration tests', () => {
    test('should work with multiple validation middlewares', async () => {
      // Arrange
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.query = { page: '1', limit: '10' };
      mockReq.body = {
        patient: '507f1f77bcf86cd799439011',
        doctor: '507f1f77bcf86cd799439012',
        date: '2024-12-25',
        time: '10:00',
        reason: 'Regular checkup'
      };

      // Mock validation result
      const mockValidationResult = {
        isEmpty: () => true,
        array: () => []
      };
      jest.spyOn(require('express-validator'), 'validationResult').mockReturnValue(mockValidationResult);

      // Act - Test all validations
      validateObjectId('id')(mockReq, mockRes, mockNext);
      validatePagination(mockReq, mockRes, mockNext);
      await validateAppointment(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });
});
