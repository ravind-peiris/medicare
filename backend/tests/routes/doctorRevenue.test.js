import request from 'supertest';
import express from 'express';

// Mock middleware
jest.mock('../src/middleware/auth.js', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'Doctor',
      id: '507f1f77bcf86cd799439011'
    };
    next();
  }),
  restrictTo: jest.fn(() => (req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/Payment.js', () => ({
  find: jest.fn()
}));

jest.mock('../src/models/Appointment.js', () => ({
  find: jest.fn()
}));

jest.mock('../src/models/Patient.js', () => ({
  findById: jest.fn()
}));

// Import after mocks
import doctorRevenueRouter from '../src/routes/doctorRevenue.js';
import Payment from '../src/models/Payment.js';
import Appointment from '../src/models/Appointment.js';

const app = express();
app.use(express.json());
app.use('/api/payments', doctorRevenueRouter);

describe('Doctor Revenue Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/payments/doctor-revenue', () => {
    test('should get doctor revenue data successfully', async () => {
      const mockPayments = [
        {
          _id: '507f1f77bcf86cd799439014',
          amount: 5000,
          paymentMethod: 'Cash',
          status: 'completed',
          paymentDate: new Date('2024-01-15'),
          appointment: {
            _id: '507f1f77bcf86cd799439011',
            doctor: '507f1f77bcf86cd799439011',
            patient: {
              _id: '507f1f77bcf86cd799439012',
              user: {
                profile: {
                  firstName: 'John',
                  lastName: 'Doe'
                }
              }
            }
          }
        },
        {
          _id: '507f1f77bcf86cd799439015',
          amount: 3000,
          paymentMethod: 'Card',
          status: 'completed',
          paymentDate: new Date(), // Today
          appointment: {
            _id: '507f1f77bcf86cd799439016',
            doctor: '507f1f77bcf86cd799439011',
            patient: {
              _id: '507f1f77bcf86cd799439013',
              user: {
                profile: {
                  firstName: 'Jane',
                  lastName: 'Smith'
                }
              }
            }
          }
        }
      ];

      Payment.find.mockResolvedValue(mockPayments);

      const response = await request(app)
        .get('/api/payments/doctor-revenue')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.revenue.total).toBe(8000);
      expect(response.body.data.revenue.daily).toBe(3000); // Today's payment
      expect(response.body.data.revenue.monthly).toBe(3000); // Current month
      expect(response.body.data.revenue.weekly).toBe(3000); // Current week
      expect(response.body.data.paymentMethods.Cash).toBe(5000);
      expect(response.body.data.paymentMethods.Card).toBe(3000);
      expect(response.body.data.recentTransactions).toHaveLength(2);
      expect(response.body.data.statistics.totalTransactions).toBe(2);
      expect(response.body.data.statistics.averageTransactionValue).toBe(4000);
    });

    test('should handle empty payment data', async () => {
      Payment.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/payments/doctor-revenue')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.revenue.total).toBe(0);
      expect(response.body.data.revenue.daily).toBe(0);
      expect(response.body.data.revenue.monthly).toBe(0);
      expect(response.body.data.revenue.weekly).toBe(0);
      expect(response.body.data.paymentMethods).toEqual({});
      expect(response.body.data.recentTransactions).toHaveLength(0);
      expect(response.body.data.statistics.totalTransactions).toBe(0);
      expect(response.body.data.statistics.averageTransactionValue).toBe(0);
    });

    test('should return 401 for non-doctor user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/payments/doctor-revenue')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should handle database errors', async () => {
      Payment.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/payments/doctor-revenue')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('GET /api/payments/appointment-stats', () => {
    test('should get doctor appointment statistics successfully', async () => {
      const mockAppointments = [
        {
          _id: '507f1f77bcf86cd799439011',
          status: 'Completed',
          appointmentDate: new Date(), // Today
          duration: 30,
          patient: {
            _id: '507f1f77bcf86cd799439012',
            cardNumber: 'HC123456789',
            user: {
              profile: {
                firstName: 'John',
                lastName: 'Doe'
              }
            }
          }
        },
        {
          _id: '507f1f77bcf86cd799439016',
          status: 'Scheduled',
          appointmentDate: new Date(Date.now() + 86400000), // Tomorrow
          duration: 45,
          patient: {
            _id: '507f1f77bcf86cd799439013',
            cardNumber: 'HC987654321',
            user: {
              profile: {
                firstName: 'Jane',
                lastName: 'Smith'
              }
            }
          }
        },
        {
          _id: '507f1f77bcf86cd799439017',
          status: 'Cancelled',
          appointmentDate: new Date(Date.now() - 86400000), // Yesterday
          patient: {
            _id: '507f1f77bcf86cd799439018',
            user: {
              profile: {
                firstName: 'Bob',
                lastName: 'Wilson'
              }
            }
          }
        }
      ];

      Appointment.find.mockResolvedValue(mockAppointments);

      const response = await request(app)
        .get('/api/payments/appointment-stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.today).toBe(1); // Today's appointment
      expect(response.body.data.completed).toBe(1);
      expect(response.body.data.pending).toBe(1); // Scheduled appointment
      expect(response.body.data.cancelled).toBe(1);
      expect(response.body.data.weekly).toBe(3); // All appointments this week
      expect(response.body.data.monthly).toBe(3); // All appointments this month
      expect(response.body.data.statusBreakdown.Completed).toBe(1);
      expect(response.body.data.statusBreakdown.Scheduled).toBe(1);
      expect(response.body.data.statusBreakdown.Cancelled).toBe(1);
      expect(response.body.data.averageDuration).toBe(37.5); // (30 + 45) / 2
      expect(response.body.data.appointments).toHaveLength(3);
    });

    test('should handle appointments without duration', async () => {
      const mockAppointments = [
        {
          _id: '507f1f77bcf86cd799439011',
          status: 'Completed',
          appointmentDate: new Date(),
          // No duration field
          patient: {
            user: { profile: { firstName: 'John' } }
          }
        }
      ];

      Appointment.find.mockResolvedValue(mockAppointments);

      const response = await request(app)
        .get('/api/payments/appointment-stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.averageDuration).toBe(0);
    });

    test('should handle empty appointment data', async () => {
      Appointment.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/payments/appointment-stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.today).toBe(0);
      expect(response.body.data.completed).toBe(0);
      expect(response.body.data.pending).toBe(0);
      expect(response.body.data.cancelled).toBe(0);
      expect(response.body.data.weekly).toBe(0);
      expect(response.body.data.monthly).toBe(0);
      expect(response.body.data.statusBreakdown).toEqual({});
      expect(response.body.data.averageDuration).toBe(0);
      expect(response.body.data.appointments).toHaveLength(0);
    });

    test('should return 401 for non-doctor user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/payments/appointment-stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should handle database errors', async () => {
      Appointment.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/payments/appointment-stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Database error');
    });
  });
});
