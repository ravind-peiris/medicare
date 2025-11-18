import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardNumber: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^HC\d{9}$/, 'Card number must be in format HC followed by 9 digits']
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  allergies: [{
    type: String,
    trim: true
  }],
  medicalHistory: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['Diagnosis', 'Prescription', 'Test Result', 'Treatment'],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    department: {
      type: String,
      required: true
    },
    attachments: [{
      filename: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  insurance: {
    provider: {
      type: String,
      required: true
    },
    policyNumber: {
      type: String,
      required: true
    },
    coverageType: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return this.user ? `${this.user.profile.firstName} ${this.user.profile.lastName}` : 'Unknown';
});

// Index for better query performance
patientSchema.index({ cardNumber: 1 }, { unique: true });
patientSchema.index({ user: 1 }, { unique: true });
patientSchema.index({ 'medicalHistory.date': -1 });
patientSchema.index({ 'medicalHistory.doctor': 1 });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;

