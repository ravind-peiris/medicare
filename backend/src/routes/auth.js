import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { protect } from '../middleware/auth.js';
import { validateUserRegistration, validateUserLogin, validateUserUpdate } from '../middleware/validation.js';

const router = express.Router();

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// @desc    Debug registration data
// @route   POST /api/auth/debug-register
// @access  Public
router.post('/debug-register', async (req, res) => {
  try {
    console.log('Debug registration request body:', JSON.stringify(req.body, null, 2));
    res.status(200).json({
      status: 'success',
      message: 'Debug data received',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    console.log('Registration request received:', JSON.stringify(req.body, null, 2));

    const {
      username,
      email,
      password,
      role,
      profile,
      doctorInfo,
      patientInfo,
      managerInfo,
      receptionistInfo
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or username already exists'
      });
    }

    // Create user
    const userData = {
      username,
      email,
      password,
      role,
      profile
    };

    // Add role-specific information
    if (role === 'Doctor' && doctorInfo) {
      userData.doctorInfo = doctorInfo;
    }

    if (role === 'Patient' && patientInfo) {
      userData.patientInfo = patientInfo;
    }

    if (role === 'Healthcare Manager' && managerInfo) {
      userData.managerInfo = managerInfo;
    }

    if (role === 'Receptionist' && receptionistInfo) {
      userData.receptionistInfo = receptionistInfo;
    }

    const user = await User.create(userData);

    // Create role-specific profile
    if (role === 'Patient') {
      // Generate card number if not provided
      const cardNumber = patientInfo?.cardNumber || `HC${Date.now().toString().slice(-9)}`;
      
      await Patient.create({
        user: user._id,
        cardNumber,
        bloodType: patientInfo?.bloodType || 'O+',
        allergies: patientInfo?.allergies || [],
        insurance: patientInfo?.insurance || {
          provider: 'Default Provider',
          policyNumber: 'DEFAULT123',
          coverageType: 'Basic',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        },
        emergencyContacts: [{
          name: 'Emergency Contact',
          relationship: 'Family',
          phone: user.profile.emergencyContact,
          email: user.email
        }]
      });
    }

    if (role === 'Doctor') {
      // Generate license number if not provided
      const licenseNumber = doctorInfo?.licenseNumber || `DR${Date.now().toString().slice(-6)}`;
      
      // Parse qualifications and languages into arrays
      const parsedQualifications = doctorInfo?.qualifications 
        ? doctorInfo.qualifications.split(',').map((q) => q.trim()).filter(Boolean)
        : [];
      const parsedLanguages = doctorInfo?.languages 
        ? doctorInfo.languages.split(',').map((l) => l.trim()).filter(Boolean)
        : ['English'];
      
      await Doctor.create({
        user: user._id,
        specialization: doctorInfo?.specialization || 'General Medicine',
        department: doctorInfo?.department || 'General',
        licenseNumber,
        experience: parseInt(doctorInfo?.experience) || 0,
        consultationFee: parseFloat(doctorInfo?.consultationFee) || 1000,
        availability: doctorInfo?.availability || [],
        bio: doctorInfo?.bio || '',
        languages: parsedLanguages,
        qualifications: parsedQualifications
      });
    }

    // Note: Healthcare Manager and Receptionist don't have specific models yet
    // Their role-specific data is stored in the user document
    console.log(`User registered as ${role}`);

    createSendToken(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user and validate password
    const user = await User.findByCredentials(identifier, password);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'patientInfo',
        model: 'Patient'
      })
      .populate({
        path: 'doctorInfo',
        model: 'Doctor'
      });

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update current user
// @route   PUT /api/auth/me
// @access  Private
router.put('/me', protect, validateUserUpdate, async (req, res) => {
  try {
    console.log('Update profile request body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', req.headers);

    const allowedUpdates = ['profile', 'email'];
    const updates = {};

    // Only allow certain fields to be updated
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    console.log('Updates to apply:', updates);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    console.log('Updated user:', user);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isCorrect = await user.correctPassword(currentPassword, user.password);
    if (!isCorrect) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Deactivate account
// @route   DELETE /api/auth/me
// @access  Private
router.delete('/me', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    res.status(200).json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

export default router;
