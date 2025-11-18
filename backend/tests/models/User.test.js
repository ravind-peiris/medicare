import mongoose from 'mongoose';
import User from '../../src/models/User.js';

describe('User Model', () => {
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
    // Clear users collection
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    test('should create a valid user', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      const user = new User(userData);

      // Act
      const savedUser = await user.save();

      // Assert
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.profile.firstName).toBe(userData.profile.firstName);
      expect(savedUser.profile.lastName).toBe(userData.profile.lastName);
    });

    test('should create a valid doctor user', async () => {
      // Arrange
      const userData = generateUniqueUserData('Doctor');
      const user = new User(userData);

      // Act
      const savedUser = await user.save();

      // Assert
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('Doctor');
      expect(savedUser.doctorInfo.specialization).toBe('Cardiology');
      expect(savedUser.doctorInfo.licenseNumber).toBe(userData.doctorInfo.licenseNumber);
    });

    test('should hash password before saving', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      const user = new User(userData);

      // Act
      const savedUser = await user.save();

      // Assert
      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should set default role to Patient', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      delete userData.role;
      const user = new User(userData);

      // Act
      const savedUser = await user.save();

      // Assert
      expect(savedUser.role).toBe('Patient');
    });
  });

  describe('User Validation', () => {
    test('should require email', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      delete userData.email;
      const user = new User(userData);

      // Act & Assert
      await expect(user.save()).rejects.toThrow('Email is required');
    });

    test('should require password', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      delete userData.password;
      const user = new User(userData);

      // Act & Assert
      await expect(user.save()).rejects.toThrow('Password is required');
    });

    test('should require valid email format', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      userData.email = 'invalid-email';
      const user = new User(userData);

      // Act & Assert
      await expect(user.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should require password with minimum length', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      userData.password = '123';
      const user = new User(userData);

      // Act & Assert
      await expect(user.save()).rejects.toThrow('Password must be at least 6 characters');
    });

    test('should require valid role', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      userData.role = 'InvalidRole';
      const user = new User(userData);

      // Act & Assert
      await expect(user.save()).rejects.toThrow();
    });

    test('should require doctor fields when role is Doctor', async () => {
      // Arrange
      const userData = generateUniqueUserData('Doctor');
      delete userData.doctorInfo.specialization;
      const user = new User(userData);

      // Act & Assert
      await expect(user.save()).rejects.toThrow('specialization');
    });
  });

  describe('User Methods', () => {
    test('should compare password correctly', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      const user = new User(userData);
      await user.save();

      // Act & Assert
      expect(await user.comparePassword(userData.password)).toBe(true);
      expect(await user.comparePassword('wrongpassword')).toBe(false);
    });

    test('should generate JWT token', async () => {
      // Arrange
      const userData = generateUniqueUserData('Patient');
      const user = new User(userData);
      await user.save();

      // Act
      const token = user.generateAuthToken();

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      // Create test users with unique data
      const timestamp = Date.now();
      await User.create([
        generateUniqueUserData('Patient'),
        generateUniqueUserData('Doctor'),
        generateUniqueUserData('Healthcare Manager')
      ]);
    });

    test('should find user by email', async () => {
      // Arrange
      const timestamp = Date.now();
      const userData = generateUniqueUserData('Patient');
      await User.create(userData);

      // Act
      const user = await User.findOne({ email: userData.email });

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    test('should find users by role', async () => {
      // Act
      const patients = await User.find({ role: 'Patient' });
      const doctors = await User.find({ role: 'Doctor' });

      // Assert
      expect(patients.length).toBeGreaterThan(0);
      expect(doctors.length).toBeGreaterThan(0);
    });
  });
});
