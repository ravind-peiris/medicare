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

// Mock models
jest.mock('../src/models/Appointment.js', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../src/models/Patient.js', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../src/models/Doctor.js', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../src/models/Bill.js', () => ({
  countDocuments: jest.fn()
}));

jest.mock('../src/models/Payment.js', () => ({
  aggregate: jest.fn()
}));

// Import after mocks
import dashboardRouter from '../src/routes/dashboard.js';
import Appointment from '../src/models/Appointment.js';
import Patient from '../src/models/Patient.js';
import Doctor from '../src/models/Doctor.js';
import Bill from '../src/models/Bill.js';
import Payment from '../src/models/Payment.js';

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRouter);

describe('Dashboard Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/stats', () => {
    test('should get dashboard statistics successfully', async () => {
      // Mock all the countDocuments and aggregate calls
      Appointment.countDocuments
        .mockResolvedValueOnce(100) // totalAppointments
        .mockResolvedValueOnce(50); // completedAppointments

      Patient.countDocuments
        .mockResolvedValueOnce(200) // totalPatients
        .mockResolvedValueOnce(25); // newPatientsThisMonth

      Doctor.countDocuments.mockResolvedValue(30); // totalDoctors
      Bill.countDocuments.mockResolvedValue(150); // totalBills

      Payment.aggregate.mockResolvedValue([
        { _id: null, total: 500000 } // totalRevenue
      ]);

      Patient.countDocuments.mockResolvedValue(20); // lastMonthPatients

      Appointment.countDocuments.mockResolvedValue(40); // pendingAppointments

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.totalAppointments).toBe(100);
      expect(response.body.data.totalPatients).toBe(200);
      expect(response.body.data.totalDoctors).toBe(30);
      expect(response.body.data.totalBills).toBe(150);
      expect(response.body.data.totalEarnings).toBe(500000);
      expect(response.body.data.newPatients).toBe(25);
      expect(response.body.data.completedAppointments).toBe(50);
      expect(response.body.data.pendingAppointments).toBe(40);
    });

    test('should handle zero values correctly', async () => {
      // Mock all counts to return 0
      Appointment.countDocuments.mockResolvedValue(0);
      Patient.countDocuments.mockResolvedValue(0);
      Doctor.countDocuments.mockResolvedValue(0);
      Bill.countDocuments.mockResolvedValue(0);
      Payment.aggregate.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.totalEarnings).toBe(0);
      expect(response.body.data.monthlyGrowth).toBe(0);
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should handle database errors', async () => {
      Appointment.countDocuments.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('GET /api/dashboard/analytics', () => {
    test('should get dashboard analytics successfully', async () => {
      const mockAppointmentTrends = [
        { _id: { year: 2024, month: 1 }, count: 50 },
        { _id: { year: 2024, month: 2 }, count: 75 }
      ];

      const mockPatientTrends = [
        { _id: { year: 2024, month: 1 }, count: 20 },
        { _id: { year: 2024, month: 2 }, count: 30 }
      ];

      const mockRevenueTrends = [
        { _id: { year: 2024, month: 1 }, total: 100000 },
        { _id: { year: 2024, month: 2 }, total: 150000 }
      ];

      const mockDepartmentStats = [
        { _id: 'Cardiology', doctorCount: 5, avgConsultationFee: 5000 },
        { _id: 'Emergency', doctorCount: 8, avgConsultationFee: 3000 }
      ];

      const mockAppointmentStatusDistribution = [
        { _id: 'Scheduled', count: 40 },
        { _id: 'Confirmed', count: 30 },
        { _id: 'Completed', count: 25 }
      ];

      const mockPaymentMethodDistribution = [
        { _id: 'Cash', count: 50, totalAmount: 250000 },
        { _id: 'Card', count: 30, totalAmount: 150000 }
      ];

      Appointment.aggregate
        .mockResolvedValueOnce(mockAppointmentTrends)
        .mockResolvedValueOnce(mockAppointmentStatusDistribution);

      Patient.aggregate.mockResolvedValue(mockPatientTrends);
      Payment.aggregate
        .mockResolvedValueOnce(mockRevenueTrends)
        .mockResolvedValueOnce(mockPaymentMethodDistribution);

      Doctor.aggregate.mockResolvedValue(mockDepartmentStats);

      const response = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.appointmentTrends).toHaveLength(2);
      expect(response.body.data.patientTrends).toHaveLength(2);
      expect(response.body.data.revenueTrends).toHaveLength(2);
      expect(response.body.data.departmentStats).toHaveLength(2);
      expect(response.body.data.appointmentStatusDistribution).toHaveLength(3);
      expect(response.body.data.paymentMethodDistribution).toHaveLength(2);
    });

    test('should filter analytics by date range', async () => {
      Appointment.aggregate.mockResolvedValue([]);
      Patient.aggregate.mockResolvedValue([]);
      Payment.aggregate.mockResolvedValue([]);
      Doctor.aggregate.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/analytics?dateFrom=2024-01-01&dateTo=2024-01-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Appointment.aggregate).toHaveBeenCalledWith([
        { $match: {
          createdAt: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-01-31')
          }
        }},
        expect.any(Object)
      ]);
    });

    test('should handle empty analytics data', async () => {
      Appointment.aggregate.mockResolvedValue([]);
      Patient.aggregate.mockResolvedValue([]);
      Payment.aggregate.mockResolvedValue([]);
      Doctor.aggregate.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.appointmentTrends).toHaveLength(0);
      expect(response.body.data.patientTrends).toHaveLength(0);
      expect(response.body.data.revenueTrends).toHaveLength(0);
      expect(response.body.data.departmentStats).toHaveLength(0);
      expect(response.body.data.appointmentStatusDistribution).toHaveLength(0);
      expect(response.body.data.paymentMethodDistribution).toHaveLength(0);
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should handle analytics errors', async () => {
      Appointment.aggregate.mockRejectedValue(new Error('Analytics error'));

      const response = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Analytics error');
    });
  });
});
