import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  FileText, 
  User, 
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Plus,
  Eye,
  Edit,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/components/UserAuth';
import { useNavigate } from 'react-router-dom';
import apiService from '@/lib/apiService';

interface Patient {
  id: string;
  cardNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  bloodType: string;
  allergies: string[];
  lastVisit: string;
  profileImage?: string;
}

interface HealthRecord {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  notes: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientCardNumber: string;
  date: string;
  time: string;
  reason: string;
  status: 'Pending' | 'scheduled' | 'cancelled' | 'completed' | 'Confirmed' | 'In Progress' | 'Rescheduled';
  doctorId: string;
  doctorName: string;
  hospitalId?: string;
  hospitalName?: string;
  notes?: string;
}

const DoctorPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBloodType, setFilterBloodType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Mock patient data
  const mockPatients: Patient[] = [
    {
      id: '1',
      cardNumber: 'HC123456789',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0712345678',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      address: '123 Main St, Colombo',
      emergencyContact: '0776543210',
      bloodType: 'O+',
      allergies: ['Penicillin'],
      lastVisit: '2024-01-15'
    },
    {
      id: '2',
      cardNumber: 'HC123456790',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '0712345679',
      dateOfBirth: '1985-08-20',
      gender: 'Female',
      address: '456 Oak Ave, Kandy',
      emergencyContact: '0776543211',
      bloodType: 'A+',
      allergies: ['Latex', 'Shellfish'],
      lastVisit: '2024-01-10'
    },
    {
      id: '3',
      cardNumber: 'HC123456791',
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael@example.com',
      phone: '0712345680',
      dateOfBirth: '1992-12-03',
      gender: 'Male',
      address: '789 Pine Rd, Galle',
      emergencyContact: '0776543212',
      bloodType: 'B+',
      allergies: [],
      lastVisit: '2024-01-08'
    }
  ];

  // Mock appointment data for testing
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      patientId: '1',
      patientName: 'John Doe',
      patientCardNumber: 'HC123456789',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      reason: 'Regular checkup',
      status: 'Pending',
      doctorId: 'doctor1',
      doctorName: 'Dr. Sarah Wilson',
      hospitalName: 'MediPulse General Hospital'
    },
    {
      id: '2',
      patientId: '2',
      patientName: 'Jane Smith',
      patientCardNumber: 'HC123456790',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '2:30 PM',
      reason: 'Follow-up consultation',
      status: 'Confirmed',
      doctorId: 'doctor1',
      doctorName: 'Dr. Sarah Wilson',
      hospitalName: 'MediPulse General Hospital'
    },
    {
      id: '3',
      patientId: '3',
      patientName: 'Michael Johnson',
      patientCardNumber: 'HC123456791',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '9:15 AM',
      reason: 'Specialist consultation',
      status: 'Confirmed',
      doctorId: 'doctor1',
      doctorName: 'Dr. Sarah Wilson',
      hospitalName: 'MediPulse General Hospital'
    }
  ];

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.patients.getAll(1, 100);
        const patientsData = (response.data as any).patients || response.data;
        const formattedPatients = patientsData.map((patient: any) => ({
          id: patient._id,
          cardNumber: patient.cardNumber,
          firstName: patient.user?.profile?.firstName || 'Unknown',
          lastName: patient.user?.profile?.lastName || 'Patient',
          email: patient.user?.email || '',
          phone: patient.user?.profile?.phone || '',
          dateOfBirth: patient.user?.profile?.dateOfBirth || '',
          gender: patient.user?.profile?.gender || '',
          address: patient.user?.profile?.address || '',
          emergencyContact: patient.user?.profile?.emergencyContact || '',
          bloodType: patient.bloodType || '',
          allergies: patient.allergies || [],
          lastVisit: patient.lastVisit || '',
          profileImage: patient.profileImage
        }));

        setPatients(formattedPatients);
        setFilteredPatients(formattedPatients);
      } catch (err) {
        console.error('Error loading patients:', err);
        setError('Failed to load patients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        console.log('Loading appointments from API for doctor:', user?.id);

        if (!user?.id) {
          console.log('No user ID available, skipping API call');
          setAppointments([]);
          setFilteredAppointments([]);
          return;
        }

        const response = await apiService.appointments.getAll(1, 100, {
          doctor: user.id
        });

        console.log('API response:', response);
        console.log('Response data structure:', response.data);

        const appointmentsData = (response.data as any).appointments || response.data || [];

        console.log('Appointments data extracted:', appointmentsData);
        console.log('Appointments data length:', appointmentsData.length);

       

        const formattedAppointments = appointmentsData.map((appointment: any) => ({
          id: appointment._id,
          patientId: appointment.patient?._id || appointment.patientId,
          patientName: `${appointment.patient?.user?.profile?.firstName || 'Unknown'} ${appointment.patient?.user?.profile?.lastName || 'Patient'}`,
          patientCardNumber: appointment.patient?.cardNumber || 'Unknown',
          date: appointment.date,
          time: appointment.time,
          reason: appointment.reason || '',
          status: appointment.status === 'confirmed' ? 'scheduled' : appointment.status || 'Pending',
          doctorId: appointment.doctor?._id || appointment.doctorId,
          doctorName: `Dr. ${appointment.doctor?.user?.profile?.firstName || 'Unknown'} ${appointment.doctor?.user?.profile?.lastName || ''}`,
          hospitalId: appointment.hospital?._id,
          hospitalName: appointment.hospital?.name,
          notes: appointment.notes
        }));

        console.log('Formatted appointments for doctor:', user.id, formattedAppointments);
        setAppointments(formattedAppointments);
        setFilteredAppointments(formattedAppointments);
      } catch (err) {
        console.error('Error loading appointments from API for doctor:', user?.id, err);
        // No fallback to mock data - show error state instead
        setAppointments([]);
        setFilteredAppointments([]);
        setError('Failed to load appointments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      console.log('User authenticated with ID:', user.id, 'loading appointments...');
      loadAppointments();
    } else {
      console.log('No user authentication, clearing appointments...');
      setAppointments([]);
      setFilteredAppointments([]);
    }
  }, [user?.id]);

  useEffect(() => {
    let filtered = patients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Gender filter
    if (filterGender !== 'all') {
      filtered = filtered.filter(patient => patient.gender === filterGender);
    }

    // Blood type filter
    if (filterBloodType !== 'all') {
      filtered = filtered.filter(patient => patient.bloodType === filterBloodType);
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, filterGender, filterBloodType]);

  useEffect(() => {
    console.log('Filtering appointments...');
    console.log('Current appointments:', appointments);
    console.log('Search term:', appointmentSearchTerm);

    let filtered = appointments;

    // Search filter - only search since all appointments are already pending
    if (appointmentSearchTerm) {
      console.log('Applying search filter...');
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
        appointment.patientCardNumber.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
        appointment.reason.toLowerCase().includes(appointmentSearchTerm.toLowerCase())
      );
      console.log('After search filter:', filtered);
    }

    console.log('Final filtered appointments:', filtered);
    setFilteredAppointments(filtered);
  }, [appointments, appointmentSearchTerm]);

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePatientUpdate = (updatedPatient: Patient) => {
    // Update the patient in the local state
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    setFilteredPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    setSelectedPatient(updatedPatient);
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('profile');
  };

  const handleAddRecord = () => {
    setShowNewRecord(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    console.log('Confirming appointment', appointmentId);
    try {
      await apiService.appointments.update(appointmentId, { status: 'Confirmed' });
      // Update local state
      setAppointments(prev => prev.map(apt =>
        apt.id === appointmentId ? { ...apt, status: 'Confirmed' } : apt
      ));
    } catch (err) {
      console.error('Error confirming appointment:', err);
      setError('Failed to confirm appointment. Please try again.');
    }
  };

  const openCancelDialog = (id: string) => {
    setSelectedAppointmentId(id);
    setCancelDialogOpen(true);
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointmentId) return;

    try {
      setLoading(true);
      await apiService.appointments.cancel(selectedAppointmentId, 'Cancelled by doctor');

      // Update local state to reflect the cancellation
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointmentId
            ? { ...apt, status: 'cancelled' as const }
            : apt
        )
      );

      setCancelDialogOpen(false);
      setSelectedAppointmentId(null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}`);
  };

  const handlePayForAppointment = async (appointment: Appointment) => {
    try {
      console.log('Navigating to bills for appointment', appointment.id);
      // Navigate to bills page with appointment context and doctor info
      navigate(`/bills?appointmentId=${appointment.id}&patientId=${appointment.patientId}&doctorId=${appointment.doctorId}&doctorName=${encodeURIComponent(appointment.doctorName)}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment. Please try again.');
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#503459] mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (selectedPatient) {
    return (
      <PatientProfile
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
        onAddRecord={handleAddRecord}
        showNewRecord={showNewRecord}
        onCloseRecord={() => setShowNewRecord(false)}
        onUpdate={handlePatientUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MediPulse Doctor Portal</h1>
                <p className="text-sm text-gray-600">Welcome, Dr. {user?.profile?.firstName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patients" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Patients</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Pending Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Records</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>Search and filter your patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterGender} onValueChange={setFilterGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterBloodType} onValueChange={setFilterBloodType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Blood Types</SelectItem>
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
              </CardContent>
            </Card>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
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
                      {patient.allergies.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600 font-medium">Allergies:</p>
                          <p className="text-xs text-red-600">{patient.allergies.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            {/* Debug info - remove in production */}
            {(() => {
              console.log('Appointments tab rendered');
              console.log('Total appointments:', appointments.length);
              console.log('Filtered appointments:', filteredAppointments.length);
              return null;
            })()}

            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Pending Appointments
                </CardTitle>
                <CardDescription>
                  Appointments waiting for your confirmation • 
                  



                  
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search pending appointments..."
                      value={appointmentSearchTerm}
                      onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="ml-auto">
                      {filteredAppointments.length} pending appointments
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                console.log('Rendering appointments grid with filteredAppointments:', filteredAppointments);
                return filteredAppointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {appointment.patientName}
                            </CardTitle>
                            <CardDescription>ID: {appointment.patientCardNumber}</CardDescription>
                            <div className="text-xs text-gray-500 mt-1">
                              Doctor: {appointment.doctorName}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={appointment.status === 'Confirmed' ? 'default' :
                                 appointment.status === 'Pending' ? 'secondary' :
                                 appointment.status === 'cancelled' ? 'destructive' : 'outline'}
                        >
                          {appointment.status === 'Confirmed' ? 'Confirmed' : appointment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {appointment.time}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="w-4 h-4 mr-2" />
                          {appointment.reason}
                        </div>
                        {appointment.hospitalName && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {appointment.hospitalName}
                          </div>
                        )}
                        <div className="flex items-center text-sm font-medium text-[#503459]">
                          <User className="w-4 h-4 mr-2" />
                          Assigned to: {appointment.doctorName}
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        {appointment.status === 'Pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleConfirmAppointment(appointment.id)}
                            >
                              <CheckCircle className="w-2 h-2 " />
                              Confirm Appointment
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openCancelDialog(appointment.id)}
                            >
                              <XCircle className="w-2 h-2 mr-1" />
                              Cancel 
                            </Button>
                          </>
                        )}
                        {appointment.status === 'Confirmed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewAppointment(appointment)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            
                          </>
                        )}
                        {appointment.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewAppointment(appointment)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Summary
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>

            {filteredAppointments.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending appointments</h3>
                  <p className="text-gray-600">
                    {appointmentSearchTerm
                      ? 'Try adjusting your search criteria'
                      : 'All appointments have been confirmed or no new appointments are waiting for your confirmation. Sample appointments are shown for testing.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Records</CardTitle>
                <CardDescription>View and manage patient health records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a patient first</h3>
                  <p className="text-gray-600">Go to the Patients tab and click on a patient to view their records</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {/* Doctor Profile Overview */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Dr. {user?.profile?.firstName} {user?.profile?.lastName}
                    </h2>
                    <p className="text-gray-600">Doctor ID: {user?.id}</p>
                    <p className="text-gray-600">Role: {user?.role}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="mb-2">Active</Badge>
                    <p className="text-sm text-gray-600">
                      Member since: {new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Personal Details</TabsTrigger>
                <TabsTrigger value="professional">Professional Info</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your personal details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Basic Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Full Name:</span>
                            <span className="ml-2">Dr. {user?.profile?.firstName} {user?.profile?.lastName}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Email:</span>
                            <span className="ml-2">{user?.email || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Phone:</span>
                            <span className="ml-2">{user?.profile?.phone || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3">Personal Details</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Date of Birth:</span>
                            <span className="ml-2">
                              {user?.profile?.dateOfBirth ? new Date(user.profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Gender:</span>
                            <span className="ml-2">{user?.profile?.gender || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Address:</span>
                            <span className="ml-2">{user?.profile?.address || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="professional" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                    <CardDescription>Your professional credentials and hospital details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Professional Details</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Username:</span>
                            <span className="ml-2">{user?.username || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Specialization:</span>
                            <span className="ml-2">General Medicine</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">License Number:</span>
                            <span className="ml-2">DOC{user?.id?.slice(-6) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3">Hospital Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Hospital:</span>
                            <span className="ml-2">MediPulse General Hospital</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Department:</span>
                            <span className="ml-2">Internal Medicine</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">Working Hours:</span>
                            <span className="ml-2">9:00 AM - 5:00 PM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                    <CardDescription>Manage your account settings and security</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center space-x-3">
                      <Button className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Alert Dialog for Appointment Cancellation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelAppointment}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// New Health Record Component
const NewHealthRecord = ({ patient, onClose }: { patient: Patient; onClose: () => void }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await apiService.healthRecords.create({
        patientId: patient.id,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        prescription: formData.prescription,
        notes: formData.notes
      });

      onClose();
    } catch (err: any) {
      console.error('Error creating health record:', err);
      setError(err.message || 'Failed to create health record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onClose}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Patient Profile
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">New Health Record</h1>
                <p className="text-sm text-gray-600">{patient.firstName} {patient.lastName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Health Record</CardTitle>
            <CardDescription>
              Date: {new Date().toLocaleDateString()} • Doctor: Dr. {user?.profile?.firstName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Diagnosis</label>
                <Input
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Treatment</label>
                <Input
                  value={formData.treatment}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                  placeholder="Enter treatment details..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prescription</label>
                <Input
                  value={formData.prescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, prescription: e.target.value }))}
                  placeholder="Enter prescription details..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Doctor Notes</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#503459] focus:border-transparent"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Record'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Patient Profile Component
const PatientProfile = ({
  patient,
  onBack,
  onAddRecord,
  showNewRecord,
  onCloseRecord,
  onUpdate
}: {
  patient: Patient;
  onBack: () => void;
  onAddRecord: () => void;
  showNewRecord: boolean;
  onCloseRecord: () => void;
  onUpdate?: (updatedPatient: Patient) => void;
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editRecordForm, setEditRecordForm] = useState({
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: ''
  });
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const loadHealthRecords = async () => {
      try {
        setLoading(true);
        const response = await apiService.healthRecords.getByPatient(patient.id);
        const recordsData = (response.data as any).records || response.data;
        const formattedRecords = recordsData.map((record: any) => ({
          id: record._id,
          patientId: patient.id,
          date: record.date,
          doctorName: `Dr. ${record.doctor?.user?.profile?.firstName || 'Unknown'} ${record.doctor?.user?.profile?.lastName || ''}`,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          prescription: record.prescription,
          notes: record.notes
        }));
        setHealthRecords(formattedRecords);
      } catch (error) {
        console.error('Error loading health records:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHealthRecords();
  }, [patient.id]);

  const handleDeleteHealthRecord = async (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteHealthRecord = async () => {
    if (!recordToDelete) return;

    try {
      setLoading(true);
      await apiService.healthRecords.delete(recordToDelete);

      // Update local state to remove the deleted record
      setHealthRecords(prev => prev.filter(record => record.id !== recordToDelete));

      console.log('Health record deleted successfully');
    } catch (error) {
      console.error('Error deleting health record:', error);
      // Show error toast or notification instead of alert
      setError && setError('Failed to delete health record. Please try again.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleStartEditRecord = (record: HealthRecord) => {
    setEditingRecordId(record.id);
    setEditRecordForm({
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription,
      notes: record.notes
    });
  };

  const handleSaveEditRecord = async (recordId: string) => {
    try {
      await apiService.healthRecords.update(recordId, {
        diagnosis: editRecordForm.diagnosis,
        treatment: editRecordForm.treatment,
        prescription: editRecordForm.prescription,
        notes: editRecordForm.notes
      });

      // Update local state to reflect the changes
      setHealthRecords(prev => prev.map(record =>
        record.id === recordId
          ? {
              ...record,
              diagnosis: editRecordForm.diagnosis,
              treatment: editRecordForm.treatment,
              prescription: editRecordForm.prescription,
              notes: editRecordForm.notes
            }
          : record
      ));

      setEditingRecordId(null);
    } catch (error) {
      console.error('Error updating health record:', error);
      alert('Failed to update health record. Please try again.');
    }
  };

  const handleCancelEditRecord = () => {
    setEditingRecordId(null);
    setEditRecordForm({
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: ''
    });
  };

  if (showNewRecord) {
    return <NewHealthRecord patient={patient} onClose={onCloseRecord} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Patients
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-sm text-gray-600">Patient ID: {patient.cardNumber}</p>
              </div>
            </div>
            <Button 
              className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
              onClick={onAddRecord}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Record
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Overview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-gray-600">Age: {getAge(patient.dateOfBirth)} years</p>
                <p className="text-gray-600">ID: {patient.cardNumber}</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-2">{patient.bloodType}</Badge>
                <p className="text-sm text-gray-600">
                  Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal Details</TabsTrigger>
            <TabsTrigger value="records">Health Records</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{patient.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{patient.address}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Medical Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Date of Birth:</span> {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {patient.gender}
                      </div>
                      <div>
                        <span className="font-medium">Blood Type:</span> {patient.bloodType}
                      </div>
                      <div>
                        <span className="font-medium">Emergency Contact:</span> {patient.emergencyContact}
                      </div>
                    </div>
                  </div>
                </div>
                {patient.allergies.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Allergies</h3>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        onClick={() => setError(null)}
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-6">
              {healthRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {editingRecordId === record.id ? (
                            <Input
                              value={editRecordForm.diagnosis}
                              onChange={(e) => setEditRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                              placeholder="Enter diagnosis..."
                              className="text-lg font-semibold"
                            />
                          ) : (
                            record.diagnosis
                          )}
                        </CardTitle>
                        <CardDescription>
                          {new Date(record.date).toLocaleDateString()} • {record.doctorName}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        {editingRecordId === record.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelEditRecord()}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                              onClick={() => handleSaveEditRecord(record.id)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEditRecord(record)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteHealthRecord(record.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {loading ? 'Deleting...' : 'Delete'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Diagnosis</h4>
                        {editingRecordId === record.id ? (
                          <Textarea
                            value={editRecordForm.diagnosis}
                            onChange={(e) => setEditRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                            placeholder="Enter diagnosis..."
                            rows={2}
                          />
                        ) : (
                          <p className="text-gray-700">{record.diagnosis}</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Treatment</h4>
                        {editingRecordId === record.id ? (
                          <Textarea
                            value={editRecordForm.treatment}
                            onChange={(e) => setEditRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                            placeholder="Enter treatment details..."
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-700">{record.treatment}</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Prescription</h4>
                        {editingRecordId === record.id ? (
                          <Textarea
                            value={editRecordForm.prescription}
                            onChange={(e) => setEditRecordForm(prev => ({ ...prev, prescription: e.target.value }))}
                            placeholder="Enter prescription details..."
                            rows={2}
                          />
                        ) : (
                          <p className="text-gray-700">{record.prescription}</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Doctor Notes</h4>
                        {editingRecordId === record.id ? (
                          <Textarea
                            value={editRecordForm.notes}
                            onChange={(e) => setEditRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Enter additional notes..."
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-700">{record.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {healthRecords.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No health records found</h3>
                  <p className="text-gray-600">Start by adding a new health record for this patient</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Health Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this health record? This action cannot be undone and will permanently remove all associated medical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteHealthRecord}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? 'Deleting...' : 'Delete Record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorPortal;

