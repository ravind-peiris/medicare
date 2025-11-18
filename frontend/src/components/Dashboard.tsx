import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  LogOut, 
  Heart,
  Stethoscope,
  FileText,
  Shield
} from 'lucide-react';
import { useAuth } from './UserAuth';
import { useNavigate } from 'react-router-dom';
import PatientRecords from './PatientRecords';
import AppointmentBooking from './AppointmentBooking';
import PaymentProcessing from './PaymentProcessing';
import ReportsAnalytics from './ReportsAnalytics';
import DoctorDashboard from './DoctorDashboard';
import ProfessionalDoctorDashboard from './ProfessionalDoctorDashboard';
import MedicalRecordsManager from './MedicalRecordsManager';
import DoctorAvailabilityManager from './DoctorAvailabilityManager';
import DoctorNotificationSystem from './DoctorNotificationSystem';
import DoctorPortal from '../pages/DoctorPortal';
import PatientPortal from '../pages/PatientPortal';
import ManagerDashboard from '../pages/ManagerDashboard';
import ReceptionistPortal from '../pages/ReceptionistPortal';

type ActiveView = 'dashboard' | 'records' | 'appointments' | 'payments' | 'reports' | 'doctor-dashboard' | 'medical-records' | 'availability' | 'notifications' | 'doctor-portal' | 'patient-portal' | 'manager-dashboard' | 'receptionist-portal';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Handle hash navigation from professional dashboard
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['medical-records', 'appointments', 'payments', 'reports', 'availability', 'notifications'].includes(hash)) {
        setActiveView(hash as ActiveView);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const getAvailableFeatures = () => {
    const features = [];
    
    if (user?.role === 'Patient' || user?.role === 'Doctor') {
      features.push({
        id: 'records' as ActiveView,
        title: 'Patient Records',
        description: 'View and manage medical records',
        icon: FileText,
        color: 'bg-blue-500'
      });
    }

    if (user?.role === 'Patient' || user?.role === 'Doctor') {
      features.push({
        id: 'appointments' as ActiveView,
        title: 'Appointments',
        description: 'Book and manage appointments',
        icon: Calendar,
        color: 'bg-green-500'
      });
    }

    if (user?.role === 'Patient' || user?.role === 'Doctor') {
      features.push({
        id: 'payments' as ActiveView,
        title: 'Payments',
        description: 'Process bills and payments',
        icon: CreditCard,
        color: 'bg-purple-500'
      });
    }

    if (user?.role === 'Manager' || user?.role === 'Doctor') {
      features.push({
        id: 'reports' as ActiveView,
        title: 'Reports & Analytics',
        description: 'Generate healthcare reports',
        icon: BarChart3,
        color: 'bg-orange-500'
      });
    }

        // Doctor-specific features
        if (user?.role === 'Doctor') {
          features.push({
            id: 'doctor-portal' as ActiveView,
            title: 'Doctor Portal',
            description: 'Complete patient management system',
            icon: Stethoscope,
            color: 'bg-[#503459]'
          });
          
          features.push({
            id: 'doctor-dashboard' as ActiveView,
            title: 'Dashboard',
            description: 'Overview and analytics',
            icon: BarChart3,
            color: 'bg-blue-600'
          });
          
          features.push({
            id: 'availability' as ActiveView,
            title: 'Availability',
            description: 'Manage schedule and availability',
            icon: Clock,
            color: 'bg-purple-600'
          });
          
          features.push({
            id: 'notifications' as ActiveView,
            title: 'Notifications',
            description: 'View alerts and reminders',
            icon: Bell,
            color: 'bg-red-600'
          });
        }

        // Patient-specific features
        if (user?.role === 'Patient') {
          features.push({
            id: 'patient-portal' as ActiveView,
            title: 'Patient Portal',
            description: 'Manage your health and appointments',
            icon: User,
            color: 'bg-[#503459]'
          });
          
          features.push({
            id: 'appointments' as ActiveView,
            title: 'Book Appointment',
            description: 'Schedule new appointments',
            icon: Calendar,
            color: 'bg-green-600'
          });
          
          features.push({
            id: 'records' as ActiveView,
            title: 'Health Records',
            description: 'View your medical history',
            icon: FileText,
            color: 'bg-blue-600'
          });
          
          features.push({
            id: 'payments' as ActiveView,
            title: 'Bills & Payments',
            description: 'Manage your medical bills',
            icon: CreditCard,
            color: 'bg-orange-600'
          });
        }

        // Healthcare Manager-specific features
        if (user?.role === 'Healthcare Manager') {
          features.push({
            id: 'manager-dashboard' as ActiveView,
            title: 'Manager Dashboard',
            description: 'Comprehensive healthcare management',
            icon: BarChart3,
            color: 'bg-[#503459]'
          });
          
          features.push({
            id: 'reports' as ActiveView,
            title: 'Reports & Analytics',
            description: 'Generate detailed reports',
            icon: FileText,
            color: 'bg-blue-600'
          });
          
          features.push({
            id: 'records' as ActiveView,
            title: 'All Patients',
            description: 'View and manage all patients',
            icon: Users,
            color: 'bg-green-600'
          });
          
          features.push({
            id: 'appointments' as ActiveView,
            title: 'All Appointments',
            description: 'Monitor all appointments',
            icon: Calendar,
            color: 'bg-purple-600'
          });
        }

        // Receptionist-specific features
        if (user?.role === 'Receptionist') {
          features.push({
            id: 'receptionist-portal' as ActiveView,
            title: 'Receptionist Portal',
            description: 'Manage appointments and bookings',
            icon: Calendar,
            color: 'bg-[#503459]'
          });
          
          features.push({
            id: 'appointments' as ActiveView,
            title: 'All Appointments',
            description: 'Monitor and manage appointments',
            icon: Calendar,
            color: 'bg-blue-600'
          });
          
          features.push({
            id: 'records' as ActiveView,
            title: 'Patient Records',
            description: 'View patient information',
            icon: FileText,
            color: 'bg-green-600'
          });
        }

    return features;
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'records':
        return <PatientRecords />;
      case 'appointments':
        return <AppointmentBooking />;
      case 'payments':
        return <PaymentProcessing />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'doctor-portal':
        return <DoctorPortal />; // New comprehensive doctor portal
      case 'patient-portal':
        return <PatientPortal />; // New comprehensive patient portal
      case 'manager-dashboard':
        return <ManagerDashboard />; // New comprehensive manager dashboard
      case 'receptionist-portal':
        return <ReceptionistPortal />; // New comprehensive receptionist portal
      case 'doctor-dashboard':
        return <ProfessionalDoctorDashboard />;
      case 'medical-records':
        return <MedicalRecordsManager />;
      case 'availability':
        return <DoctorAvailabilityManager />;
      case 'notifications':
        return <DoctorNotificationSystem />;
      default:
        // For doctors, show the professional dashboard by default
        if (user?.role === 'Doctor') {
          return <ProfessionalDoctorDashboard />;
        }
        // For patients, show the patient portal by default
        if (user?.role === 'Patient') {
          return <PatientPortal />;
        }
        // For managers, show the manager dashboard by default
        if (user?.role === 'Healthcare Manager') {
          return <ManagerDashboard />;
        }
        // For receptionists, show the receptionist portal by default
        if (user?.role === 'Receptionist') {
          return <ReceptionistPortal />;
        }
        return renderDashboardHome();
    }
  };

  const renderDashboardHome = () => {
    const features = getAvailableFeatures();
    
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome, {user?.role === 'Patient' ? 'Patient' : user?.role}!
              </h2>
              <p className="text-blue-100">
                {user?.role === 'Patient' && 'Manage your health records and appointments'}
                {user?.role === 'Staff' && 'Access patient information and manage healthcare services'}
                {user?.role === 'Manager' && 'Monitor healthcare operations and generate insights'}
              </p>
            </div>
            <div className="text-4xl opacity-80">
              {user?.role === 'Patient' && <Heart />}
              {user?.role === 'Staff' && <Stethoscope />}
              {user?.role === 'Manager' && <Shield />}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Patients</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold">28</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold">₨750K</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => setActiveView(feature.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Access Feature
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  All Systems Operational
                </Badge>
                <span className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-800"
              >
                <Heart className="h-6 w-6" />
                <span>Smart Healthcare</span>
              </button>
              
              {activeView !== 'dashboard' && (
                <Badge variant="outline" className="ml-4">
                  {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {user?.role}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logout(() => navigate('/login'))}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default Dashboard;