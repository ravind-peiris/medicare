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
  validateBill: jest.fn((req, res, next) => next()),
  validateObjectId: jest.fn(() => (req, res, next) => next()),
  validatePagination: jest.fn((req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/Bill.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn()
}));

jest.mock('../src/models/Patient.js', () => ({
  findOne: jest.fn(),
  findById: jest.fn()
}));

jest.mock('../src/models/Appointment.js', () => ({
  findById: jest.fn()
}));

// Import after mocks
import billsRouter from '../src/routes/bills.js';
import Bill from '../src/models/Bill.js';
import Patient from '../src/models/Patient.js';
import Appointment from '../src/models/Appointment.js';

const app = express();
app.use(express.json());
app.use('/api/bills', billsRouter);

describe('Bills Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bills', () => {
    test('should get bills for patient', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789'
      };

      const mockBills = [{
        _id: '507f1f77bcf86cd799439011',
        patient: mockPatient._id,
        totalAmount: 5000,
        status: 'Pending',
        toObject: () => ({
          _id: '507f1f77bcf86cd799439011',
          patient: mockPatient,
          totalAmount: 5000,
          status: 'Pending'
        })
      }];

      Patient.findOne.mockResolvedValue(mockPatient);
      Bill.find.mockResolvedValue(mockBills);
      Bill.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/bills')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.bills).toHaveLength(1);
      expect(Patient.findOne).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
      expect(Bill.find).toHaveBeenCalled();
    });

    test('should filter bills by status', async () => {
      const mockBills = [{
        _id: '507f1f77bcf86cd799439011',
        status: 'Paid',
        toObject: () => ({ _id: '507f1f77bcf86cd799439011', status: 'Paid' })
      }];

      Bill.find.mockResolvedValue(mockBills);

      const response = await request(app)
        .get('/api/bills?status=Paid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Bill.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Paid' })
      );
    });

    test('should filter bills by date range', async () => {
      const mockBills = [{
        _id: '507f1f77bcf86cd799439011',
        createdAt: new Date('2024-01-15'),
        toObject: () => ({ _id: '507f1f77bcf86cd799439011' })
      }];

      Bill.find.mockResolvedValue(mockBills);

      const response = await request(app)
        .get('/api/bills?dateFrom=2024-01-01&dateTo=2024-01-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Bill.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-01-31')
          }
        })
      );
    });

    test('should return 404 for patient not found', async () => {
      Patient.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/bills')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient profile not found');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/bills');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/bills/:id', () => {
    test('should get bill by ID for patient', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789'
      };

      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        patient: mockPatient._id,
        totalAmount: 5000,
        status: 'Pending'
      };

      Patient.findOne.mockResolvedValue(mockPatient);
      Bill.findById.mockResolvedValue(mockBill);

      const response = await request(app)
        .get('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Bill.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 404 for non-existent bill', async () => {
      Bill.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Bill not found');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        patient: '507f1f77bcf86cd799439013' // Different patient
      };

      Patient.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012' // Current user patient
      });
      Bill.findById.mockResolvedValue(mockBill);

      const response = await request(app)
        .get('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('POST /api/bills', () => {
    test('should create bill successfully', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012',
        cardNumber: 'HC123456789'
      };

      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        patient: mockPatient._id,
        totalAmount: 5000,
        status: 'Pending',
        billNumber: 'BILL00000001'
      };

      Patient.findById.mockResolvedValue(mockPatient);
      Bill.create.mockResolvedValue(mockBill);

      const billData = {
        patientId: '507f1f77bcf86cd799439012',
        consultantFee: 3000,
        hospitalFee: 2000,
        doctorName: 'Dr. Smith',
        hospitalName: 'Test Hospital',
        totalAmount: 5000,
        description: 'Consultation and tests'
      };

      const response = await request(app)
        .post('/api/bills')
        .set('Authorization', 'Bearer test-token')
        .send(billData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(Bill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patient: '507f1f77bcf86cd799439012',
          totalAmount: 5000,
          createdBy: '507f1f77bcf86cd799439011'
        })
      );
    });

    test('should return 404 for non-existent patient', async () => {
      Patient.findById.mockResolvedValue(null);

      const billData = {
        patientId: '507f1f77bcf86cd799439012',
        consultantFee: 3000,
        hospitalFee: 2000,
        totalAmount: 5000,
        description: 'Test bill'
      };

      const response = await request(app)
        .post('/api/bills')
        .set('Authorization', 'Bearer test-token')
        .send(billData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    test('should return 404 for non-existent appointment', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012'
      };

      Patient.findById.mockResolvedValue(mockPatient);
      Appointment.findById.mockResolvedValue(null);

      const billData = {
        patientId: '507f1f77bcf86cd799439012',
        appointmentId: '507f1f77bcf86cd799439013',
        consultantFee: 3000,
        hospitalFee: 2000,
        totalAmount: 5000,
        description: 'Test bill'
      };

      const response = await request(app)
        .post('/api/bills')
        .set('Authorization', 'Bearer test-token')
        .send(billData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Appointment not found');
    });
  });

  describe('PUT /api/bills/:id', () => {
    test('should update bill successfully', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Pending'
      };

      const updatedBill = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Paid',
        paidDate: new Date(),
        paidBy: '507f1f77bcf86cd799439011'
      };

      Bill.findById.mockResolvedValue(mockBill);
      Bill.findByIdAndUpdate.mockResolvedValue(updatedBill);

      const response = await request(app)
        .put('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'Paid' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Bill.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          status: 'Paid',
          paidDate: expect.any(Date),
          paidBy: '507f1f77bcf86cd799439011'
        }),
        { new: true, runValidators: true }
      );
    });

    test('should return 404 for non-existent bill', async () => {
      Bill.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'Paid' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Bill not found');
    });
  });

  describe('GET /api/bills/bill-number/:billNumber', () => {
    test('should get bill by bill number', async () => {
      const mockPatient = {
        _id: '507f1f77bcf86cd799439012'
      };

      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        billNumber: 'BILL00000001',
        patient: mockPatient._id
      };

      Patient.findOne.mockResolvedValue(mockPatient);
      Bill.findOne.mockResolvedValue(mockBill);

      const response = await request(app)
        .get('/api/bills/bill-number/BILL00000001')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Bill.findOne).toHaveBeenCalledWith({
        billNumber: 'BILL00000001'
      });
    });

    test('should return 404 for non-existent bill number', async () => {
      Bill.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/bills/bill-number/BILL00000001')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Bill not found');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        patient: '507f1f77bcf86cd799439013' // Different patient
      };

      Patient.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012' // Current user patient
      });
      Bill.findOne.mockResolvedValue(mockBill);

      const response = await request(app)
        .get('/api/bills/bill-number/BILL00000001')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('GET /api/bills/overdue', () => {
    test('should get overdue bills', async () => {
      const mockBills = [{
        _id: '507f1f77bcf86cd799439011',
        status: 'Pending',
        dueDate: new Date('2024-01-01'), // Past date
        toObject: () => ({
          _id: '507f1f77bcf86cd799439011',
          status: 'Pending',
          dueDate: new Date('2024-01-01')
        })
      }];

      Bill.find.mockResolvedValue(mockBills);
      Bill.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/bills/overdue')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.bills).toHaveLength(1);
      expect(Bill.find).toHaveBeenCalledWith({
        status: { $in: ['Pending', 'Overdue'] },
        dueDate: { $lt: expect.any(Date) }
      });
    });

    test('should return 401 for non-manager user', async () => {
      // Mock restrictTo to return 401 for non-manager
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/bills/overdue')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/bills/:id/mark-paid', () => {
    test('should mark bill as paid', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Pending',
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          status: 'Paid',
          paidDate: new Date(),
          paymentMethod: 'Cash',
          paidBy: '507f1f77bcf86cd799439011'
        })
      };

      Bill.findById.mockResolvedValue(mockBill);

      const response = await request(app)
        .put('/api/bills/507f1f77bcf86cd799439011/mark-paid')
        .set('Authorization', 'Bearer test-token')
        .send({ paymentMethod: 'Cash' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bill marked as paid successfully');
      expect(mockBill.save).toHaveBeenCalled();
    });

    test('should return 400 for already paid bill', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Paid'
      };

      Bill.findById.mockResolvedValue(mockBill);

      const response = await request(app)
        .put('/api/bills/507f1f77bcf86cd799439011/mark-paid')
        .set('Authorization', 'Bearer test-token')
        .send({ paymentMethod: 'Cash' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Bill is already paid');
    });

    test('should return 404 for non-existent bill', async () => {
      Bill.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/bills/507f1f77bcf86cd799439011/mark-paid')
        .set('Authorization', 'Bearer test-token')
        .send({ paymentMethod: 'Cash' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Bill not found');
    });
  });

  describe('DELETE /api/bills/:id', () => {
    test('should delete bill successfully', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Pending'
      };

      Bill.findById.mockResolvedValue(mockBill);
      Bill.findByIdAndDelete.mockResolvedValue(mockBill);

      const response = await request(app)
        .delete('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bill deleted successfully');
      expect(Bill.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 400 for paid bill', async () => {
      const mockBill = {
        _id: '507f1f77bcf86cd799439011',
        status: 'Paid'
      };

      Bill.findById.mockResolvedValue(mockBill);

      const response = await request(app)
        .delete('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot delete paid bill');
    });

    test('should return 404 for non-existent bill', async () => {
      Bill.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Bill not found');
    });

    test('should return 401 for non-manager user', async () => {
      // Mock restrictTo to return 401 for non-manager
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .delete('/api/bills/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });
  });
});
