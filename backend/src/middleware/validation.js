import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors occurred:', errors.array());
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .isIn(['Patient', 'Doctor', 'Healthcare Manager', 'Receptionist'])
    .withMessage('Role must be Patient, Doctor, Healthcare Manager, or Receptionist'),
  
  body('profile.firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .trim(),
  
  body('profile.lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .trim(),
  
  body('profile.phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('profile.dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        throw new Error('Please provide a valid date of birth');
      }
      return true;
    }),
  
  body('profile.gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  
  body('profile.address')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Address must be less than 200 characters')
    .trim(),
  
  body('profile.emergencyContact')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid emergency contact number'),
  
  handleValidationErrors
];

export const validateUserLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

export const validateUserUpdate = [
  body('profile.firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters')
    .trim(),
  
  body('profile.lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .trim(),
  
  body('profile.phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 0 || age > 120) {
          throw new Error('Please provide a valid date of birth');
        }
      }
      return true;
    }),

  body('profile.gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),

  body('profile.address')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Address must be less than 200 characters')
    .trim(),
  
  body('profile.emergencyContact')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid emergency contact number'),
  
  handleValidationErrors
];

// Patient validation rules
export const validatePatientRegistration = [
  body('cardNumber')
    .optional()
    .matches(/^HC\d{9}$/)
    .withMessage('Card number must be in format HC followed by 9 digits'),

  body('bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Please provide a valid blood type'),

  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),

  body('insurance.provider')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Insurance provider must not be empty if provided')
    .trim(),

  body('insurance.policyNumber')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Insurance policy number must not be empty if provided')
    .trim(),

  body('insurance.coverageType')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Insurance coverage type must not be empty if provided')
    .trim(),

  body('insurance.expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid insurance expiry date'),

  handleValidationErrors
];

// Doctor validation rules
export const validateDoctorRegistration = [
  body('specialization')
    .isLength({ min: 1, max: 100 })
    .withMessage('Specialization is required and must be less than 100 characters')
    .trim(),
  
  body('department')
    .isLength({ min: 1, max: 100 })
    .withMessage('Department is required and must be less than 100 characters')
    .trim(),
  
  body('licenseNumber')
    .matches(/^[A-Z]{2}\d{6}$/)
    .withMessage('License number must be 2 letters followed by 6 digits'),
  
  body('experience')
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  
  handleValidationErrors
];

// Appointment validation rules
export const validateAppointment = [
  body('patient')
    .isMongoId()
    .withMessage('Please provide a valid patient ID'),
  
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid appointment date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Cannot schedule appointment in the past');
      }
      
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (appointmentDate > oneYearFromNow) {
        throw new Error('Cannot schedule appointment more than 1 year in advance');
      }
      
      return true;
    }),
  
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time in HH:MM format'),
  
  body('reason')
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason is required and must be less than 500 characters')
    .trim(),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
    .trim(),
  
  handleValidationErrors
];

// Bill validation rules
export const validateBill = [
  body('patient')
    .isMongoId()
    .withMessage('Please provide a valid patient ID'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Bill must have at least one item'),
  
  body('items.*.description')
    .isLength({ min: 1, max: 200 })
    .withMessage('Item description is required and must be less than 200 characters')
    .trim(),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Item unit price must be a positive number'),
  
  body('items.*.category')
    .isIn(['Consultation', 'Medication', 'Test', 'Procedure', 'Other'])
    .withMessage('Item category must be one of: Consultation, Medication, Test, Procedure, Other'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  
  handleValidationErrors
];

// Payment validation rules
export const validatePayment = [
  body('bill')
    .isMongoId()
    .withMessage('Please provide a valid bill ID'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),
  
  body('method')
    .isIn(['Cash', 'Card', 'Insurance', 'Bank Transfer', 'Cheque'])
    .withMessage('Payment method must be one of: Cash, Card, Insurance, Bank Transfer, Cheque'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
    .trim(),
  
  handleValidationErrors
];

// ID parameter validation
export const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

// Query parameter validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];
