import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hospital from './models/Hospital.js';
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import Patient from './models/Patient.js';

dotenv.config({ path: './config.env' });

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Hospital.deleteMany({});
    // await Doctor.deleteMany({});
    // console.log('🗑️  Cleared existing data');

    // Seed Hospitals
    const hospitals = [
      {
        name: 'City Medical Center',
        type: 'Private',
        address: {
          street: '123 Healthcare Avenue',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00100',
          country: 'Sri Lanka'
        },
        contact: {
          phone: '+94112345678',
          email: 'info@citymedical.lk',
          website: 'www.citymedical.lk'
        },
        departments: ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine'],
        facilities: ['ICU', 'Emergency', 'Laboratory', 'Radiology', 'Pharmacy'],
        operatingHours: {
          weekdays: { open: '08:00', close: '20:00' },
          weekends: { open: '09:00', close: '18:00' }
        },
        emergencyServices: true,
        isActive: true
      },
      {
        name: 'Government Hospital Colombo',
        type: 'Government',
        address: {
          street: '456 Regent Street',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00700',
          country: 'Sri Lanka'
        },
        contact: {
          phone: '+94112223344',
          email: 'info@govhospital.lk',
          website: 'www.govhospital.lk'
        },
        departments: ['General Medicine', 'Surgery', 'Pediatrics', 'Obstetrics'],
        facilities: ['ICU', 'Emergency', 'Laboratory', 'Pharmacy'],
        operatingHours: {
          weekdays: { open: '00:00', close: '23:59' },
          weekends: { open: '00:00', close: '23:59' }
        },
        emergencyServices: true,
        isActive: true
      },
      {
        name: 'Central Hospital Kandy',
        type: 'Private',
        address: {
          street: '789 Hill Road',
          city: 'Kandy',
          state: 'Central Province',
          zipCode: '20000',
          country: 'Sri Lanka'
        },
        contact: {
          phone: '+94812345678',
          email: 'info@centralhospital.lk',
          website: 'www.centralhospital.lk'
        },
        departments: ['Dermatology', 'ENT', 'General Medicine', 'Cardiology'],
        facilities: ['Laboratory', 'Radiology', 'Pharmacy'],
        operatingHours: {
          weekdays: { open: '08:00', close: '18:00' },
          weekends: { open: '09:00', close: '14:00' }
        },
        emergencyServices: false,
        isActive: true
      },
      {
        name: 'National Hospital Galle',
        type: 'Government',
        address: {
          street: '321 Beach Road',
          city: 'Galle',
          state: 'Southern Province',
          zipCode: '80000',
          country: 'Sri Lanka'
        },
        contact: {
          phone: '+94912345678',
          email: 'info@nationalhospitalgalle.lk',
          website: 'www.nationalhospitalgalle.lk'
        },
        departments: ['General Medicine', 'Surgery', 'Pediatrics'],
        facilities: ['Emergency', 'Laboratory', 'Pharmacy'],
        operatingHours: {
          weekdays: { open: '00:00', close: '23:59' },
          weekends: { open: '00:00', close: '23:59' }
        },
        emergencyServices: true,
        isActive: true
      }
    ];

    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log(`✅ Created ${createdHospitals.length} hospitals`);

    console.log('\n📊 Seeding Summary:');
    console.log(`   Hospitals: ${createdHospitals.length}`);
    console.log('\n✨ Database seeding completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
