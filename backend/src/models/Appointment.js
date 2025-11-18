import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false // Made optional since hospital data may not be available
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
  },
  status: {
    type: String,
    enum: ['Pending', 'Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Pending'
  },
  reason: {
    type: String,
    required: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  diagnosis: {
    type: String,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  prescription: [{
    medication: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: String
  }],
  followUpDate: {
    type: Date
  },
  followUpNotes: {
    type: String,
    maxlength: [500, 'Follow-up notes cannot exceed 500 characters']
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for appointment duration (assuming 30 minutes default)
appointmentSchema.virtual('duration').get(function() {
  return 30; // minutes
});

// Virtual for end time
appointmentSchema.virtual('endTime').get(function() {
  const [hours, minutes] = this.time.split(':').map(Number);
  const endMinutes = minutes + this.duration;
  const endHours = hours + Math.floor(endMinutes / 60);
  const finalMinutes = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
});

// Index for better query performance
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: -1 });
appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ createdBy: 1 });

// Pre-save middleware to validate appointment time
appointmentSchema.pre('save', function(next) {
  const appointmentDate = new Date(this.date);
  const now = new Date();
  
  // Check if appointment is in the past
  if (appointmentDate < now) {
    return next(new Error('Cannot schedule appointment in the past'));
  }
  
  // Check if appointment is too far in the future (1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (appointmentDate > oneYearFromNow) {
    return next(new Error('Cannot schedule appointment more than 1 year in advance'));
  }
  
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

