import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Stethoscope,
  Shield,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface FormData {
  // Common fields
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'Patient' | 'Doctor' | 'Healthcare Manager';
  
  // Profile fields
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  
  // Patient specific
  patientInfo: {
    bloodType: string;
    allergies: string;
    insurance: {
      provider: string;
      policyNumber: string;
      coverageType: string;
      expiryDate: string;
    };
  };
  
  // Doctor specific
  doctorInfo: {
    specialization: string;
    department: string;
    licenseNumber: string;
    experience: string;
    consultationFee: string;
    qualifications: string;
    languages: string;
  };
  
  // Manager specific
  managerInfo: {
    department: string;
    experience: string;
    qualifications: string;
  };
}

const MediPulseRegister = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Patient',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    patientInfo: {
      bloodType: '',
      allergies: '',
      insurance: {
        provider: '',
        policyNumber: '',
        coverageType: '',
        expiryDate: ''
      }
    },
    doctorInfo: {
      specialization: '',
      department: '',
      licenseNumber: '',
      experience: '',
      consultationFee: '',
      qualifications: '',
      languages: ''
    },
    managerInfo: {
      department: '',
      experience: '',
      qualifications: ''
    }
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child, subChild] = field.split('.');
      setFormData(prev => {
        const parentKey = parent as keyof FormData;
        const currentValue = prev[parentKey];

        if (typeof currentValue === 'object' && currentValue !== null) {
          return {
            ...prev,
            [parentKey]: {
              ...(currentValue as any),
              [child]: subChild ? {
                ...(currentValue as any)[child],
                [subChild]: value
              } : value
            }
          };
        }

        return prev;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: formData.address,
          emergencyContact: formData.emergencyContact
        }
      };

      // Add role-specific information
      if (formData.role === 'Patient') {
        (requestData as any).patientInfo = formData.patientInfo;
      }
      if (formData.role === 'Doctor') {
        (requestData as any).doctorInfo = formData.doctorInfo;
      }
      if (formData.role === 'Healthcare Manager') {
        (requestData as any).managerInfo = formData.managerInfo;
      }

      console.log('Sending registration data:', requestData);

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Enhanced error handling for validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const validationMessages = data.errors.map((error: any) =>
            `${error.field || error.param}: ${error.message}`
          ).join(', ');
          setError(`Validation failed: ${validationMessages}`);
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Patient':
        return <User className="w-5 h-5" />;
      case 'Doctor':
        return <Stethoscope className="w-5 h-5" />;
      case 'Healthcare Manager':
        return <Shield className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Patient':
        return 'from-blue-500 to-blue-600';
      case 'Doctor':
        return 'from-[#503459] to-[#81638b]';
      case 'Healthcare Manager':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">Your account has been created successfully.</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#503459] to-[#81638b] bg-clip-text text-transparent">
                MediPulse
              </span>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Join MediPulse</CardTitle>
            <CardDescription className="text-lg">
              Create your account and start managing healthcare like never before
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger 
                  value="patient" 
                  onClick={() => handleInputChange('role', 'Patient')}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Patient</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="doctor" 
                  onClick={() => handleInputChange('role', 'Doctor')}
                  className="flex items-center space-x-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctor</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="manager" 
                  onClick={() => handleInputChange('role', 'Healthcare Manager')}
                  className="flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Manager</span>
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
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
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Role-specific Fields */}
                <TabsContent value="patient" className="space-y-4">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Medical Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bloodType">Blood Type</Label>
                        <Select value={formData.patientInfo.bloodType} onValueChange={(value) => handleInputChange('patientInfo.bloodType', value)}>
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
                      <div>
                        <Label htmlFor="allergies">Allergies</Label>
                        <Input
                          id="allergies"
                          placeholder="List any allergies (optional)"
                          value={formData.patientInfo.allergies}
                          onChange={(e) => handleInputChange('patientInfo.allergies', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <h4 className="font-semibold mb-4">Insurance Information (Optional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="provider">Insurance Provider</Label>
                          <Input
                            id="provider"
                            value={formData.patientInfo.insurance.provider}
                            onChange={(e) => handleInputChange('patientInfo.insurance.provider', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="policyNumber">Policy Number</Label>
                          <Input
                            id="policyNumber"
                            value={formData.patientInfo.insurance.policyNumber}
                            onChange={(e) => handleInputChange('patientInfo.insurance.policyNumber', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="coverageType">Coverage Type</Label>
                          <Input
                            id="coverageType"
                            value={formData.patientInfo.insurance.coverageType}
                            onChange={(e) => handleInputChange('patientInfo.insurance.coverageType', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            type="date"
                            value={formData.patientInfo.insurance.expiryDate}
                            onChange={(e) => handleInputChange('patientInfo.insurance.expiryDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="doctor" className="space-y-4">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          value={formData.doctorInfo.specialization}
                          onChange={(e) => handleInputChange('doctorInfo.specialization', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={formData.doctorInfo.department}
                          onChange={(e) => handleInputChange('doctorInfo.department', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          value={formData.doctorInfo.licenseNumber}
                          onChange={(e) => handleInputChange('doctorInfo.licenseNumber', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          value={formData.doctorInfo.experience}
                          onChange={(e) => handleInputChange('doctorInfo.experience', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="consultationFee">Consultation Fee (LKR)</Label>
                        <Input
                          id="consultationFee"
                          type="number"
                          value={formData.doctorInfo.consultationFee}
                          onChange={(e) => handleInputChange('doctorInfo.consultationFee', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="languages">Languages</Label>
                        <Input
                          id="languages"
                          placeholder="English, Sinhala, Tamil"
                          value={formData.doctorInfo.languages}
                          onChange={(e) => handleInputChange('doctorInfo.languages', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="qualifications">Qualifications</Label>
                      <Textarea
                        id="qualifications"
                        placeholder="MBBS, MD, PhD, etc."
                        value={formData.doctorInfo.qualifications}
                        onChange={(e) => handleInputChange('doctorInfo.qualifications', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="manager" className="space-y-4">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Management Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="managerDepartment">Department</Label>
                        <Input
                          id="managerDepartment"
                          value={formData.managerInfo.department}
                          onChange={(e) => handleInputChange('managerInfo.department', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="managerExperience">Years of Experience</Label>
                        <Input
                          id="managerExperience"
                          type="number"
                          value={formData.managerInfo.experience}
                          onChange={(e) => handleInputChange('managerInfo.experience', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="managerQualifications">Qualifications</Label>
                      <Textarea
                        id="managerQualifications"
                        placeholder="MBA, Healthcare Management, etc."
                        value={formData.managerInfo.qualifications}
                        onChange={(e) => handleInputChange('managerInfo.qualifications', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediPulseRegister;

