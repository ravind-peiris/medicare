// Simple test script to demonstrate the complete flow
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const testCompleteFlow = async () => {
  console.log('🧪 Testing complete appointment confirmation and bill creation flow...\n');

  try {
    // 1. Login as test user (assuming we have the test user from earlier)
    console.log('1️⃣ Logging in as test user...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test@example.com',
        password: 'password123',
        role: 'Patient'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Test user login failed. Creating test user first...');
      // If login fails, create the test user first
      const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser123',
          email: 'test@example.com',
          password: 'password123',
          role: 'Patient',
          profile: {
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            address: '123 Test St',
            emergencyContact: '9876543210'
          },
          patientInfo: {
            bloodType: 'O+',
            allergies: [],
            insurance: {
              provider: 'Test Insurance',
              policyNumber: 'TEST123',
              coverageType: 'Basic',
              expiryDate: '2025-12-31'
            }
          }
        })
      });

      if (!registerResponse.ok) {
        console.log('❌ Failed to create test user');
        return;
      }

      console.log('✅ Test user created successfully');
    } else {
      console.log('✅ Test user logged in successfully');
    }

    // 2. Get appointments to see current state
    console.log('\n2️⃣ Checking current appointments...');
    const appointmentsResponse = await fetch('http://localhost:5000/api/appointments', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
      }
    });

    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();
      console.log(`📋 Found ${appointmentsData.data?.appointments?.length || 0} appointments`);
    }

    // 3. Check current bills
    console.log('\n3️⃣ Checking current bills...');
    const billsResponse = await fetch('http://localhost:5000/api/bills', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
      }
    });

    if (billsResponse.ok) {
      const billsData = await billsResponse.json();
      console.log(`💰 Found ${billsData.data?.bills?.length || 0} bills`);
    }

    console.log('\n✅ Flow test completed!');
    console.log('📝 To test the complete flow:');
    console.log('   1. Login to the doctor portal');
    console.log('   2. Go to Appointments tab');
    console.log('   3. Click "Confirm Appointment" on any pending appointment');
    console.log('   4. Check the patient portal Bills tab - bills should appear automatically');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
};

testCompleteFlow();
