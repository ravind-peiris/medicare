// Test script to create appointments and confirm them to generate bills
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to MongoDB first
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicare');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createTestAppointmentsAndBills = async () => {
  await connectDB();

  try {
    console.log('Creating test appointments and confirming them to generate bills...');

    // First, get the test user we created earlier
    const userResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'test@example.com',
        password: 'password123',
        role: 'Patient'
      }),
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Failed to login test user:', userData.message);
      return;
    }

    const token = userData.token;
    console.log('✅ Test user logged in successfully');

    // Get patient and doctor info
    const patientResponse = await fetch('http://localhost:5000/api/patients/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const patientData = await patientResponse.json();
    const patientId = patientData.data.patient?._id || patientData.data._id;

    // Get doctors
    const doctorsResponse = await fetch('http://localhost:5000/api/doctors', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const doctorsData = await doctorsResponse.json();
    const doctorId = doctorsData.data.doctors?.[0]?._id;

    if (!doctorId) {
      console.error('No doctors found in the system');
      return;
    }

    console.log('✅ Found patient and doctor');

    // Create test appointments
    const appointments = [
      {
        patient: patientId,
        doctor: doctorId,
        hospital: null, // No hospital for simplicity
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
        time: '10:00',
        reason: 'Regular checkup',
        notes: 'Annual health check'
      },
      {
        patient: patientId,
        doctor: doctorId,
        hospital: null,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
        time: '14:30',
        reason: 'Follow-up consultation',
        notes: 'Blood test results review'
      }
    ];

    const createdAppointments = [];

    for (const appointmentData of appointments) {
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();

      if (response.ok) {
        createdAppointments.push(result.data.appointment._id);
        console.log(`✅ Created appointment: ${result.data.appointment._id}`);
      } else {
        console.error(`❌ Failed to create appointment:`, result.message);
      }
    }

    // Now confirm each appointment to trigger automatic bill creation
    for (const appointmentId of createdAppointments) {
      console.log(`Confirming appointment ${appointmentId}...`);

      const confirmResponse = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Confirmed'
        })
      });

      const confirmResult = await confirmResponse.json();

      if (confirmResponse.ok) {
        console.log(`✅ Confirmed appointment ${appointmentId} - Bill should be created automatically`);
      } else {
        console.error(`❌ Failed to confirm appointment ${appointmentId}:`, confirmResult.message);
      }
    }

    // Check if bills were created
    console.log('\nChecking created bills...');
    const billsResponse = await fetch('http://localhost:5000/api/bills', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const billsData = await billsResponse.json();

    if (billsResponse.ok && billsData.data.bills) {
      console.log(`✅ Found ${billsData.data.bills.length} bills in the system:`);
      billsData.data.bills.forEach((bill, index) => {
        console.log(`   ${index + 1}. Bill ${bill.billNumber}: LKR ${bill.totalAmount} - ${bill.status}`);
        console.log(`      Description: ${bill.description}`);
        console.log(`      Doctor: ${bill.doctorName}`);
        console.log(`      Due: ${new Date(bill.dueDate).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('❌ No bills found or error retrieving bills');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

createTestAppointmentsAndBills();
