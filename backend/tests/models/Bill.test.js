import mongoose from 'mongoose';
import Bill from '../../src/models/Bill.js';
import User from '../../src/models/User.js';
import Doctor from '../../src/models/Doctor.js';
import Patient from '../../src/models/Patient.js';
import Hospital from '../../src/models/Hospital.js';
import Appointment from '../../src/models/Appointment.js';

describe('Bill Model', () => {
  let testUser, testDoctor, testPatient, testHospital, testAppointment;

  // Helper function to generate unique test data
  const generateUniqueUserData = (role = 'Patient') => {
    const timestamp = Date.now();
    const baseData = {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123',
      role: role,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        address: '123 Test Street',
        gender: 'Male',
        emergencyContact: '+1234567891'
      }
    };

    // Add Doctor-specific fields if role is Doctor
    if (role === 'Doctor') {
      baseData.doctorInfo = {
        specialization: 'Cardiology',
        department: 'Cardiology',
        licenseNumber: `DR${timestamp.toString().slice(-6)}`,
        experience: 5
      };
    }

    return baseData;
  };

  beforeEach(async () => {
    // Clear all collections
    await Bill.deleteMany({});
    await Appointment.deleteMany({});
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Hospital.deleteMany({});

    // Create test user
    const userData = generateUniqueUserData('Patient');
    testUser = await User.create(userData);

    // Create test doctor
    const doctorData = generateUniqueUserData('Doctor');
    const doctorUser = await User.create(doctorData);

    testDoctor = await Doctor.create({
      user: doctorUser._id,
      specialization: 'Cardiology',
      department: 'Cardiology',
      licenseNumber: `DR${Date.now().toString().slice(-6)}`,
      experience: 5,
      consultationFee: 5000,
      availability: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }
      ]
    });

    // Create test patient
    testPatient = await Patient.create({
      user: testUser._id,
      cardNumber: `HC${Date.now().toString().slice(-9)}`,
      bloodType: 'O+',
      allergies: ['Penicillin'],
      insurance: {
        provider: 'Test Insurance',
        policyNumber: 'POL123456',
        coverageType: 'Comprehensive',
        expiryDate: new Date('2025-12-31')
      },
      emergencyContacts: [{
        name: 'Emergency Contact',
        relationship: 'Spouse',
        phone: '+1234567892',
        email: 'emergency@example.com'
      }]
    });

    // Create test hospital
    testHospital = await Hospital.create({
      name: 'Test Hospital',
      type: 'Private',
      address: {
        street: '789 Hospital Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      contact: {
        phone: '+1234567893',
        email: 'hospital@example.com',
        website: 'www.testhospital.com'
      },
      departments: ['Cardiology', 'General Medicine'],
      facilities: ['ICU', 'Emergency'],
      operatingHours: {
        weekdays: { open: '08:00', close: '20:00' },
        weekends: { open: '09:00', close: '18:00' }
      },
      emergencyServices: true,
      isActive: true
    });

    // Create test appointment (optional for bills)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    testAppointment = await Appointment.create({
      patient: testPatient._id,
      doctor: testDoctor._id,
      hospital: testHospital._id,
      date: futureDate,
      time: '10:00',
      reason: 'Regular checkup',
      status: 'Completed',
      createdBy: testUser._id
    });
  });

  describe('Bill Creation', () => {
    test('should create a valid bill with all required fields', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        appointment: testAppointment._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 4000,
        totalAmount: 4000,
        status: 'Pending',
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          },
          {
            description: 'Hospital Fee',
            quantity: 1,
            unitPrice: 1000,
            total: 1000,
            category: 'Other'
          }
        ],
        consultantFee: 3000,
        hospitalFee: 1000,
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill._id).toBeDefined();
      expect(savedBill.patient.toString()).toBe(testPatient._id.toString());
      expect(savedBill.appointment?.toString()).toBe(testAppointment._id.toString());
      expect(savedBill.hospitalName).toBe('Test Hospital');
      expect(savedBill.doctorName).toBe('Dr. John Doe');
      expect(savedBill.subtotal).toBe(4000);
      expect(savedBill.totalAmount).toBe(4000);
      expect(savedBill.status).toBe('Pending');
      expect(savedBill.items).toHaveLength(2);
      expect(savedBill.items[0].category).toBe('Consultation');
      expect(savedBill.items[1].category).toBe('Other');
    });

    test('should create bill without appointment (optional field)', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        consultantFee: 3000,
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill._id).toBeDefined();
      expect(savedBill.appointment).toBeUndefined();
      expect(savedBill.hospitalName).toBe('Test Hospital');
      expect(savedBill.doctorName).toBe('Dr. John Doe');
      expect(savedBill.status).toBe('Pending'); // Default status
    });

    test('should generate bill number automatically', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.billNumber).toBeDefined();
      expect(savedBill.billNumber).toMatch(/^BILL\d{8}$/); // BILL + 8 digits
    });

    test('should set default status to Pending', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.status).toBe('Pending');
    });

    test('should set timestamps on creation', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.createdAt).toBeDefined();
      expect(savedBill.updatedAt).toBeDefined();
      expect(savedBill.createdAt).toBeInstanceOf(Date);
      expect(savedBill.updatedAt).toBeInstanceOf(Date);
    });

    test('should calculate totals automatically via middleware', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 2000,
            category: 'Consultation'
          },
          {
            description: 'Tests',
            quantity: 2,
            unitPrice: 500,
            category: 'Test'
          }
        ],
        consultantFee: 2000,
        hospitalFee: 1000,
        taxRate: 10,
        discountRate: 5,
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.subtotal).toBe(3000); // 2000 + 1000
      expect(savedBill.taxAmount).toBe(300); // 10% of 3000
      expect(savedBill.discountAmount).toBe(150); // 5% of 3000
      expect(savedBill.totalAmount).toBe(3150); // 3000 + 300 - 150
      expect(savedBill.items[0].total).toBe(2000); // quantity * unitPrice
      expect(savedBill.items[1].total).toBe(1000); // 2 * 500
    });
  });

  //edge
  describe('Bill Validation', () => {
    test('should require patient', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Path `patient` is required');
    });

    test('should require hospitalName', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Path `hospitalName` is required');
    });

    test('should require doctorName', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Path `doctorName` is required');
    });

    test('should require subtotal', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Path `subtotal` is required');
    });

    test('should require totalAmount', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Path `totalAmount` is required');
    });

    test('should require dueDate', async () => {
      // Arrange
      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Path `dueDate` is required');
    });

    test('should require createdBy', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ]
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Path `createdBy` is required');
    });

    test('should validate bill number format if provided', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        billNumber: 'INVALID-001', // Invalid format
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Bill number must be in format BILL followed by 8 digits');
    });

    test('should accept valid bill number format', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        billNumber: 'BILL00000001',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.billNumber).toBe('BILL00000001');
    });

    test('should validate status enum values', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        status: 'InvalidStatus',
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow();
    });

    test('should accept all valid status enum values', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const validStatuses = ['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'];

      for (const status of validStatuses) {
        const billData = {
          patient: testPatient._id,
          hospitalName: 'Test Hospital',
          doctorName: 'Dr. John Doe',
          subtotal: 3000,
          totalAmount: 3000,
          status: status,
          dueDate: futureDueDate,
          items: [
            {
              description: 'Consultation Fee',
              quantity: 1,
              unitPrice: 3000,
              total: 3000,
              category: 'Consultation'
            }
          ],
          createdBy: testUser._id
        };

        // Act
        const bill = new Bill(billData);
        const savedBill = await bill.save();

        // Assert
        expect(savedBill.status).toBe(status);
      }
    });

    test('should validate item description length', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const longDescription = 'A'.repeat(201); // Exceeds 200 character limit
      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: longDescription,
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Item description cannot exceed 200 characters');
    });

    test('should validate item category enum', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Test Item',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'InvalidCategory'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow();
    });

    test('should accept all valid item category enum values', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const validCategories = ['Consultation', 'Medication', 'Test', 'Procedure', 'Other'];

      for (const category of validCategories) {
        const billData = {
          patient: testPatient._id,
          hospitalName: 'Test Hospital',
          doctorName: 'Dr. John Doe',
          subtotal: 3000,
          totalAmount: 3000,
          dueDate: futureDueDate,
          items: [
            {
              description: `${category} Fee`,
              quantity: 1,
              unitPrice: 3000,
              total: 3000,
              category: category
            }
          ],
          createdBy: testUser._id
        };

        // Act
        const bill = new Bill(billData);
        const savedBill = await bill.save();

        // Assert
        expect(savedBill.items[0].category).toBe(category);
      }
    });

    test('should validate tax rate range', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        taxRate: 150, // Invalid: > 100%
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Tax rate cannot exceed 100%');
    });

    test('should validate discount rate range', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        discountRate: -10, // Invalid: negative
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow('Discount rate cannot be negative');
    });

    test('should validate payment method enum', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        paymentMethod: 'InvalidPaymentMethod',
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow();
    });

    test('should accept all valid payment method enum values', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const validPaymentMethods = ['Cash', 'Card', 'Insurance', 'Bank Transfer', 'Cheque'];

      for (const paymentMethod of validPaymentMethods) {
        const billData = {
          patient: testPatient._id,
          hospitalName: 'Test Hospital',
          doctorName: 'Dr. John Doe',
          subtotal: 3000,
          totalAmount: 3000,
          paymentMethod: paymentMethod,
          dueDate: futureDueDate,
          items: [
            {
              description: 'Consultation Fee',
              quantity: 1,
              unitPrice: 3000,
              total: 3000,
              category: 'Consultation'
            }
          ],
          createdBy: testUser._id
        };

        // Act
        const bill = new Bill(billData);
        const savedBill = await bill.save();

        // Assert
        expect(savedBill.paymentMethod).toBe(paymentMethod);
      }
    });

    test('should validate insurance claim status enum', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        insuranceClaim: {
          status: 'InvalidStatus'
        },
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill = new Bill(billData);
      await expect(bill.save()).rejects.toThrow();
    });

    test('should accept all valid insurance claim status enum values', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const validClaimStatuses = ['Pending', 'Approved', 'Rejected', 'Partially Approved'];

      for (const claimStatus of validClaimStatuses) {
        const billData = {
          patient: testPatient._id,
          hospitalName: 'Test Hospital',
          doctorName: 'Dr. John Doe',
          subtotal: 3000,
          totalAmount: 3000,
          insuranceClaim: {
            status: claimStatus
          },
          dueDate: futureDueDate,
          items: [
            {
              description: 'Consultation Fee',
              quantity: 1,
              unitPrice: 3000,
              total: 3000,
              category: 'Consultation'
            }
          ],
          createdBy: testUser._id
        };

        // Act
        const bill = new Bill(billData);
        const savedBill = await bill.save();

        // Assert
        expect(savedBill.insuranceClaim.status).toBe(claimStatus);
      }
    });

    test('should validate amount constraints', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      // Test negative subtotal
      const billData1 = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: -1000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill1 = new Bill(billData1);
      await expect(bill1.save()).rejects.toThrow('Subtotal cannot be negative');

      // Test negative totalAmount
      const billData2 = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: -1000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill2 = new Bill(billData2);
      await expect(bill2.save()).rejects.toThrow('Total amount cannot be negative');
    });

    test('should validate item quantity constraints', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      // Test quantity less than 1
      const billData1 = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 0,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill1 = new Bill(billData1);
      await expect(bill1.save()).rejects.toThrow('Quantity must be at least 1');

      // Test negative unit price
      const billData2 = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: -1000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill2 = new Bill(billData2);
      await expect(bill2.save()).rejects.toThrow('Unit price cannot be negative');

      // Test negative total
      const billData3 = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: -1000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill3 = new Bill(billData3);
      await expect(bill3.save()).rejects.toThrow('Total cannot be negative');
    });
  });

  describe('Bill Virtuals', () => {
    test('should calculate days overdue correctly', async () => {
      // Arrange
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 5); // 5 days ago

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        status: 'Pending',
        dueDate: pastDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.daysOverdue).toBeGreaterThanOrEqual(5); // Should be around 5 days
      expect(savedBill.isOverdue).toBe(true);
    });

    test('should calculate days overdue for overdue status', async () => {
      // Arrange
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 3);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        status: 'Overdue',
        dueDate: pastDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.daysOverdue).toBeGreaterThanOrEqual(3);
      expect(savedBill.isOverdue).toBe(true);
    });

    test('should return 0 days overdue for current bills', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 7);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        status: 'Pending',
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.daysOverdue).toBe(0);
      expect(savedBill.isOverdue).toBe(false);
    });

    test('should return 0 days overdue for paid bills', async () => {
      // Arrange
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 3);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        status: 'Paid',
        dueDate: pastDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.daysOverdue).toBe(0);
      expect(savedBill.isOverdue).toBe(false);
    });
  });

  describe('Bill Updates', () => {
    test('should update bill status to paid', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        status: 'Pending',
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Act
      savedBill.status = 'Paid';
      savedBill.paidDate = new Date();
      savedBill.paymentMethod = 'Card';
      savedBill.paidBy = testUser._id;
      const updatedBill = await savedBill.save();

      // Assert
      expect(updatedBill.status).toBe('Paid');
      expect(updatedBill.paidDate).toBeDefined();
      expect(updatedBill.paymentMethod).toBe('Card');
      expect(updatedBill.paidBy?.toString()).toBe(testUser._id.toString());
    });

    test('should update bill status to cancelled', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        status: 'Pending',
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Act
      savedBill.status = 'Cancelled';
      const updatedBill = await savedBill.save();

      // Assert
      expect(updatedBill.status).toBe('Cancelled');
    });

    test('should update bill amounts and recalculate totals', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 2000,
            category: 'Consultation'
          }
        ],
        consultantFee: 2000,
        taxRate: 10,
        discountRate: 5,
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.subtotal).toBe(2000); // From items
      expect(savedBill.taxAmount).toBe(200); // 10% of 2000
      expect(savedBill.discountAmount).toBe(100); // 5% of 2000
      expect(savedBill.totalAmount).toBe(2100); // 2000 + 200 - 100
      expect(savedBill.items[0].total).toBe(2000); // quantity * unitPrice
    });

    test('should update consultant and hospital fees', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Act
      savedBill.consultantFee = 2500;
      savedBill.hospitalFee = 500;
      const updatedBill = await savedBill.save();

      // Assert
      expect(updatedBill.consultantFee).toBe(2500);
      expect(updatedBill.hospitalFee).toBe(500);
      expect(updatedBill.totalAmount).toBe(3000); // Updated via middleware
    });

    test('should update insurance claim information', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Act
      savedBill.insuranceClaim = {
        claimNumber: 'CLM-001',
        status: 'Approved',
        approvedAmount: 2500,
        rejectedReason: null
      };
      const updatedBill = await savedBill.save();

      // Assert
      expect(updatedBill.insuranceClaim.claimNumber).toBe('CLM-001');
      expect(updatedBill.insuranceClaim.status).toBe('Approved');
      expect(updatedBill.insuranceClaim.approvedAmount).toBe(2500);
    });
  });

  describe('Bill Queries', () => {
    beforeEach(async () => {
      // Create test bills with various statuses
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await Bill.create([
        {
          patient: testPatient._id,
          hospitalName: 'Test Hospital',
          doctorName: 'Dr. John Doe',
          subtotal: 3000,
          totalAmount: 3000,
          status: 'Pending',
          dueDate: futureDate,
          items: [
            {
              description: 'Consultation Fee',
              quantity: 1,
              unitPrice: 3000,
              total: 3000,
              category: 'Consultation'
            }
          ],
          createdBy: testUser._id
        },
        {
          patient: testPatient._id,
          hospitalName: 'Test Hospital',
          doctorName: 'Dr. John Doe',
          subtotal: 5000,
          totalAmount: 5000,
          status: 'Paid',
          dueDate: futureDate,
          paidDate: new Date(),
          paymentMethod: 'Card',
          items: [
            {
              description: 'Surgery Fee',
              quantity: 1,
              unitPrice: 5000,
              total: 5000,
              category: 'Procedure'
            }
          ],
          createdBy: testUser._id
        },
        {
          patient: testPatient._id,
          hospitalName: 'Test Hospital',
          doctorName: 'Dr. John Doe',
          subtotal: 2000,
          totalAmount: 2000,
          status: 'Draft',
          dueDate: futureDate,
          items: [
            {
              description: 'Checkup Fee',
              quantity: 1,
              unitPrice: 2000,
              total: 2000,
              category: 'Consultation'
            }
          ],
          createdBy: testUser._id
        }
      ]);
    });

    test('should find bills by status', async () => {
      // Act
      const pendingBills = await Bill.find({ status: 'Pending' });
      const paidBills = await Bill.find({ status: 'Paid' });
      const draftBills = await Bill.find({ status: 'Draft' });

      // Assert
      expect(pendingBills).toHaveLength(1);
      expect(paidBills).toHaveLength(1);
      expect(draftBills).toHaveLength(1);

      expect(pendingBills[0].status).toBe('Pending');
      expect(paidBills[0].status).toBe('Paid');
      expect(draftBills[0].status).toBe('Draft');
    });

    test('should find bills by patient', async () => {
      // Act
      const patientBills = await Bill.find({ patient: testPatient._id });

      // Assert
      expect(patientBills).toHaveLength(3);
      patientBills.forEach(bill => {
        expect(bill.patient.toString()).toBe(testPatient._id.toString());
      });
    });

    test('should find overdue bills', async () => {
      // Arrange - Create overdue bill
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 5);

      await Bill.create({
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        status: 'Pending',
        dueDate: pastDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      });

      // Act
      const overdueBills = await Bill.find({
        status: 'Pending',
        dueDate: { $lt: new Date() }
      });

      // Assert
      expect(overdueBills).toHaveLength(1);
      expect(overdueBills[0].isOverdue).toBe(true);
      expect(overdueBills[0].daysOverdue).toBeGreaterThan(0);
    });

    test('should find bills by total amount range', async () => {
      // Act
      const lowAmountBills = await Bill.find({
        totalAmount: { $lte: 3000 }
      });
      const highAmountBills = await Bill.find({
        totalAmount: { $gt: 3000 }
      });

      // Assert
      expect(lowAmountBills).toHaveLength(2); // 3000 and 2000
      expect(highAmountBills).toHaveLength(1); // 5000
    });

    test('should count total bills', async () => {
      // Act
      const billCount = await Bill.countDocuments();

      // Assert
      expect(billCount).toBe(3);
    });

    test('should find bills with pagination', async () => {
      // Act
      const page1 = await Bill.find()
        .sort({ createdAt: 1 })
        .limit(1)
        .skip(0);

      const page2 = await Bill.find()
        .sort({ createdAt: 1 })
        .limit(1)
        .skip(1);

      // Assert
      expect(page1).toHaveLength(1);
      expect(page2).toHaveLength(1);
      expect(page1[0]._id.toString()).not.toBe(page2[0]._id.toString());
    });

    test('should populate patient details', async () => {
      // Act
      const bills = await Bill.find()
        .populate('patient')
        .sort({ totalAmount: 1 });

      // Assert
      expect(bills).toHaveLength(3);
      expect(bills[0].patient).toBeDefined();
      expect(bills[0].patient.user).toBeDefined();
    });

    test('should populate appointment details', async () => {
      // Arrange - Create bill with appointment
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      await Bill.create({
        patient: testPatient._id,
        appointment: testAppointment._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      });

      // Act
      const bills = await Bill.find()
        .populate('appointment')
        .sort({ totalAmount: 1 });

      // Assert
      expect(bills).toHaveLength(4); // Including the new bill
      const billWithAppointment = bills.find(bill => bill.appointment);
      expect(billWithAppointment.appointment).toBeDefined();
      expect(billWithAppointment.appointment.patient.toString()).toBe(testPatient._id.toString());
    });
  });

  describe('Bill Edge Cases', () => {
    test('should handle bill with minimum valid data', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 1);

      const minimalBillData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 1000,
        totalAmount: 1000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation',
            quantity: 1,
            unitPrice: 1000,
            total: 1000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(minimalBillData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill._id).toBeDefined();
      expect(savedBill.status).toBe('Pending'); // Default status
      expect(savedBill.taxRate).toBe(0); // Default tax rate
      expect(savedBill.discountRate).toBe(0); // Default discount rate
      expect(savedBill.billNumber).toMatch(/^BILL\d{8}$/); // Auto-generated
    });

    test('should handle bill with maximum values', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const maxDescription = 'A'.repeat(200); // Max description length
      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 1000000,
        totalAmount: 1000000,
        taxRate: 100, // Max tax rate
        discountRate: 100, // Max discount rate
        dueDate: futureDueDate,
        items: [
          {
            description: maxDescription,
            quantity: 10,
            unitPrice: 100000,
            total: 1000000,
            category: 'Procedure'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.subtotal).toBe(1000000);
      expect(savedBill.totalAmount).toBe(1000000);
      expect(savedBill.taxRate).toBe(100);
      expect(savedBill.discountRate).toBe(100);
      expect(savedBill.items[0].description).toBe(maxDescription);
    });

    test('should handle zero amounts correctly', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 0,
        totalAmount: 0,
        taxRate: 0,
        discountRate: 0,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Free Consultation',
            quantity: 1,
            unitPrice: 0,
            total: 0,
            category: 'Consultation'
          }
        ],
        consultantFee: 0,
        hospitalFee: 0,
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.subtotal).toBe(0);
      expect(savedBill.totalAmount).toBe(0);
      expect(savedBill.taxAmount).toBe(0);
      expect(savedBill.discountAmount).toBe(0);
    });

    test('should handle bill without items (calculated from fees)', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        dueDate: futureDueDate,
        consultantFee: 2000,
        hospitalFee: 1000,
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.subtotal).toBe(3000);
      expect(savedBill.totalAmount).toBe(3000);
      expect(savedBill.items).toHaveLength(1); // Auto-generated item
      expect(savedBill.items[0].description).toBe('Medical Services');
      expect(savedBill.items[0].total).toBe(3000);
    });

    test('should handle bill number uniqueness', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      // Create first bill
      const billData1 = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        billNumber: 'BILL00000001',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      await Bill.create(billData1);

      // Try to create second bill with same number
      const billData2 = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. Jane Doe',
        billNumber: 'BILL00000001', // Same number
        subtotal: 2000,
        totalAmount: 2000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Checkup Fee',
            quantity: 1,
            unitPrice: 2000,
            total: 2000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act & Assert
      const bill2 = new Bill(billData2);
      await expect(bill2.save()).rejects.toThrow();
    });

    test('should handle concurrent bill creation safely', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const baseBillData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act - Create multiple bills simultaneously
      const billPromises = Array(3).fill().map(() => {
        const billData = { ...baseBillData };
        return new Bill(billData).save();
      });

      const savedBills = await Promise.all(billPromises);

      // Assert
      expect(savedBills).toHaveLength(3);
      const billNumbers = savedBills.map(bill => bill.billNumber);
      const uniqueBillNumbers = [...new Set(billNumbers)];
      expect(billNumbers).toHaveLength(uniqueBillNumbers.length); // All unique
    });

    test('should handle bill deletion properly', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 3000,
        totalAmount: 3000,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: 3000,
            total: 3000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      const bill = new Bill(billData);
      const savedBill = await bill.save();

      const billId = savedBill._id;

      // Act
      await Bill.findByIdAndDelete(billId);

      // Assert
      const deletedBill = await Bill.findById(billId);
      expect(deletedBill).toBeNull();
    });
  });

  describe('Bill Calculations', () => {
    test('should calculate tax and discount correctly', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 10000,
        taxRate: 15,
        discountRate: 10,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Surgery',
            quantity: 1,
            unitPrice: 10000,
            total: 10000,
            category: 'Procedure'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.subtotal).toBe(10000);
      expect(savedBill.taxAmount).toBe(1500); // 15% of 10000
      expect(savedBill.discountAmount).toBe(1000); // 10% of 10000
      expect(savedBill.totalAmount).toBe(10500); // 10000 + 1500 - 1000
    });

    test('should handle zero tax and discount', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 5000,
        taxRate: 0,
        discountRate: 0,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation',
            quantity: 1,
            unitPrice: 5000,
            total: 5000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.subtotal).toBe(5000);
      expect(savedBill.taxAmount).toBe(0);
      expect(savedBill.discountAmount).toBe(0);
      expect(savedBill.totalAmount).toBe(5000);
    });

    test('should handle 100% discount', async () => {
      // Arrange
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 30);

      const billData = {
        patient: testPatient._id,
        hospitalName: 'Test Hospital',
        doctorName: 'Dr. John Doe',
        subtotal: 5000,
        taxRate: 10,
        discountRate: 100,
        dueDate: futureDueDate,
        items: [
          {
            description: 'Consultation',
            quantity: 1,
            unitPrice: 5000,
            total: 5000,
            category: 'Consultation'
          }
        ],
        createdBy: testUser._id
      };

      // Act
      const bill = new Bill(billData);
      const savedBill = await bill.save();

      // Assert
      expect(savedBill.subtotal).toBe(5000);
      expect(savedBill.taxAmount).toBe(500); // 10% of 5000
      expect(savedBill.discountAmount).toBe(5000); // 100% of 5000
      expect(savedBill.totalAmount).toBe(0); // 5000 + 500 - 5000 = 0
    });
  });
});
