import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Specialization cannot exceed 100 characters']
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  licenseNumber: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^[A-Z]{2}\d{6}$/, 'License number must be 2 letters followed by 6 digits']
  },
  experience: {
    type: Number,
    required: true,
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  qualifications: [{
    type: String,
    trim: true
  }],
  availability: {
    type: [{
      dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6 // 0 = Sunday, 6 = Saturday
      },
      startTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    default: []
  },
  consultationFee: {
    type: Number,
    required: true,
    min: [0, 'Consultation fee cannot be negative']
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  languages: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
doctorSchema.virtual('fullName').get(function() {
  return this.user ? `Dr. ${this.user.profile.firstName} ${this.user.profile.lastName}` : 'Unknown Doctor';
});

// Virtual for availability status
doctorSchema.virtual('isCurrentlyAvailable').get(function() {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayAvailability = (this.availability || []).find(avail => 
    avail.dayOfWeek === currentDay && 
    avail.isAvailable &&
    currentTime >= avail.startTime && 
    currentTime <= avail.endTime
  );
  
  return !!todayAvailability;
});

// Index for better query performance
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ department: 1 });
doctorSchema.index({ licenseNumber: 1 }, { unique: true });
doctorSchema.index({ user: 1 }, { unique: true });
doctorSchema.index({ isActive: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;

