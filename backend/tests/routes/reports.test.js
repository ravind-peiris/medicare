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
jest.mock('../src/models/Report.js', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn()
}));

// Import after mocks
import reportsRouter from '../src/routes/reports.js';
import Report from '../src/models/Report.js';

const app = express();
app.use(express.json());
app.use('/api/reports', reportsRouter);

describe('Reports Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/reports/generate', () => {
    test('should generate report successfully', async () => {
      const mockReport = {
        _id: '507f1f77bcf86cd799439014',
        reportType: 'patient-summary',
        filters: {
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31'
        },
        generatedBy: '507f1f77bcf86cd799439011',
        status: 'Generated',
        createdAt: new Date()
      };

      Report.create.mockResolvedValue(mockReport);

      const reportData = {
        reportType: 'patient-summary',
        filters: {
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
          department: 'Cardiology'
        }
      };

      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', 'Bearer test-token')
        .send(reportData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.report.reportType).toBe('patient-summary');
      expect(response.body.data.report.status).toBe('Generated');
      expect(Report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'patient-summary',
          filters: reportData.filters,
          generatedBy: '507f1f77bcf86cd799439011',
          status: 'Generated'
        })
      );
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', 'Bearer test-token')
        .send({ reportType: 'test' });

      expect(response.status).toBe(401);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).post('/api/reports/generate');
      expect(response.status).toBe(401);
    });

    test('should handle generation errors', async () => {
      Report.create.mockRejectedValue(new Error('Generation failed'));

      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', 'Bearer test-token')
        .send({ reportType: 'test' });

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Generation failed');
    });
  });

  describe('GET /api/reports', () => {
    test('should get all reports successfully', async () => {
      const mockReports = [
        {
          _id: '507f1f77bcf86cd799439014',
          reportType: 'patient-summary',
          status: 'Generated',
          generatedBy: {
            _id: '507f1f77bcf86cd799439011',
            profile: {
              firstName: 'John',
              lastName: 'Manager'
            }
          },
          createdAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439015',
          reportType: 'revenue-report',
          status: 'Generated',
          generatedBy: {
            _id: '507f1f77bcf86cd799439011',
            profile: {
              firstName: 'John',
              lastName: 'Manager'
            }
          },
          createdAt: new Date(Date.now() - 86400000)
        }
      ];

      Report.find.mockResolvedValue(mockReports);
      Report.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.reports).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.results).toBe(2);
      expect(Report.find).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
    });

    test('should handle pagination correctly', async () => {
      const mockReports = [
        {
          _id: '507f1f77bcf86cd799439014',
          reportType: 'test-report',
          generatedBy: { profile: { firstName: 'John' } },
          createdAt: new Date()
        }
      ];

      Report.find.mockResolvedValue(mockReports);
      Report.countDocuments.mockResolvedValue(15);

      const response = await request(app)
        .get('/api/reports?page=2&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.pages).toBe(2); // 15 total / 10 limit = 2 pages
      expect(Report.find).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          skip: 10, // (2-1) * 10
          limit: 10
        })
      );
    });

    test('should return empty array for no reports', async () => {
      Report.find.mockResolvedValue([]);
      Report.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.reports).toHaveLength(0);
      expect(response.body.total).toBe(0);
      expect(response.body.results).toBe(0);
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/reports');
      expect(response.status).toBe(401);
    });

    test('should handle database errors', async () => {
      Report.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('GET /api/reports/:id', () => {
    test('should get report by ID', async () => {
      const mockReport = {
        _id: '507f1f77bcf86cd799439014',
        reportType: 'patient-summary',
        filters: {
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31'
        },
        status: 'Generated',
        generatedBy: {
          _id: '507f1f77bcf86cd799439011',
          profile: {
            firstName: 'John',
            lastName: 'Manager'
          }
        },
        createdAt: new Date()
      };

      Report.findById.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.report.reportType).toBe('patient-summary');
      expect(response.body.data.report.status).toBe('Generated');
      expect(Report.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
    });

    test('should return 404 for non-existent report', async () => {
      Report.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Report not found');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/reports/507f1f77bcf86cd799439014');
      expect(response.status).toBe(401);
    });

    test('should handle database errors', async () => {
      Report.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('GET /api/reports/:id/download', () => {
    test('should download report successfully', async () => {
      const mockReport = {
        _id: '507f1f77bcf86cd799439014',
        reportType: 'patient-summary',
        status: 'Generated',
        createdAt: new Date()
      };

      Report.findById.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439014/download')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
      expect(response.header['content-disposition']).toBe('attachment; filename="report-507f1f77bcf86cd799439014.pdf"');
      expect(response.text).toBe('Mock PDF content for report 507f1f77bcf86cd799439014');
    });

    test('should return 404 for non-existent report', async () => {
      Report.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439014/download')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Report not found');
    });

    test('should return 401 for non-manager user', async () => {
      const { restrictTo } = require('../src/middleware/auth.js');
      restrictTo.mockImplementation(() => (req, res, next) => {
        res.status(401).json({ message: 'Access denied' });
      });

      const response = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439014/download')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/reports/507f1f77bcf86cd799439014/download');
      expect(response.status).toBe(401);
    });

    test('should handle download errors', async () => {
      Report.findById.mockRejectedValue(new Error('Download failed'));

      const response = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439014/download')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Download failed');
    });
  });
});
