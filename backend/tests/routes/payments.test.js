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
  validatePayment: jest.fn((req, res, next) => next()),
  validateObjectId: jest.fn(() => (req, res, next) => next()),
  validatePagination: jest.fn((req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/Payment.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../src/models/Bill.js', () => ({
  findById: jest.fn()
}));

jest.mock('../src/models/Patient.js', () => ({
  findOne: jest.fn(),
  findById: jest.fn()
}));

// Import after mocks
import paymentsRouter from '../src/routes/payments.js';
import Payment from '../src/models/Payment.js';
import Bill from '../src/models/Bill.js';
import Patient from '../src/models/Patient.js';

const app = express();
app.use(express.json());
app.use('/api/payments', paymentsRouter);

describe('Payments Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/payments', () => {
    test('should get payments for patient', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789'
      };

      const mockPayments = [{
        _id: '507f1f77bcf86cd799439014',
        amount: 5000,
        method: 'Cash',
        status: 'Success',
        bill: {
          billNumber: 'BILL00000001',
          totalAmount: 5000
        },
        patient: mockPatient,
        paymentDate: new Date()
      }];

      Patient.findOne.mockResolvedValue(mockPatient);
      Payment.find.mockResolvedValue(mockPayments);
      Payment.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.payments).toHaveLength(1);
      expect(Patient.findOne).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
      expect(Payment.find).toHaveBeenCalled();
    });

    test('should filter payments by status', async () => {
      const mockPayments = [{
        _id: '507f1f77bcf86cd799439014',
        status: 'Pending',
        amount: 3000
      }];

      Payment.find.mockResolvedValue(mockPayments);

      const response = await request(app)
        .get('/api/payments?status=Pending')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Payment.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Pending' })
      );
    });

    test('should filter payments by date range', async () => {
      const mockPayments = [{
        _id: '507f1f77bcf86cd799439014',
        paymentDate: new Date('2024-01-15')
      }];

      Payment.find.mockResolvedValue(mockPayments);

      const response = await request(app)
        .get('/api/payments?dateFrom=2024-01-01&dateTo=2024-01-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Payment.find).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentDate: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-01-31')
          }
        })
      );
    });

    test('should return 404 for patient not found', async () => {
      Patient.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient profile not found');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/payments');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/payments/:id', () => {
    test('should get payment by ID', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012'
      };

      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        amount: 5000,
        method: 'Cash',
        status: 'Success',
        bill: {
          billNumber: 'BILL00000001',
          totalAmount: 5000
        },
        patient: mockPatient
      };

      Patient.findOne.mockResolvedValue(mockPatient);
      Payment.findById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get('/api/payments/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.payment.amount).toBe(5000);
      expect(Payment.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
    });

    test('should return 404 for non-existent payment', async () => {
      Payment.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/payments/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Payment not found');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        patient: '507f1f77bcf86cd799439013' // Different patient
      };

      Patient.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012' // Current user patient
      });
      Payment.findById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get('/api/payments/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('POST /api/payments', () => {
    test('should create payment successfully', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439015',
        patient: '507f1f77bcf86cd799439012',
        totalAmount: 5000,
        status: 'Pending'
      };

      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789'
      };

      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        bill: mockBill._id,
        patient: mockPatient._id,
        amount: 5000,
        method: 'Cash',
        status: 'Processing'
      };

      Bill.findById.mockResolvedValue(mockBill);
      Patient.findOne.mockResolvedValue(mockPatient);
      Patient.findById.mockResolvedValue(mockPatient);
      Payment.create.mockResolvedValue(mockPayment);

      const paymentData = {
        bill: '507f1f77bcf86cd799439015',
        amount: 5000,
        method: 'Cash',
        notes: 'Full payment'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer test-token')
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(Payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bill: '507f1f77bcf86cd799439015',
          amount: 5000,
          method: 'Cash',
          processedBy: '507f1f77bcf86cd799439011'
        })
      );
    });

    test('should return 404 for non-existent bill', async () => {
      Bill.findById.mockResolvedValue(null);

      const paymentData = {
        bill: '507f1f77bcf86cd799439015',
        amount: 5000,
        method: 'Cash'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer test-token')
        .send(paymentData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Bill not found');
    });

    test('should return 403 for unauthorized payment', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439015',
        patient: '507f1f77bcf86cd799439013' // Different patient
      };

      Bill.findById.mockResolvedValue(mockBill);
      Patient.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012' // Current user patient
      });

      const paymentData = {
        bill: '507f1f77bcf86cd799439015',
        amount: 5000,
        method: 'Cash'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer test-token')
        .send(paymentData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You can only pay for your own bills');
    });

    test('should return 400 for already paid bill', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439015',
        patient: '507f1f77bcf86cd799439012',
        status: 'Paid'
      };

      Bill.findById.mockResolvedValue(mockBill);

      const paymentData = {
        bill: '507f1f77bcf86cd799439015',
        amount: 5000,
        method: 'Cash'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer test-token')
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Bill is already paid');
    });

    test('should return 400 for excessive payment amount', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439015',
        patient: '507f1f77bcf86cd799439012',
        totalAmount: 5000,
        status: 'Pending'
      };

      Bill.findById.mockResolvedValue(mockBill);

      const paymentData = {
        bill: '507f1f77bcf86cd799439015',
        amount: 6000, // More than bill total
        method: 'Cash'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', 'Bearer test-token')
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Payment amount cannot exceed bill total');
    });
  });

  describe('PUT /api/payments/:id/status', () => {
    test('should update payment status successfully', async () => {
      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        status: 'Processing',
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439014',
          status: 'Success',
          processedDate: new Date()
        })
      };

      Payment.findById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439014/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'Success' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Payment status updated successfully');
      expect(mockPayment.save).toHaveBeenCalled();
    });

    test('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439014/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'InvalidStatus' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid payment status');
    });

    test('should return 404 for non-existent payment', async () => {
      Payment.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439014/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'Success' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Payment not found');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .put('/api/payments/507f1f77bcf86cd799439014/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'Success' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/payments/:id/refund', () => {
    test('should process refund successfully', async () => {
      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        amount: 5000,
        status: 'Success',
        method: 'Cash',
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439014',
          status: 'Refunded',
          refundDetails: {
            refundAmount: 5000,
            refundDate: new Date(),
            refundReason: 'Customer request',
            refundMethod: 'Cash'
          }
        })
      };

      Payment.findById.mockResolvedValue(mockPayment);

      const refundData = {
        refundAmount: 5000,
        refundReason: 'Customer request',
        refundMethod: 'Cash'
      };

      const response = await request(app)
        .post('/api/payments/507f1f77bcf86cd799439014/refund')
        .set('Authorization', 'Bearer test-token')
        .send(refundData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Refund processed successfully');
      expect(mockPayment.save).toHaveBeenCalled();
    });

    test('should return 400 for non-successful payment', async () => {
      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        status: 'Failed'
      };

      Payment.findById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/api/payments/507f1f77bcf86cd799439014/refund')
        .set('Authorization', 'Bearer test-token')
        .send({ refundReason: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Can only refund successful payments');
    });

    test('should return 400 for excessive refund amount', async () => {
      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        amount: 5000,
        status: 'Success'
      };

      Payment.findById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/api/payments/507f1f77bcf86cd799439014/refund')
        .set('Authorization', 'Bearer test-token')
        .send({ refundAmount: 6000 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Refund amount cannot exceed payment amount');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .post('/api/payments/507f1f77bcf86cd799439014/refund')
        .set('Authorization', 'Bearer test-token')
        .send({ refundReason: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/payments/reference/:referenceNumber', () => {
    test('should get payment by reference number', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012'
      };

      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        referenceNumber: 'PAY123456789',
        amount: 5000,
        patient: mockPatient._id
      };

      Patient.findOne.mockResolvedValue(mockPatient);
      Payment.findOne.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get('/api/payments/reference/PAY123456789')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.payment.referenceNumber).toBe('PAY123456789');
      expect(Payment.findOne).toHaveBeenCalledWith({
        referenceNumber: 'PAY123456789'
      });
    });

    test('should return 404 for non-existent reference', async () => {
      Payment.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/payments/reference/PAY123456789')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Payment not found');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockPayment = {
        _id: '507f1f77bcf86cd799439014',
        patient: '507f1f77bcf86cd799439013' // Different patient
      };

      Patient.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012' // Current user patient
      });
      Payment.findOne.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get('/api/payments/reference/PAY123456789')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('GET /api/payments/statistics', () => {
    test('should get payment statistics', async () => {
      const mockStats = [{
        _id: null,
        totalAmount: 50000,
        totalCount: 10,
        averageAmount: 5000
      }];

      const mockMethodStats = [
        { _id: 'Cash', count: 5, totalAmount: 25000 },
        { _id: 'Card', count: 5, totalAmount: 25000 }
      ];

      const mockDailyStats = [
        {
          _id: { year: 2024, month: 1, day: 15 },
          count: 2,
          totalAmount: 10000
        }
      ];

      Payment.aggregate
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockMethodStats)
        .mockResolvedValueOnce(mockDailyStats);

      const response = await request(app)
        .get('/api/payments/statistics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.overview.totalAmount).toBe(50000);
      expect(response.body.data.methodBreakdown).toHaveLength(2);
      expect(response.body.data.dailyStats).toHaveLength(1);
    });

    test('should filter statistics by date range', async () => {
      Payment.aggregate.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/payments/statistics?dateFrom=2024-01-01&dateTo=2024-01-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Payment.aggregate).toHaveBeenCalledWith([
        { $match: {
          paymentDate: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-01-31')
          },
          status: 'Success'
        }},
        expect.any(Object)
      ]);
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/payments/statistics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });
});
