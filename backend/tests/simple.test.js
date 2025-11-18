import mongoose from 'mongoose';
import User from '../../src/models/User.js';

describe('Simple Working Test', () => {
  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});
  });

  test('should create a basic user successfully', async () => {
    // Arrange
    const userData = {
      username: `testuser${Date.now()}`, // Unique username
      email: `test${Date.now()}@example.com`, // Unique email
      password: 'password123',
      role: 'Patient',
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

    // Act
    const user = new User(userData);
    const savedUser = await user.save();

    // Assert
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe('Patient');
    expect(savedUser.profile.firstName).toBe('John');
  });

  test('should hash password before saving', async () => {
    // Arrange
    const userData = {
      username: `testuser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'Patient',
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

    // Act
    const user = new User(userData);
    const savedUser = await user.save();

    // Assert
    expect(savedUser.password).not.toBe(userData.password);
    expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
  });

  test('should validate required fields', async () => {
    // Arrange
    const incompleteUserData = {
      username: `testuser${Date.now()}`,
      // Missing email
      password: 'password123',
      role: 'Patient',
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

    // Act & Assert
    const user = new User(incompleteUserData);
    await expect(user.save()).rejects.toThrow('Email is required');
  });
});
