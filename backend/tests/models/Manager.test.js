import mongoose from 'mongoose';
import User from '../../src/models/User.js';

describe('Manager Model', () => {
  // Helper function to generate unique manager test data
  const generateUniqueManagerData = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return {
      username: `manager${timestamp}${randomNum}`,
      email: `manager${timestamp}${randomNum}@medicare.com`,
      password: 'ManagerPass123',
      role: 'Healthcare Manager',
      profile: {
        firstName: 'John',
        lastName: 'Manager',
        phone: '+1234567890',
        dateOfBirth: new Date('1985-06-15'),
        address: '123 Hospital Street, Medical City',
        gender: 'Male',
        emergencyContact: '+1234567891'
      },
      isActive: true,
      lastLogin: new Date()
    };
  };

  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});
  });

  describe('Manager Creation', () => {
    test('should create a valid manager user', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);

      // Act
      const savedManager = await manager.save();

      // Assert
      expect(savedManager._id).toBeDefined();
      expect(savedManager.email).toBe(managerData.email);
      expect(savedManager.role).toBe('Healthcare Manager');
      expect(savedManager.profile.firstName).toBe(managerData.profile.firstName);
      expect(savedManager.profile.lastName).toBe(managerData.profile.lastName);
      expect(savedManager.isActive).toBe(true);
    });

    test('should hash password before saving manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);

      // Act
      const savedManager = await manager.save();

      // Assert
      expect(savedManager.password).not.toBe(managerData.password);
      expect(savedManager.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should set timestamps on manager creation', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);

      // Act
      const savedManager = await manager.save();

      // Assert
      expect(savedManager.createdAt).toBeDefined();
      expect(savedManager.updatedAt).toBeDefined();
      expect(savedManager.createdAt).toBeInstanceOf(Date);
      expect(savedManager.updatedAt).toBeInstanceOf(Date);
    });

    test('should create manager with all profile fields', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);

      // Act
      const savedManager = await manager.save();

      // Assert
      expect(savedManager.profile.firstName).toBe('John');
      expect(savedManager.profile.lastName).toBe('Manager');
      expect(savedManager.profile.phone).toBe('+1234567890');
      expect(savedManager.profile.gender).toBe('Male');
      expect(savedManager.profile.address).toBe('123 Hospital Street, Medical City');
      expect(savedManager.profile.emergencyContact).toBe('+1234567891');
      expect(savedManager.profile.dateOfBirth).toEqual(new Date('1985-06-15'));
    });
  });

  describe('Manager Validation', () => {
    test('should require email for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.email;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Email is required');
    });

    test('should require password for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.password;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Password is required');
    });

    test('should require valid email format for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      managerData.email = 'invalid-email';
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should require password with minimum length for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      managerData.password = '123';
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Password must be at least 6 characters long');
    });

    test('should require Healthcare Manager role to be valid', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      managerData.role = 'InvalidRole';
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow();
    });

    test('should require firstName in profile for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.profile.firstName;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('First name is required');
    });

    test('should require lastName in profile for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.profile.lastName;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Last name is required');
    });

    test('should require phone number for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.profile.phone;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Phone number is required');
    });

    test('should require valid phone number format for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      managerData.profile.phone = 'invalid-phone';
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Please enter a valid phone number');
    });

    test('should require dateOfBirth for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.profile.dateOfBirth;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Date of birth is required');
    });

    test('should require gender for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.profile.gender;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Gender is required');
    });

    test('should require address for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.profile.address;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Address is required');
    });

    test('should require emergency contact for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      delete managerData.profile.emergencyContact;
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Emergency contact is required');
    });

    test('should require valid emergency contact format for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      managerData.profile.emergencyContact = 'invalid-contact';
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Please enter a valid emergency contact number');
    });

    test('should enforce username uniqueness for managers', async () => {
      // Arrange
      const managerData1 = generateUniqueManagerData();
      const managerData2 = generateUniqueManagerData();
      managerData2.username = managerData1.username; // Same username

      const manager1 = new User(managerData1);
      await manager1.save();

      const manager2 = new User(managerData2);

      // Act & Assert
      await expect(manager2.save()).rejects.toThrow();
    });

    test('should enforce email uniqueness for managers', async () => {
      // Arrange
      const managerData1 = generateUniqueManagerData();
      const managerData2 = generateUniqueManagerData();
      managerData2.email = managerData1.email; // Same email

      const manager1 = new User(managerData1);
      await manager1.save();

      const manager2 = new User(managerData2);

      // Act & Assert
      await expect(manager2.save()).rejects.toThrow();
    });

    test('should validate username length constraints for manager', async () => {
      // Arrange - username too short
      const managerData1 = generateUniqueManagerData();
      managerData1.username = 'ab';
      const manager1 = new User(managerData1);

      // Act & Assert
      await expect(manager1.save()).rejects.toThrow('Username must be at least 3 characters long');

      // Arrange - username too long
      const managerData2 = generateUniqueManagerData();
      managerData2.username = 'a'.repeat(31);
      const manager2 = new User(managerData2);

      // Act & Assert
      await expect(manager2.save()).rejects.toThrow('Username cannot exceed 30 characters');
    });

    test('should validate name length constraints for manager', async () => {
      // Arrange - firstName too long
      const managerData = generateUniqueManagerData();
      managerData.profile.firstName = 'a'.repeat(51);
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('First name cannot exceed 50 characters');

      // Arrange - lastName too long
      const managerData2 = generateUniqueManagerData();
      managerData2.profile.lastName = 'a'.repeat(51);
      const manager2 = new User(managerData2);

      // Act & Assert
      await expect(manager2.save()).rejects.toThrow('Last name cannot exceed 50 characters');
    });

    test('should validate address length constraints for manager', async () => {
      // Arrange - address too long
      const managerData = generateUniqueManagerData();
      managerData.profile.address = 'a'.repeat(201);
      const manager = new User(managerData);

      // Act & Assert
      await expect(manager.save()).rejects.toThrow('Address cannot exceed 200 characters');
    });
  });

  describe('Manager Authentication', () => {
    test('should compare password correctly for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act & Assert
      expect(await manager.comparePassword(managerData.password)).toBe(true);
      expect(await manager.comparePassword('wrongpassword')).toBe(false);
    });

    test('should generate JWT token for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act
      const token = manager.generateAuthToken();

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);

      // Verify token contains manager data
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      expect(decoded.id).toBe(manager._id.toString());
      expect(decoded.email).toBe(manager.email);
      expect(decoded.role).toBe('Healthcare Manager');
    });

    test('should find manager by credentials', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      await User.create(managerData);

      // Act
      const user = await User.findByCredentials(managerData.email, managerData.password);

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe(managerData.email);
      expect(user.role).toBe('Healthcare Manager');
    });

    test('should find manager by email or username', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      await User.create(managerData);

      // Act - find by email
      const userByEmail = await User.findByCredentials(managerData.email, managerData.password);

      // Act - find by username
      const userByUsername = await User.findByCredentials(managerData.username, managerData.password);

      // Assert
      expect(userByEmail.email).toBe(managerData.email);
      expect(userByUsername.username).toBe(managerData.username);
    });

    test('should reject invalid credentials for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      await User.create(managerData);

      // Act & Assert
      await expect(User.findByCredentials(managerData.email, 'wrongpassword')).rejects.toThrow('Invalid credentials');
      await expect(User.findByCredentials('nonexistent@example.com', managerData.password)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Manager Security', () => {
    test('should update passwordChangedAt when password is changed', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      const originalPasswordChangedAt = manager.passwordChangedAt;

      // Act - change password
      manager.password = 'NewPassword123';
      await manager.save();

      // Assert
      expect(manager.passwordChangedAt).toBeDefined();
      expect(manager.passwordChangedAt).not.toBe(originalPasswordChangedAt);
    });

    test('should detect password change after JWT timestamp', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Simulate JWT issued 1 hour ago
      const JWTTimestamp = Math.floor(Date.now() / 1000) - 3600;

      // Act & Assert - password not changed
      expect(manager.changedPasswordAfter(JWTTimestamp)).toBe(false);

      // Change password
      manager.password = 'NewPassword123';
      await manager.save();

      // Act & Assert - password changed after JWT
      expect(manager.changedPasswordAfter(JWTTimestamp)).toBe(true);
    });

    test('should not include password in JSON output', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act
      const managerJSON = manager.toJSON();

      // Assert
      expect(managerJSON.password).toBeUndefined();
      expect(managerJSON.email).toBeDefined();
      expect(managerJSON.role).toBeDefined();
    });

    test('should set isActive status correctly for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      managerData.isActive = false;
      const manager = new User(managerData);

      // Act
      const savedManager = await manager.save();

      // Assert
      expect(savedManager.isActive).toBe(false);
    });
  });

  describe('Manager Queries', () => {
    beforeEach(async () => {
      // Create test managers and other users
      const timestamp = Date.now();
      await User.create([
        generateUniqueManagerData(),
        { ...generateUniqueManagerData(), username: `manager2${timestamp}`, email: `manager2${timestamp}@medicare.com` },
        { ...generateUniqueManagerData(), username: `patient${timestamp}`, email: `patient${timestamp}@medicare.com`, role: 'Patient' },
        { ...generateUniqueManagerData(), username: `doctor${timestamp}`, email: `doctor${timestamp}@medicare.com`, role: 'Doctor' }
      ]);
    });

    test('should find all managers', async () => {
      // Act
      const managers = await User.find({ role: 'Healthcare Manager' });

      // Assert
      expect(managers.length).toBe(2);
      managers.forEach(manager => {
        expect(manager.role).toBe('Healthcare Manager');
      });
    });

    test('should find active managers only', async () => {
      // Arrange - create inactive manager
      const inactiveManagerData = generateUniqueManagerData();
      inactiveManagerData.isActive = false;
      await User.create(inactiveManagerData);

      // Act
      const activeManagers = await User.find({ role: 'Healthcare Manager', isActive: true });

      // Assert
      expect(activeManagers.length).toBe(2); // Only the active ones from beforeEach
    });

    test('should find manager by email', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      await User.create(managerData);

      // Act
      const manager = await User.findOne({ email: managerData.email });

      // Assert
      expect(manager).toBeDefined();
      expect(manager.email).toBe(managerData.email);
      expect(manager.role).toBe('Healthcare Manager');
    });

    test('should find manager by username', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      await User.create(managerData);

      // Act
      const manager = await User.findOne({ username: managerData.username });

      // Assert
      expect(manager).toBeDefined();
      expect(manager.username).toBe(managerData.username);
      expect(manager.role).toBe('Healthcare Manager');
    });

    test('should count total managers', async () => {
      // Act
      const managerCount = await User.countDocuments({ role: 'Healthcare Manager' });

      // Assert
      expect(managerCount).toBe(2);
    });

    test('should find managers with pagination', async () => {
      // Act
      const managersPage1 = await User.find({ role: 'Healthcare Manager' })
        .limit(1)
        .skip(0);

      const managersPage2 = await User.find({ role: 'Healthcare Manager' })
        .limit(1)
        .skip(1);

      // Assert
      expect(managersPage1.length).toBe(1);
      expect(managersPage2.length).toBe(1);
      expect(managersPage1[0]._id.toString()).not.toBe(managersPage2[0]._id.toString());
    });
  });

  describe('Manager Role Management', () => {
    test('should allow role transition to manager', async () => {
      // Arrange
      const patientData = generateUniqueManagerData();
      patientData.role = 'Patient';
      const user = new User(patientData);
      await user.save();

      // Act - change role to manager
      user.role = 'Healthcare Manager';
      const updatedUser = await user.save();

      // Assert
      expect(updatedUser.role).toBe('Healthcare Manager');
    });

    test('should allow role transition from manager to other roles', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act - change role to patient
      manager.role = 'Patient';
      const updatedManager = await manager.save();

      // Assert
      expect(updatedManager.role).toBe('Patient');
    });

    test('should maintain manager data when role changes', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act - change role and back
      manager.role = 'Patient';
      await manager.save();
      manager.role = 'Healthcare Manager';
      const updatedManager = await manager.save();

      // Assert
      expect(updatedManager.role).toBe('Healthcare Manager');
      expect(updatedManager.profile.firstName).toBe(managerData.profile.firstName);
      expect(updatedManager.email).toBe(managerData.email);
    });
  });

  describe('Manager Profile Management', () => {
    test('should update manager profile information', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act
      manager.profile.firstName = 'Jane';
      manager.profile.lastName = 'Admin';
      manager.profile.phone = '+1987654321';
      const updatedManager = await manager.save();

      // Assert
      expect(updatedManager.profile.firstName).toBe('Jane');
      expect(updatedManager.profile.lastName).toBe('Admin');
      expect(updatedManager.profile.phone).toBe('+1987654321');
    });

    test('should update manager contact information', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act
      manager.profile.address = '456 New Hospital Street';
      manager.profile.emergencyContact = '+1987654321';
      const updatedManager = await manager.save();

      // Assert
      expect(updatedManager.profile.address).toBe('456 New Hospital Street');
      expect(updatedManager.profile.emergencyContact).toBe('+1987654321');
    });

    test('should update lastLogin timestamp for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      const originalLastLogin = manager.lastLogin;

      // Act
      manager.lastLogin = new Date();
      const updatedManager = await manager.save();

      // Assert
      expect(updatedManager.lastLogin).toBeDefined();
      expect(updatedManager.lastLogin).not.toBe(originalLastLogin);
    });

    test('should provide full name virtual for manager', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act & Assert
      expect(manager.profile.fullName).toBe('John Manager');
    });
  });

  describe('Manager Data Integrity', () => {
    test('should maintain data consistency across manager operations', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act - perform multiple operations
      manager.profile.firstName = 'Updated';
      manager.lastLogin = new Date();
      await manager.save();

      // Reload from database
      const reloadedManager = await User.findById(manager._id);

      // Assert
      expect(reloadedManager.profile.firstName).toBe('Updated');
      expect(reloadedManager.email).toBe(managerData.email);
      expect(reloadedManager.role).toBe('Healthcare Manager');
      expect(reloadedManager.lastLogin).toBeDefined();
    });

    test('should handle concurrent manager operations safely', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      // Act - simulate concurrent updates
      const update1 = User.findByIdAndUpdate(manager._id, { 'profile.firstName': 'Update1' });
      const update2 = User.findByIdAndUpdate(manager._id, { 'profile.lastName': 'Update2' });

      await Promise.all([update1, update2]);

      // Assert
      const updatedManager = await User.findById(manager._id);
      expect(updatedManager.profile.firstName).toBe('Update1');
      expect(updatedManager.profile.lastName).toBe('Update2');
    });

    test('should handle manager deletion properly', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const manager = new User(managerData);
      await manager.save();

      const managerId = manager._id;

      // Act
      await User.findByIdAndDelete(managerId);

      // Assert
      const deletedManager = await User.findById(managerId);
      expect(deletedManager).toBeNull();
    });
  });


  // Edge cases
  describe('Manager Edge Cases', () => {
    test('should handle manager with minimum valid data', async () => {
      // Arrange
      const minimalManagerData = {
        username: 'minmanager',
        email: 'min.manager@test.com',
        password: '123456',
        role: 'Healthcare Manager',
        profile: {
          firstName: 'Min',
          lastName: 'Manager',
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-01'),
          address: '123 Test St',
          gender: 'Male',
          emergencyContact: '+1234567891'
        }
      };

      const manager = new User(minimalManagerData);

      // Act
      const savedManager = await manager.save();

      // Assert
      expect(savedManager.username).toBe('minmanager');
      expect(savedManager.role).toBe('Healthcare Manager');
      expect(savedManager.isActive).toBe(true); // default value
    });

    test('should handle manager with special characters in names', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      managerData.profile.firstName = 'José';
      managerData.profile.lastName = "O'Connor";
      managerData.username = 'jose-o-connor';
      managerData.email = 'jose.oconnor@test.com';

      const manager = new User(managerData);

      // Act
      const savedManager = await manager.save();

      // Assert
      expect(savedManager.profile.firstName).toBe('José');
      expect(savedManager.profile.lastName).toBe("O'Connor");
      expect(savedManager.username).toBe('jose-o-connor');
    });

    test('should handle manager with very long valid names', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      managerData.profile.firstName = 'A'.repeat(50); // Max length
      managerData.profile.lastName = 'B'.repeat(50); // Max length
      managerData.profile.address = 'C'.repeat(200); // Max length

      const manager = new User(managerData);

      // Act
      const savedManager = await manager.save();

      // Assert
      expect(savedManager.profile.firstName).toBe('A'.repeat(50));
      expect(savedManager.profile.lastName).toBe('B'.repeat(50));
      expect(savedManager.profile.address).toBe('C'.repeat(200));
    });

    test('should handle manager creation with pre-hashed password', async () => {
      // Arrange
      const managerData = generateUniqueManagerData();
      const hashedPassword = '$2a$12$exampleHashedPasswordString';
      managerData.password = hashedPassword;

      // Act
      const manager = new User(managerData);

      // Temporarily disable password hashing middleware
      const originalPreSave = manager.schema.pre;
      manager.schema.pre = function(middleware) { return this; };

      const savedManager = await manager.save();

      // Restore middleware
      manager.schema.pre = originalPreSave;

      // Assert
      expect(savedManager.password).toBe(hashedPassword);
    });
  });
});
