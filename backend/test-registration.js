// Test script to debug registration issues
// import fetch from 'node-fetch';

const testRegistration = async () => {
  const testData = {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'password123',
    role: 'Patient',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      address: '123 Test Street, Test City',
      emergencyContact: '9876543210'
    },
    patientInfo: {
      bloodType: 'O+',
      allergies: [],
      insurance: {
        provider: 'Test Insurance',
        policyNumber: 'POL123456',
        coverageType: 'Comprehensive',
        expiryDate: '2025-12-31'
      }
    }
  };

  try {
    console.log('Testing registration with data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('Registration failed:', result.message);
      if (result.errors) {
        console.error('Validation errors:', result.errors);
      }
    } else {
      console.log('Registration successful!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testRegistration();

