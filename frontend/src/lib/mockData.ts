// Mock data for healthcare management system
export interface Patient {
  id: string;
  cardNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: MedicalRecord[];
  insurance?: InsuranceInfo;
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: 'Diagnosis' | 'Prescription' | 'Test Result' | 'Treatment';
  description: string;
  doctor: string;
  department: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  coverageType: string;
  expiryDate: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  availability: TimeSlot[];
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  reason: string;
  notes?: string;
}

export interface Bill {
  id: string;
  patientId: string;
  amount: number;
  description: string;
  date: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  paymentMethod?: 'Insurance' | 'Card' | 'Cash';
}

export interface Payment {
  id: string;
  billId: string;
  amount: number;
  method: 'Insurance' | 'Card' | 'Cash';
  date: string;
  status: 'Success' | 'Failed' | 'Processing';
  transactionId?: string;
}

// Mock data
export const mockPatients: Patient[] = [
  {
    id: 'P001',
    cardNumber: 'HC001234567',
    firstName: 'Amara',
    lastName: 'Silva',
    dateOfBirth: '1985-03-15',
    gender: 'Female',
    phone: '+94771234567',
    email: 'amara.silva@email.com',
    address: '123 Galle Road, Colombo 03',
    emergencyContact: '+94771234568',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Shellfish'],
    medicalHistory: [
      {
        id: 'MR001',
        date: '2024-09-15',
        type: 'Diagnosis',
        description: 'Hypertension - Stage 1',
        doctor: 'Dr. Perera',
        department: 'Cardiology'
      },
      {
        id: 'MR002',
        date: '2024-09-15',
        type: 'Prescription',
        description: 'Amlodipine 5mg - Once daily',
        doctor: 'Dr. Perera',
        department: 'Cardiology'
      }
    ],
    insurance: {
      provider: 'Sri Lanka Insurance',
      policyNumber: 'SLI123456789',
      coverageType: 'Comprehensive',
      expiryDate: '2025-12-31'
    }
  },
  {
    id: 'P002',
    cardNumber: 'HC001234568',
    firstName: 'Kamal',
    lastName: 'Fernando',
    dateOfBirth: '1978-07-22',
    gender: 'Male',
    phone: '+94777654321',
    email: 'kamal.fernando@email.com',
    address: '456 Kandy Road, Maharagama',
    emergencyContact: '+94777654322',
    bloodType: 'A+',
    allergies: [],
    medicalHistory: [
      {
        id: 'MR003',
        date: '2024-09-10',
        type: 'Test Result',
        description: 'Blood Sugar: 95 mg/dL (Normal)',
        doctor: 'Dr. Jayawardena',
        department: 'General Medicine'
      }
    ]
  }
];

export const mockDoctors: Doctor[] = [
  {
    id: 'D001',
    name: 'Dr. Sunil Perera',
    specialization: 'Cardiologist',
    department: 'Cardiology',
    availability: [
      { date: '2024-09-28', time: '09:00', available: true },
      { date: '2024-09-28', time: '10:00', available: false },
      { date: '2024-09-28', time: '11:00', available: true },
      { date: '2024-09-29', time: '09:00', available: true },
      { date: '2024-09-29', time: '10:00', available: true }
    ]
  },
  {
    id: 'D002',
    name: 'Dr. Priya Jayawardena',
    specialization: 'General Practitioner',
    department: 'General Medicine',
    availability: [
      { date: '2024-09-28', time: '14:00', available: true },
      { date: '2024-09-28', time: '15:00', available: true },
      { date: '2024-09-29', time: '14:00', available: false },
      { date: '2024-09-29', time: '15:00', available: true }
    ]
  },
  {
    id: 'D003',
    name: 'Dr. Ravi Mendis',
    specialization: 'Orthopedic Surgeon',
    department: 'Orthopedics',
    availability: [
      { date: '2024-09-30', time: '08:00', available: true },
      { date: '2024-09-30', time: '09:00', available: true },
      { date: '2024-10-01', time: '08:00', available: true }
    ]
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'A001',
    patientId: 'P001',
    doctorId: 'D001',
    date: '2024-09-30',
    time: '09:00',
    status: 'Scheduled',
    reason: 'Follow-up consultation for hypertension'
  },
  {
    id: 'A002',
    patientId: 'P002',
    doctorId: 'D002',
    date: '2024-09-29',
    time: '14:00',
    status: 'Completed',
    reason: 'Annual health checkup',
    notes: 'Patient in good health, recommended regular exercise'
  }
];

export const mockBills: Bill[] = [
  {
    id: 'B001',
    patientId: 'P001',
    amount: 2500.00,
    description: 'Cardiology consultation and ECG',
    date: '2024-09-15',
    status: 'Pending'
  },
  {
    id: 'B002',
    patientId: 'P002',
    amount: 1500.00,
    description: 'General consultation and blood tests',
    date: '2024-09-10',
    status: 'Paid',
    paymentMethod: 'Insurance'
  },
  {
    id: 'B003',
    patientId: 'P001',
    amount: 800.00,
    description: 'Prescription medications',
    date: '2024-09-20',
    status: 'Pending'
  }
];

export const mockPayments: Payment[] = [
  {
    id: 'PAY001',
    billId: 'B002',
    amount: 1500.00,
    method: 'Insurance',
    date: '2024-09-10',
    status: 'Success',
    transactionId: 'INS123456789'
  }
];

// User roles and authentication
export interface User {
  id: string;
  username: string;
  role: 'Patient' | 'Doctor' | 'Manager';
  patientId?: string; // Only for patients
}

export const mockUsers: User[] = [
  {
    id: 'U001',
    username: 'patient1',
    role: 'Patient',
    patientId: 'P001'
  },
  {
    id: 'U002',
    username: 'doctor1',
    role: 'Doctor'
  },
  {
    id: 'U003',
    username: 'manager1',
    role: 'Manager'
  }
];

// Report data for analytics
export const mockReportData = {
  patientVisits: {
    daily: [
      { date: '2024-09-20', visits: 45 },
      { date: '2024-09-21', visits: 52 },
      { date: '2024-09-22', visits: 38 },
      { date: '2024-09-23', visits: 61 },
      { date: '2024-09-24', visits: 48 },
      { date: '2024-09-25', visits: 55 },
      { date: '2024-09-26', visits: 42 }
    ]
  },
  departmentStats: [
    { department: 'General Medicine', patients: 120, revenue: 180000 },
    { department: 'Cardiology', patients: 85, revenue: 255000 },
    { department: 'Orthopedics', patients: 65, revenue: 195000 },
    { department: 'Pediatrics', patients: 95, revenue: 142500 }
  ],
  monthlyRevenue: [
    { month: 'Jan', revenue: 450000 },
    { month: 'Feb', revenue: 520000 },
    { month: 'Mar', revenue: 480000 },
    { month: 'Apr', revenue: 610000 },
    { month: 'May', revenue: 580000 },
    { month: 'Jun', revenue: 650000 },
    { month: 'Jul', revenue: 720000 },
    { month: 'Aug', revenue: 680000 },
    { month: 'Sep', revenue: 750000 }
  ]
};