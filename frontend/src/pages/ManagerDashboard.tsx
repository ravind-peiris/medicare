import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart3,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  Plus,
  Heart,
  ArrowLeft,
  User,
  Stethoscope,
  FileText,
  Settings,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  Star,
  LogOut,
  Mail,
  Phone,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/UserAuth';
import { useNavigate } from 'react-router-dom';
import apiService from '@/lib/apiService';

interface DashboardStats {
  totalAppointments: number;
  totalPatients: number;
  totalOperations: number;
  totalEarnings: number;
  newPatients: number;
  completedAppointments: number;
  pendingAppointments: number;
  monthlyGrowth: number;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  cardNumber: string;
  bloodType: string;
  phone: string;
  email: string;
  allergies: string[];
  registrationDate: string;
  lastVisit: string;
  status: 'Active' | 'Inactive';
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  experience: number;
  rating: number;
  totalPatients: number;
  status: 'Active' | 'Inactive';
}

interface Report {
  id: string;
  type: string;
  title: string;
  generatedDate: string;
  filters: string;
  status: 'Generated' | 'Generating';
}

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: string;
  reason: string;
}



const ManagerDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    totalPatients: 0,
    totalOperations: 0,
    totalEarnings: 0,
    newPatients: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    monthlyGrowth: 0
  });

  


  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState<Doctor | null>(null);
  const [isEditDepartmentModalOpen, setIsEditDepartmentModalOpen] = useState(false);
  const [editDepartmentData, setEditDepartmentData] = useState({
    department: ''
  });
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: ''
  });


  const PATIENT_MIN = 1;
  const PATIENT_MAX = 50;
  //State variables and useEffect start
