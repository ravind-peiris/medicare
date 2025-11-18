import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Stethoscope,
  FileText,
  Clock,
  Bell,
  CheckCircle,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useAuth } from './UserAuth';

interface DashboardStats {
  activePatients: number;
  todayAppointments: number;
  monthlyRevenue: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalPatients: number;
}

interface SystemStatus {
  status: 'operational' | 'warning' | 'error';
  message: string;
  lastUpdated: string;
}

const ProfessionalDoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activePatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'operational',
    message: 'All Systems Operational',
    lastUpdated: new Date().toLocaleString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFeature, setActiveFeature] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
    // Update system status every minute
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        lastUpdated: new Date().toLocaleString()
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all dashboard data in parallel
      const [patientsRes, appointmentsRes, revenueRes] = await Promise.all([
        fetch('http://localhost:5000/api/patients', { headers }),
        fetch('http://localhost:5000/api/doctors/me/appointments', { headers }),
        fetch('http://localhost:5000/api/doctors/me/revenue', { headers })
      ]);

      // Check if all requests were successful
      if (!patientsRes.ok) {
        const errorData = await patientsRes.json();
        throw new Error(`Failed to fetch patients: ${errorData.message || patientsRes.statusText}`);
      }
      if (!appointmentsRes.ok) {
        const errorData = await appointmentsRes.json();
        throw new Error(`Failed to fetch appointments: ${errorData.message || appointmentsRes.statusText}`);
      }
      if (!revenueRes.ok) {
        const errorData = await revenueRes.json();
        throw new Error(`Failed to fetch revenue: ${errorData.message || revenueRes.statusText}`);
      }

      const [patientsData, appointmentsData, revenueData] = await Promise.all([
        patientsRes.json(),
        appointmentsRes.json(),
        revenueRes.json()
      ]);

      // Calculate stats from real data
      const today = new Date().toDateString();
      const todayAppointments = appointmentsData.data?.appointments?.filter((apt: any) => 
        new Date(apt.appointmentDate).toDateString() === today
      ) || [];

      const pendingAppointments = appointmentsData.data?.appointments?.filter((apt: any) => 
        apt.status === 'Scheduled' || apt.status === 'Pending'
      ) || [];

      const completedAppointments = appointmentsData.data?.appointments?.filter((apt: any) => 
        apt.status === 'Completed'
      ) || [];

      const activePatients = patientsData.data?.patients?.length || 0;

      // Calculate monthly revenue from the revenue API
      const monthlyRevenue = revenueData.data?.revenue?.monthly || 0;

      setStats({
        activePatients,
        todayAppointments: todayAppointments.length,
        monthlyRevenue,
        pendingAppointments: pendingAppointments.length,
        completedAppointments: completedAppointments.length,
        totalPatients: activePatients
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleFeatureClick = (feature: string) => {
    setActiveFeature(feature);
    // Navigate to the specific feature
    window.location.hash = feature;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {getGreeting()}, Dr. {user?.profile?.firstName || 'Doctor'}!
              </h1>
              <p className="text-xl text-purple-100">
                Access patient information and manage healthcare services
              </p>
            </div>
            <div className="hidden md:block">
              <Stethoscope className="w-16 h-16 text-white opacity-80" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Patients</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activePatients.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Today's Appointments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.todayAppointments}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Appointments</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingAppointments}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedAppointments}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Patients</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalPatients}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => handleFeatureClick('medical-records')}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold">Patient Records</CardTitle>
              <CardDescription>View and manage medical records</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Access Feature
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => handleFeatureClick('appointments')}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg font-semibold">Appointments</CardTitle>
              <CardDescription>Book and manage appointments</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Access Feature
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => handleFeatureClick('payments')}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg font-semibold">Payments</CardTitle>
              <CardDescription>Process bills and payments</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Access Feature
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => handleFeatureClick('reports')}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg font-semibold">Reports & Analytics</CardTitle>
              <CardDescription>Generate healthcare reports</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Access Feature
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Status Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Status</h3>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                {systemStatus.message}
              </Badge>
              <span className="text-sm text-gray-500">
                Last updated: {systemStatus.lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDoctorDashboard;
