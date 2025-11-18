// Script to create a manager user for testing
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const createManagerUser = async () => {
  try {
    console.log('Creating manager user...');

    // Register manager user
    const managerData = {
      username: 'manager1',
      email: 'manager@medicare.com',
      password: 'password123',
      role: 'Healthcare Manager',
      profile: {
        firstName: 'John',
        lastName: 'Manager',
        phone: '+94771234567',
        dateOfBirth: '1980-01-01',
        gender: 'Male',
        address: '123 Manager Street, Colombo, Sri Lanka',
        emergencyContact: '+94771234568'
      }
    };

    console.log('Sending request to:', 'http://localhost:5000/api/auth/register');
    console.log('Request data:', JSON.stringify(managerData, null, 2));

    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(managerData)
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Manager user created successfully!');
      console.log('Email: manager@medicare.com');
      console.log('Password: password123');
      console.log('Token:', result.token);
    } else {
      console.error('❌ Failed to create manager user:', result.message);
      if (result.errors) {
        console.error('Validation errors:', result.errors);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

createManagerUser();
