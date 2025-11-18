import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false // Made optional since not all records may have doctors assigned initially
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
  },
  treatment: {
    type: String,
    required: [true, 'Treatment is required'],
    maxlength: [1000, 'Treatment cannot exceed 1000 characters']
  },
  prescription: {
    type: String,
    required: [true, 'Prescription is required'],
    maxlength: [2000, 'Prescription cannot exceed 2000 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    oxygenSaturation: Number
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followUpDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
healthRecordSchema.index({ patient: 1, date: -1 });
healthRecordSchema.index({ doctor: 1, date: -1 });
healthRecordSchema.index({ date: -1 });

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);

export default HealthRecord;