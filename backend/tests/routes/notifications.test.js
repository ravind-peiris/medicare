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
  })
}));

jest.mock('../src/middleware/validation.js', () => ({
  validateObjectId: jest.fn(() => (req, res, next) => next()),
  validatePagination: jest.fn((req, res, next) => next())
}));

// Mock models
jest.mock('../src/models/Notification.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn()
}));

// Import after mocks
import notificationsRouter from '../src/routes/notifications.js';
import Notification from '../src/models/Notification.js';

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationsRouter);

describe('Notifications Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    test('should get all notifications for user', async () => {
      const mockNotifications = [
        {
          _id: '507f1f77bcf86cd799439014',
          user: '507f1f77bcf86cd799439011',
          title: 'Appointment Reminder',
          message: 'You have an appointment tomorrow',
          type: 'appointment',
          isRead: false,
          createdAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439015',
          user: '507f1f77bcf86cd799439011',
          title: 'Payment Received',
          message: 'Your payment has been processed',
          type: 'payment',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000)
        }
      ];

      Notification.find.mockResolvedValue(mockNotifications);
      Notification.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.results).toBe(2);
      expect(Notification.find).toHaveBeenCalledWith(
        { user: '507f1f77bcf86cd799439011' },
        expect.any(Object)
      );
    });

    test('should handle pagination correctly', async () => {
      const mockNotifications = [
        {
          _id: '507f1f77bcf86cd799439014',
          user: '507f1f77bcf86cd799439011',
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
          isRead: false,
          createdAt: new Date()
        }
      ];

      Notification.find.mockResolvedValue(mockNotifications);
      Notification.countDocuments.mockResolvedValue(15);

      const response = await request(app)
        .get('/api/notifications?page=2&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.pages).toBe(2); // 15 total / 10 limit = 2 pages
      expect(Notification.find).toHaveBeenCalledWith(
        { user: '507f1f77bcf86cd799439011' },
        expect.objectContaining({
          skip: 10, // (2-1) * 10
          limit: 10
        })
      );
    });

    test('should return empty array for no notifications', async () => {
      Notification.find.mockResolvedValue([]);
      Notification.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.notifications).toHaveLength(0);
      expect(response.body.total).toBe(0);
      expect(response.body.results).toBe(0);
    });

    test('should return 401 without token', async () => {
      const response = await request(app).get('/api/notifications');
      expect(response.status).toBe(401);
    });

    test('should handle database errors', async () => {
      Notification.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    test('should mark notification as read', async () => {
      const mockNotification = {
        _id: '507f1f77bcf86cd799439014',
        user: '507f1f77bcf86cd799439011',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439014',
          isRead: true,
          readAt: new Date()
        })
      };

      Notification.findById.mockResolvedValue(mockNotification);

      const response = await request(app)
        .put('/api/notifications/507f1f77bcf86cd799439014/read')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Notification marked as read');
      expect(mockNotification.save).toHaveBeenCalled();
      expect(Notification.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
    });

    test('should return 404 for non-existent notification', async () => {
      Notification.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/notifications/507f1f77bcf86cd799439014/read')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Notification not found');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockNotification = {
        _id: '507f1f77bcf86cd799439014',
        user: '507f1f77bcf86cd799439013' // Different user
      };

      Notification.findById.mockResolvedValue(mockNotification);

      const response = await request(app)
        .put('/api/notifications/507f1f77bcf86cd799439014/read')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).put('/api/notifications/507f1f77bcf86cd799439014/read');
      expect(response.status).toBe(401);
    });

    test('should handle save errors', async () => {
      const mockNotification = {
        _id: '507f1f77bcf86cd799439014',
        user: '507f1f77bcf86cd799439011',
        isRead: false,
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      Notification.findById.mockResolvedValue(mockNotification);

      const response = await request(app)
        .put('/api/notifications/507f1f77bcf86cd799439014/read')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Save failed');
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    test('should mark all notifications as read', async () => {
      Notification.updateMany.mockResolvedValue({
        modifiedCount: 5
      });

      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('All notifications marked as read');
      expect(Notification.updateMany).toHaveBeenCalledWith(
        { user: '507f1f77bcf86cd799439011', isRead: false },
        { isRead: true, readAt: new Date() }
      );
    });

    test('should handle update many errors', async () => {
      Notification.updateMany.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Update failed');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).put('/api/notifications/mark-all-read');
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    test('should delete notification successfully', async () => {
      const mockNotification = {
        _id: '507f1f77bcf86cd799439014',
        user: '507f1f77bcf86cd799439011',
        title: 'Test Notification',
        message: 'Test message'
      };

      Notification.findById.mockResolvedValue(mockNotification);
      Notification.findByIdAndDelete.mockResolvedValue(mockNotification);

      const response = await request(app)
        .delete('/api/notifications/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Notification deleted successfully');
      expect(Notification.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
    });

    test('should return 404 for non-existent notification', async () => {
      Notification.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/notifications/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Notification not found');
    });

    test('should return 403 for unauthorized access', async () => {
      const mockNotification = {
        _id: '507f1f77bcf86cd799439014',
        user: '507f1f77bcf86cd799439013' // Different user
      };

      Notification.findById.mockResolvedValue(mockNotification);

      const response = await request(app)
        .delete('/api/notifications/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    test('should return 401 without token', async () => {
      const response = await request(app).delete('/api/notifications/507f1f77bcf86cd799439014');
      expect(response.status).toBe(401);
    });

    test('should handle deletion errors', async () => {
      const mockNotification = {
        _id: '507f1f77bcf86cd799439014',
        user: '507f1f77bcf86cd799439011'
      };

      Notification.findById.mockResolvedValue(mockNotification);
      Notification.findByIdAndDelete.mockRejectedValue(new Error('Deletion failed'));

      const response = await request(app)
        .delete('/api/notifications/507f1f77bcf86cd799439014')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Deletion failed');
    });
  });
});
