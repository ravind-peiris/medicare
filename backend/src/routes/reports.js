import express from 'express';
import Report from '../models/Report.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// @desc    Generate new report
// @route   POST /api/reports/generate
// @access  Private (Healthcare Manager)
router.post('/generate', protect, restrictTo('Healthcare Manager'), async (req, res) => {
  try {
    const { reportType, filters } = req.body;

    // Create report record
    const report = await Report.create({
      reportType,
      filters,
      generatedBy: req.user._id,
      status: 'Generated'
    });

    res.status(201).json({
      status: 'success',
      data: {
        report
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private (Healthcare Manager)
router.get('/', protect, restrictTo('Healthcare Manager'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find()
      .populate('generatedBy', 'profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments();

    res.status(200).json({
      status: 'success',
      results: reports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        reports
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get report by ID
// @route   GET /api/reports/:id
// @access  Private (Healthcare Manager)
router.get('/:id', protect, restrictTo('Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'profile');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        report
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Download report
// @route   GET /api/reports/:id/download
// @access  Private (Healthcare Manager)
router.get('/:id/download', protect, restrictTo('Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // In a real implementation, generate and return the actual PDF
    // For now, return a mock response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${report._id}.pdf"`);
    
    // Mock PDF content
    res.send('Mock PDF content for report ' + report._id);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;