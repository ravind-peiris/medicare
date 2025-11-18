import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, ArrowLeft } from 'lucide-react';

// Add these type definitions at the top of the file
interface DoctorInfo {
  specialization: string;
  department: string;
  licenseNumber: string;
  experience: number;
  consultationFee: number;
}

interface Insurance {
  provider: string;
  policyNumber: string;
  coverageType: string;
  expiryDate: string;
}

interface PatientInfo {
  bloodType: string;
  allergies: string[];
  insurance: Insurance;
}

interface Profile {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
}

interface ManagerInfo {
  department: string;
  experience: number;
  qualifications: string;
}

interface ReceptionistInfo {
  department: string;
  experience: number;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  profile: Profile;
  doctorInfo: DoctorInfo;
  patientInfo: PatientInfo;
  managerInfo: ManagerInfo;
  receptionistInfo: ReceptionistInfo;
}

// Add a helper type for nested object handling
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`
}[keyof ObjectType & (string | number)];

const RegisterPage = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      emergencyContact: ''
    },
    doctorInfo: {
      specialization: '',
      department: '',
      licenseNumber: '',
      experience: 0,
      consultationFee: 0
    },
    patientInfo: {
      bloodType: '',
      allergies: [],
      insurance: {
        provider: '',
        policyNumber: '',
        coverageType: '',
        expiryDate: ''
      }
    },
    managerInfo: {
      department: '',
      experience: 0,
      qualifications: ''
    },
    receptionistInfo: {
      department: '',
      experience: 0
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Format the request data based on role
      const baseData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: formData.profile,
      };

      const requestData = formData.role === 'Doctor' 
        ? { ...baseData, doctorInfo: formData.doctorInfo }
        : formData.role === 'Patient'
        ? { ...baseData, patientInfo: formData.patientInfo }
        : formData.role === 'Healthcare Manager'
        ? { ...baseData, managerInfo: formData.managerInfo }
        : formData.role === 'Receptionist'
        ? { ...baseData, receptionistInfo: formData.receptionistInfo }
        : baseData;
      
      console.log('Sending registration data:', JSON.stringify(requestData, null, 2));
      
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || data.data?.user));

        // Redirect based on role
        switch (formData.role) {
          case 'Doctor':
            navigate('/doctor-portal');
            break;
          case 'Patient':
            navigate('/patient-portal');
            break;
          case 'Healthcare Manager':
            navigate('/manager-dashboard');
            break;
          case 'Receptionist':
            navigate('/receptionist-portal');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNestedChange = (path: NestedKeyOf<FormData>, value: string | number) => {
    setFormData(prev => {
      const parts = path.split('.');
      const newFormData = { ...prev };
      let current: any = newFormData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
      return newFormData;
    });
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back to Home */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create Your Account
            </CardTitle>
            <CardDescription>
              Join Medicare and start managing your healthcare digitally
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patient">Patient</SelectItem>
                      <SelectItem value="Doctor">Doctor</SelectItem>
                      <SelectItem value="Healthcare Manager">Healthcare Manager</SelectItem>
                      <SelectItem value="Receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Profile Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter first name"
                      value={formData.profile.firstName}
                      onChange={(e) => handleNestedChange('profile.firstName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter last name"
                      value={formData.profile.lastName}
                      onChange={(e) => handleNestedChange('profile.lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.profile.phone}
                      onChange={(e) => handleNestedChange('profile.phone', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.profile.dateOfBirth}
                      onChange={(e) => handleNestedChange('profile.dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.profile.gender} onValueChange={(value) => handleNestedChange('profile.gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      type="tel"
                      placeholder="Enter emergency contact"
                      value={formData.profile.emergencyContact}
                      onChange={(e) => handleNestedChange('profile.emergencyContact', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Enter address"
                    value={formData.profile.address}
                    onChange={(e) => handleNestedChange('profile.address', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Role-specific Information */}
              {formData.role === 'Doctor' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Doctor Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        type="text"
                        placeholder="Enter specialization"
                        value={formData.doctorInfo.specialization}
                        onChange={(e) => handleNestedChange('doctorInfo.specialization', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        type="text"
                        placeholder="Enter department"
                        value={formData.doctorInfo.department}
                        onChange={(e) => handleNestedChange('doctorInfo.department', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        type="text"
                        placeholder="Enter license number"
                        value={formData.doctorInfo.licenseNumber}
                        onChange={(e) => handleNestedChange('doctorInfo.licenseNumber', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience (years)</Label>
                      <Input
                        id="experience"
                        type="number"
                        placeholder="Enter experience"
                        value={formData.doctorInfo.experience}
                        onChange={(e) => handleNestedChange('doctorInfo.experience', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consultationFee">Consultation Fee</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      placeholder="Enter consultation fee"
                      value={formData.doctorInfo.consultationFee}
                      onChange={(e) => handleNestedChange('doctorInfo.consultationFee', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {formData.role === 'Patient' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select value={formData.patientInfo.bloodType} onValueChange={(value) => handleNestedChange('patientInfo.bloodType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Insurance Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="provider">Insurance Provider</Label>
                        <Input
                          id="provider"
                          type="text"
                          placeholder="Enter insurance provider"
                          value={formData.patientInfo.insurance.provider}
                          onChange={(e) => handleNestedChange('patientInfo.insurance.provider', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="policyNumber">Policy Number</Label>
                        <Input
                          id="policyNumber"
                          type="text"
                          placeholder="Enter policy number"
                          value={formData.patientInfo.insurance.policyNumber}
                          onChange={(e) => handleNestedChange('patientInfo.insurance.policyNumber', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="coverageType">Coverage Type</Label>
                        <Input
                          id="coverageType"
                          type="text"
                          placeholder="Enter coverage type"
                          value={formData.patientInfo.insurance.coverageType}
                          onChange={(e) => handleNestedChange('patientInfo.insurance.coverageType', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={formData.patientInfo.insurance.expiryDate}
                          onChange={(e) => handleNestedChange('patientInfo.insurance.expiryDate', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.role === 'Healthcare Manager' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Manager Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="managerDepartment">Department</Label>
                      <Input
                        id="managerDepartment"
                        type="text"
                        placeholder="Enter department"
                        value={formData.managerInfo.department}
                        onChange={(e) => handleNestedChange('managerInfo.department', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="managerExperience">Experience (years)</Label>
                      <Input
                        id="managerExperience"
                        type="number"
                        placeholder="Enter experience"
                        value={formData.managerInfo.experience}
                        onChange={(e) => handleNestedChange('managerInfo.experience', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerQualifications">Qualifications</Label>
                    <Input
                      id="managerQualifications"
                      type="text"
                      placeholder="Enter qualifications"
                      value={formData.managerInfo.qualifications}
                      onChange={(e) => handleNestedChange('managerInfo.qualifications', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {formData.role === 'Receptionist' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Receptionist Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="receptionistDepartment">Department</Label>
                      <Input
                        id="receptionistDepartment"
                        type="text"
                        placeholder="Enter department"
                        value={formData.receptionistInfo.department}
                        onChange={(e) => handleNestedChange('receptionistInfo.department', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receptionistExperience">Experience (years)</Label>
                      <Input
                        id="receptionistExperience"
                        type="number"
                        placeholder="Enter experience"
                        value={formData.receptionistInfo.experience}
                        onChange={(e) => handleNestedChange('receptionistInfo.experience', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
