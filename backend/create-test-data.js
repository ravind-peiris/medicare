// Script to create test data (patients and doctors) for the manager dashboard
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const createTestData = async () => {
  try {
    console.log('Creating test data...');

    // First login as manager to get token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'manager@medicare.com',
        password: 'password123'
      })
    });

    const loginResult = await loginResponse.json();

    if (!loginResponse.ok) {
      console.error('❌ Manager login failed:', loginResult.message);
      return;
    }

    const token = loginResult.token;
    console.log('✅ Manager logged in successfully');

    // Create test patients
    const patients = [
      {
        username: 'patient1',
        email: 'patient1@example.com',
        password: 'password123',
        role: 'Patient',
        profile: {
          firstName: 'Amara',
          lastName: 'Silva',
          phone: '0771122334',
          emergencyContact: '0771122335',
          address: '123 Galle Road, Colombo 03'
        },
        patientInfo: {
          bloodType: 'O+',
          allergies: ['Penicillin', 'Shellfish'],
          insurance: {
            provider: 'Sri Lanka Insurance',
            policyNumber: 'SLI123456789',
            coverageType: 'Comprehensive',
            expiryDate: '2025-12-31'
          }
        }
      },
      {
        username: 'patient2',
        email: 'patient2@example.com',
        password: 'password123',
        role: 'Patient',
        profile: {
          firstName: 'Kamal',
          lastName: 'Fernando',
          phone: '0772233445',
          emergencyContact: '0772233446',
          address: '456 Kandy Road, Maharagama'
        },
        patientInfo: {
          bloodType: 'A+',
          allergies: [],
          insurance: {
            provider: 'Ceylon Insurance',
            policyNumber: 'CEY987654321',
            coverageType: 'Basic',
            expiryDate: '2025-10-15'
          }
        }
      }
    ];

    const createdPatients = [];

    for (const patientData of patients) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patientData)
        });

        const result = await response.json();

        if (response.ok) {
          createdPatients.push(result.data.user);
          console.log(`✅ Created patient: ${patientData.profile.firstName} ${patientData.profile.lastName}`);
        } else {
          console.error(`❌ Failed to create patient ${patientData.email}:`, result.message);
        }
      } catch (error) {
        console.error(`❌ Error creating patient ${patientData.email}:`, error.message);
      }
    }

    // Create test doctors
    const doctors = [
      {
        username: 'doctor1',
        email: 'doctor1@medicare.com',
        password: 'password123',
        role: 'Doctor',
        profile: {
          firstName: 'Dr. Sarah',
          lastName: 'Wilson',
          phone: '0773344556',
          emergencyContact: '0773344557',
          address: '789 Doctor Lane, Kandy'
        },
        doctorInfo: {
          specialization: 'Cardiologist',
          department: 'Cardiology',
          experience: 12,
          consultationFee: 2500,
          bio: 'Experienced cardiologist with 12 years of practice',
          qualifications: 'MBBS, MD Cardiology, FRCP',
          languages: 'English, Sinhala'
        }
      },
      {
        username: 'doctor2',
        email: 'doctor2@medicare.com',
        password: 'password123',
        role: 'Doctor',
        profile: {
          firstName: 'Dr. Michael',
          lastName: 'Chen',
          phone: '0774455667',
          emergencyContact: '0774455668',
          address: '321 Medical Center, Galle'
        },
        doctorInfo: {
          specialization: 'General Physician',
          department: 'General Medicine',
          experience: 8,
          consultationFee: 1500,
          bio: 'General physician with 8 years of experience',
          qualifications: 'MBBS, MD General Medicine',
          languages: 'English, Sinhala, Tamil'
        }
      }
    ];

    for (const doctorData of doctors) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(doctorData)
        });

        const result = await response.json();

        if (response.ok) {
          console.log(`✅ Created doctor: ${doctorData.profile.firstName} ${doctorData.profile.lastName}`);
        } else {
          console.error(`❌ Failed to create doctor ${doctorData.email}:`, result.message);
        }
      } catch (error) {
        console.error(`❌ Error creating doctor ${doctorData.email}:`, error.message);
      }
    }

    console.log('\n📊 Test data creation complete!');
    console.log(`Created ${createdPatients.length} patients and 2 doctors`);
    console.log('\n🔑 Manager Login:');
    console.log('Email: manager@medicare.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

createTestData();
