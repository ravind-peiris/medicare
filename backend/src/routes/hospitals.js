import express from 'express';
import Hospital from '../models/Hospital.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { type, city } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (type) {
      filter.type = type;
    }
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }

    const hospitals = await Hospital.find(filter)
      .populate('doctors', 'specialization department user')
      .sort({ 'rating.average': -1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Hospital.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: hospitals.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        hospitals
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get hospital by ID
// @route   GET /api/hospitals/:id
// @access  Public
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
      .populate({
        path: 'doctors',
        populate: {
          path: 'user',
          select: 'profile'
        }
      });

    if (!hospital || !hospital.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        hospital
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private (Manager)
router.post('/', protect, restrictTo('Healthcare Manager'), async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        hospital
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private (Manager)
router.put('/:id', protect, restrictTo('Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        hospital
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Delete hospital (soft delete)
// @route   DELETE /api/hospitals/:id
// @access  Private (Manager)
router.delete('/:id', protect, restrictTo('Healthcare Manager'), validateObjectId('id'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
