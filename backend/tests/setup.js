// Test setup file for Jest
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

// Global test setup
beforeAll(async () => {
  // Connect to test database
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  
  // Use test database
  const testDbUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI?.replace('medicare', 'medicare_test');
  
  if (testDbUri) {
    await mongoose.connect(testDbUri);
    console.log('✅ Connected to test database');
  }
});

// Global test teardown
afterAll(async () => {
  // Clean up database
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
    console.log('✅ Test database cleaned up');
  }
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Increase timeout for database operations
jest.setTimeout(30000);