// long method Solution: Extract into custom hooks:
  useEffect(() => {
    console.log('ManagerDashboard: Starting data load...');
    console.log('Current user:', user);

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        console.log('ManagerDashboard: Loading dashboard data...');

        // Load dashboard statistics
        try {
          const statsResponse = await apiService.dashboard.getStats();
          setStats(statsResponse.data);
        } catch (statsError) {
          console.error('Error loading dashboard stats:', statsError);
          // Keep default stats (all zeros) if API fails
        }


        // Magic Numbers extract to constants
        // Load patients
        try {
          console.log('Fetching patients from API...');
          const patientsResponse = await apiService.patients.getAll(PATIENT_MIN, PATIENT_MAX);
          console.log('Patients API Response:', patientsResponse);

          if (patientsResponse && patientsResponse.data) {
            console.log('Patients data:', patientsResponse.data);

            if (patientsResponse.data.patients && Array.isArray(patientsResponse.data.patients)) {
              const formattedPatients = patientsResponse.data.patients.map((patient: any) => ({
                id: patient._id,
                firstName: patient.user?.profile?.firstName || 'Unknown',
                lastName: patient.user?.profile?.lastName || 'Patient',
                cardNumber: patient.cardNumber || 'Not assigned',
                bloodType: patient.bloodType || 'Unknown',
                phone: patient.user?.profile?.phone || 'Not provided',
                email: patient.user?.email || 'Not provided',
                allergies: patient.allergies || [],
                registrationDate: patient.createdAt || new Date().toISOString(),
                lastVisit: patient.lastVisit || 'Never',
                status: patient.isActive ? 'Active' as const : 'Inactive' as const
              }));
              console.log('Formatted patients:', formattedPatients);
              setPatients(formattedPatients);
            } else {
              console.warn('Patients data structure unexpected:', patientsResponse.data);
              setPatients([]);
            }
          } else {
            console.warn('No patients response data');
            setPatients([]);
          }
        } catch (patientsError) {
          console.error('Error loading patients:', patientsError);
          // For development: temporarily show mock data if backend is not available
          console.warn('Backend patients API failed, this might be because:');
          console.warn('1. Backend server is not running');
          console.warn('2. User is not authenticated as a manager');
          console.warn('3. No patients exist in the database');
          console.warn('4. Database connection issues');
          setPatients([]);
        }

        // Load doctors
        try {
          console.log('Fetching doctors from API...');
          const doctorsResponse = await apiService.doctors.getAll(PATIENT_MIN, PATIENT_MAX);
          console.log('Doctors API Response:', doctorsResponse);

          if (doctorsResponse && doctorsResponse.data) {
            console.log('Doctors data:', doctorsResponse.data);

            if (doctorsResponse.data.doctors && Array.isArray(doctorsResponse.data.doctors)) {
              const formattedDoctors = doctorsResponse.data.doctors.map((doctor: any) => ({
                id: doctor._id,
                name: doctor.user?.profile ?
                  `${doctor.user.profile.firstName} ${doctor.user.profile.lastName}` :
                  'Unknown Doctor',
                specialization: doctor.specialization || 'General',
                department: doctor.department || 'General Medicine',
                experience: doctor.experience || 0,
                rating: doctor.rating?.average || 0,
                totalPatients: doctor.totalPatients || 0,
                status: 'Active' as const
              }));
              console.log('Formatted doctors:', formattedDoctors);
              setDoctors(formattedDoctors);
            } else {
              console.warn('Doctors data structure unexpected:', doctorsResponse.data);
              setDoctors([]);
            }
          } else {
            console.warn('No doctors response data');
            setDoctors([]);
          }
        } catch (doctorsError) {
          console.error('Error loading doctors:', doctorsError);
          setDoctors([]);
        }

        // Load appointments
        try {
          const appointmentsResponse = await apiService.appointments.getAll(1, 50);
          const formattedAppointments = appointmentsResponse.data.appointments.map((apt: any) => ({
            id: apt._id,
            patientName: apt.patient?.user?.profile ?
              `${apt.patient.user.profile.firstName} ${apt.patient.user.profile.lastName}` :
              'Unknown Patient',
            doctorName: apt.doctor?.user?.profile ?
              `${apt.doctor.user.profile.firstName} ${apt.doctor.user.profile.lastName}` :
              'Unknown Doctor',
            date: apt.date,
            time: apt.time,
            status: apt.status,
            reason: apt.reason
          }));
          setAppointments(formattedAppointments);
        } catch (appointmentsError) {
          console.error('Error loading appointments:', appointmentsError);
          // Keep empty appointments array if API fails
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        // Set default stats if all API calls fail
        setStats({
          totalAppointments: 0,
          totalPatients: 0,
          totalOperations: 0,
          totalEarnings: 0,
          newPatients: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          monthlyGrowth: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleDoctorClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDoctorModalOpen(true);
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsPatientModalOpen(true);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-patient':
        // Navigate to add patient page or open modal
        console.log('Navigate to add patient');
        break;
      case 'add-doctor':
        // Navigate to add doctor page or open modal
        console.log('Navigate to add doctor');
        break;
      case 'schedule-operation':
        // Navigate to schedule operation page
        console.log('Navigate to schedule operation');
        break;
      case 'generate-report':
        // Navigate to reports page or trigger report generation
        setActiveTab('reports');
        break;
      default:
        break;
    }
  };

  const handleGenerateReport = () => {
    const newReport: Report = {
      id: Date.now().toString(),
      type: 'Patient Analytics',
      title: `Patient Report - ${new Date().toLocaleDateString()}`,
      generatedDate: new Date().toISOString(),
      filters: 'All patients, Last 30 days',
      status: 'Generating'
    };

    setReports(prev => [newReport, ...prev]);

    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(report =>
        report.id === newReport.id
          ? { ...report, status: 'Generated' as const }
          : report
      ));
    }, 3000);
  };

  const handleLogout = () => {
    console.log('Logout button clicked');
    logout(() => {
      console.log('Navigating to login page');
      navigate('/login');
    });
  };

  const handleProfileClick = () => {
    // Initialize edit form with current user data
    if (user?.profile) {
      setEditFormData({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phone: user.profile.phone || '',
        dateOfBirth: user.profile.dateOfBirth || '',
        gender: user.profile.gender || '',
        address: user.profile.address || '',
        emergencyContact: user.profile.emergencyContact || ''
      });
    }
    setIsEditMode(false);
    setIsProfileModalOpen(true);
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset form data to current user data
    if (user?.profile) {
      setEditFormData({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phone: user.profile.phone || '',
        dateOfBirth: user.profile.dateOfBirth || '',
        gender: user.profile.gender || '',
        address: user.profile.address || '',
        emergencyContact: user.profile.emergencyContact || ''
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      console.log('Saving profile data:', editFormData);

      // Call the API to update the profile
      const response = await apiService.auth.updateProfile({ profile: editFormData });
      console.log('Profile update response:', response);

      if (response && response.status === 'success') {
        // Update the local user state with the new profile data
        if (user) {
          const updatedUser = {
            ...user,
            profile: {
              ...user.profile,
              ...editFormData,
              gender: editFormData.gender as 'Male' | 'Female' | 'Other'
            }
          };

          // Update the user in localStorage and auth context
          localStorage.setItem('user', JSON.stringify(updatedUser));
          updateUser(updatedUser);
        }

        setIsEditMode(false);
        setIsProfileModalOpen(false); // Close the modal after successful save
        console.log('Profile saved successfully!');
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
          variant: "default",
        });
      } else {
        throw new Error(response?.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: `Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleEditDepartment = (doctor: Doctor) => {
    setSelectedDoctorForEdit(doctor);
    setEditDepartmentData({
      department: doctor.department
    });
    setIsEditDepartmentModalOpen(true);
  };

  const handleSaveDepartment = async () => {
    if (!selectedDoctorForEdit) return;

    try {
      setIsSavingDepartment(true);
      console.log('Saving department data:', editDepartmentData);

      // Call the API to update the doctor's department
      const response = await apiService.doctors.update(selectedDoctorForEdit.id, {
        department: editDepartmentData.department
      });

      console.log('Department update response:', response);

      if (response) {
        // Update the local doctor state
        setDoctors(prevDoctors =>
          prevDoctors.map(doc =>
            doc.id === selectedDoctorForEdit.id
              ? { ...doc, department: editDepartmentData.department }
              : doc
          )
        );

        setIsEditDepartmentModalOpen(false);
        setSelectedDoctorForEdit(null);
        console.log('Department saved successfully!');
        toast({
          title: "Department Updated",
          description: `Department for ${selectedDoctorForEdit.name} has been successfully updated.`,
          variant: "default",
        });
      } else {
        throw new Error('No response received from server');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: "Error",
        description: `Failed to update department: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSavingDepartment(false);
    }
  };

  const handleDepartmentInputChange = (value: string) => {
    setEditDepartmentData(prev => ({
      ...prev,
      department: value
    }));
  };

  const handleCancelDepartmentEdit = () => {
    setIsEditDepartmentModalOpen(false);
    setSelectedDoctorForEdit(null);
    setEditDepartmentData({ department: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  //Single Responsibility Principle (SRP) 
  const StatCard = ({ title, value, icon: Icon, change, changeType }: {
    title: string;
    value: string | number;
    icon: any;
    change?: string;
    changeType?: 'positive' | 'negative';
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{title}</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{value}</p>
            {change && (
              <div className="flex items-center mt-1 md:mt-2">
                {changeType === 'positive' ? (
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-500 mr-1 flex-shrink-0" />
                )}
                <span className={`text-xs md:text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-lg flex items-center justify-center ml-3 flex-shrink-0">
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-b-2 border-[#503459] mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm md:text-lg">Loading dashboard...</p>
          <p className="mt-2 text-gray-500 text-xs md:text-sm">Fetching patient, doctor, and appointment data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">MediPulse Manager Dashboard</h1>
                <p className="text-xs md:text-sm text-gray-600 truncate">Welcome, {user?.profile?.firstName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleProfileClick}
                className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
              >
                <User className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Profile</span>
                <span className="sm:hidden">Profile</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 md:mb-8 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Patients</span>
              <span className="sm:hidden">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4">
              <Stethoscope className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Doctors</span>
              <span className="sm:hidden">Doctors</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4">
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                title="Total Appointments"
                value={stats.totalAppointments.toLocaleString()}
                icon={Calendar}
                change="+12.5%"
                changeType="positive"
              />
              <StatCard
                title="Total Patients"
                value={stats.totalPatients.toLocaleString()}
                icon={Users}
                change="+8.2%"
                changeType="positive"
              />
              <StatCard
                title="Total Operations"
                value={stats.totalOperations.toLocaleString()}
                icon={Activity}
                change="0%"
                changeType="positive"
              />
              <StatCard
                title="Total Earnings"
                value="LKR 175,000"
                icon={DollarSign}
                change="+22.1%"
                changeType="positive"
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <StatCard
                title="New Patients (This Month)"
                value={stats.newPatients}
                icon={User}
                change="+18 new"
                changeType="positive"
              />
              <StatCard
                title="Completed Appointments"
                value="17"
                icon={CheckCircle}
                change="46.7%"
                changeType="positive"
              />
              <StatCard
                title="Pending Appointments"
                value={stats.pendingAppointments}
                icon={Clock}
                change="5.4%"
                changeType="positive"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-[#503459]/20" onClick={() => handleQuickAction('add-patient')}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#503459] transition-colors"> Patients</h3>
                      <p className="text-xs md:text-sm text-gray-500"> New Patient Details</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-[#503459]/20" onClick={() => handleQuickAction('add-doctor')}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <Stethoscope className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#503459] transition-colors"> Doctor</h3>
                      <p className="text-xs md:text-sm text-gray-500"> New Doctor Details</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-[#503459]/20" onClick={() => handleQuickAction('schedule-operation')}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#503459] transition-colors">Schedule Operation</h3>
                      <p className="text-xs md:text-sm text-gray-500">Book surgery</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-[#503459]/20" onClick={() => handleQuickAction('generate-report')}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#503459] transition-colors">Generate Report</h3>
                      <p className="text-xs md:text-sm text-gray-500">Create analytics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">All Patients</h2>
                <p className="text-sm md:text-base text-gray-600">Manage patient records and information</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                
              </div>
            </div>

            {/* Patients Grid */}
            {patients.length === 0 ? (
    <Card>
      <CardContent className="text-center py-8 md:py-12">
        <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
          No patients found
        </h3>
        <p className="text-sm md:text-base text-gray-600 mb-6">
          No patient records are available. This could be because:
        </p>
        <div className="space-y-2 text-xs text-gray-500 mb-6">
          <p>• No patients have registered in the system yet</p>
          <p>• Backend server might not be running</p>
          <p>• Database connection issues</p>
          <p>Check the browser console for detailed error messages</p>
        </div>
        <Button className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90">
          <Plus className="w-4 h-4 mr-2" />
          Add First Patient
        </Button>
      </CardContent>
    </Card>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {patients.map((patient) => (
        <Card
          key={patient.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handlePatientClick(patient)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                  <CardDescription>ID: {patient.cardNumber}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{patient.bloodType}</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {patient.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {patient.email}
              </div>

              {patient.allergies && patient.allergies.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-600 font-medium">Allergies:</p>
                  <p className="text-xs text-red-600">
                    {patient.allergies.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )}
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">All Doctors</h2>
                <p className="text-sm md:text-base text-gray-600">Manage doctor profiles and schedules</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {doctors.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 md:py-12">
                    <Stethoscope className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
                    <p className="text-sm md:text-base text-gray-600">No doctor records are available. Doctors will appear here once they register in the system.</p>
                    <Button className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90 mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Doctor
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                doctors.map((doctor) => (
                  <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3 md:space-x-4 w-full md:w-auto">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 md:w-6 md:h-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base md:text-lg font-semibold truncate">{doctor.name}</h3>
                            <p className="text-sm md:text-base text-gray-600 truncate">{doctor.specialization}</p>
                            <p className="text-xs md:text-sm text-gray-500 truncate">{doctor.department}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <Badge className={doctor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {doctor.status}
                            </Badge>
                            <div className="flex items-center">
                              <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-xs md:text-sm font-medium">{doctor.rating}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => handleDoctorClick(doctor)}>
                              <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                              onClick={() => handleEditDepartment(doctor)}
                            >
                              <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              Edit Department
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Experience:</span> {doctor.experience} years
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {doctor.department}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Staff Management</CardTitle>
                <CardDescription className="text-sm md:text-base">Manage healthcare staff and administrative personnel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 md:py-12">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Staff Management</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-6">Manage nurses, technicians, and administrative staff</p>
                  <Button className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff Member
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 md:space-y-6">
            <div className="text-center py-6 md:py-8">
              <Activity className="w-12 h-12 md:w-16 md:h-16 text-[#503459] mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">Advanced Healthcare Analytics</h3>
              <p className="text-sm md:text-base text-gray-600 mb-6">
                Access comprehensive analytics and insights for healthcare management
              </p>
              <Button
                className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                onClick={() => window.open('/analytics', '_blank')}
              >
                <Activity className="w-4 h-4 mr-2" />
                Open Analytics Dashboard
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                <p className="text-sm md:text-base text-gray-600">Generate and manage healthcare reports</p>
              </div>
              <Button
                className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90 w-full sm:w-auto"
                onClick={handleGenerateReport}
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate New Report
              </Button>
            </div>

            {/* Report Generation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Generate Custom Report</CardTitle>
                <CardDescription className="text-sm md:text-base">Create detailed reports with custom filters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Report Type</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient-analytics">Patient Analytics</SelectItem>
                        <SelectItem value="appointment-summary">Appointment Summary</SelectItem>
                        <SelectItem value="financial-report">Financial Report</SelectItem>
                        <SelectItem value="doctor-performance">Doctor Performance</SelectItem>
                        <SelectItem value="operational-report">Operational Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date Range</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-week">Last Week</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-quarter">Last Quarter</SelectItem>
                        <SelectItem value="last-year">Last Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Filters</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Apply filters" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Records</SelectItem>
                        <SelectItem value="active-patients">Active Patients Only</SelectItem>
                        <SelectItem value="completed-appointments">Completed Appointments</SelectItem>
                        <SelectItem value="pending-bills">Pending Bills</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generated Reports */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base md:text-lg font-semibold truncate">{report.title}</h3>
                        <p className="text-sm md:text-base text-gray-600 truncate">{report.type}</p>
                        <p className="text-xs md:text-sm text-gray-500">Generated: {new Date(report.generatedDate).toLocaleDateString()}</p>
                        <p className="text-xs md:text-sm text-gray-500 truncate">Filters: {report.filters}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                        <Badge className={report.status === 'Generated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {report.status}
                        </Badge>
                        <div className="flex space-x-2 w-full sm:w-auto">
                          {report.status === 'Generated' && (
                            <>
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                <Download className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                Download PDF
                              </Button>
                            </>
                          )}
                          {report.status === 'Generating' && (
                            <div className="flex items-center text-xs md:text-sm text-gray-500">
                              <div className="animate-spin rounded-full h-3 h-3 md:h-4 md:w-4 border-b-2 border-[#503459] mr-2"></div>
                              Generating...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {reports.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 md:py-12">
                  <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No reports generated yet</h3>
                  <p className="text-sm md:text-base text-gray-600">Generate your first report to get started</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Doctor Details Modal */}
      <Dialog open={isDoctorModalOpen} onOpenChange={setIsDoctorModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Doctor Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about the selected doctor
            </DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-6">
              {/* Header with basic info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedDoctor.name}
                  </h3>
                  <p className="text-gray-600">{selectedDoctor.specialization}</p>
                  <p className="text-sm text-gray-500">{selectedDoctor.department}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge className={selectedDoctor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedDoctor.status}
                  </Badge>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{selectedDoctor.rating}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Experience</label>
                    <p className="text-gray-900">{selectedDoctor.experience} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <p className="text-gray-900">{selectedDoctor.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Specialization</label>
                    <p className="text-gray-900">{selectedDoctor.specialization}</p>
                  </div>
                  
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center space-x-2">
                      <Badge className={selectedDoctor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {selectedDoctor.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-gray-900 font-medium">{selectedDoctor.rating}</span>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDoctorModalOpen(false)}>
                  Close
                </Button>
                
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Details Modal */}
      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Patient Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about the selected patient
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              {/* Header with basic info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-gray-600">ID: {selectedPatient.cardNumber}</p>
                  <p className="text-sm text-gray-500">Blood Type: {selectedPatient.bloodType}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge className={selectedPatient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedPatient.status}
                  </Badge>
                </div>
              </div>

              {/* Detailed Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Card Number</label>
                    <p className="text-gray-900 font-mono">{selectedPatient.cardNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Blood Type</label>
                    <Badge variant="secondary" className="ml-2">{selectedPatient.bloodType}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedPatient.phone}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedPatient.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Registration Date</label>
                    <p className="text-gray-900">{new Date(selectedPatient.registrationDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Visit</label>
                    <p className="text-gray-900">{selectedPatient.lastVisit === 'Never' ? 'Never' : new Date(selectedPatient.lastVisit).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center space-x-2">
                      <Badge className={selectedPatient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {selectedPatient.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allergies Section */}
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-red-600 mb-2 block">Allergies</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsPatientModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">My Profile</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Edit your profile information' : 'View and manage your profile details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with basic info */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.username}
                </h3>
                <p className="text-gray-600">{user?.role}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">First Name</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{user?.profile?.firstName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{user?.profile?.lastName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-gray-900 mt-1">{user?.email || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{user?.profile?.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">
                      {user?.profile?.dateOfBirth ? new Date(user.profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Gender</Label>
                  {isEditMode ? (
                    <Select value={editFormData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900 mt-1">{user?.profile?.gender || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Address</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{user?.profile?.address || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Emergency Contact</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{user?.profile?.emergencyContact || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Username</Label>
                  <p className="text-gray-900 mt-1">{user?.username || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Role</Label>
                  <Badge className="mt-1">{user?.role}</Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsProfileModalOpen(false)}>
                Close
              </Button>
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={handleEditProfile}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Edit Modal */}
      <Dialog open={isEditDepartmentModalOpen} onOpenChange={setIsEditDepartmentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Department</DialogTitle>
            <DialogDescription>
              Update the department for {selectedDoctorForEdit?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedDoctorForEdit && (
            <div className="space-y-4">
              {/* Current Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedDoctorForEdit.name}</h3>
                    <p className="text-sm text-gray-600">{selectedDoctorForEdit.specialization}</p>
                  </div>
                </div>
              </div>

              {/* Department Input */}
              <div>
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department
                </Label>
                <Select value={editDepartmentData.department} onValueChange={handleDepartmentInputChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="General Medicine">General Medicine</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="Radiology">Radiology</SelectItem>
                    <SelectItem value="Pathology">Pathology</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="Ophthalmology">Ophthalmology</SelectItem>
                    <SelectItem value="ENT">ENT</SelectItem>
                    <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                    <SelectItem value="Oncology">Oncology</SelectItem>
                    <SelectItem value="Nephrology">Nephrology</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Current: {selectedDoctorForEdit.department}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancelDepartmentEdit}>
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={handleSaveDepartment}
                  disabled={isSavingDepartment || !editDepartmentData.department.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingDepartment ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerDashboard;

