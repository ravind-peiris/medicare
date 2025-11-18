import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Users, 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Heart,
  ArrowLeft,
  User,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  Building
} from 'lucide-react';
import { useAuth } from '@/components/UserAuth';
import { useNavigate } from 'react-router-dom';

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show';
  hospital: string;
  type: 'Government' | 'Private';
  notes?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  availableSlots: string[];
  isAvailable: boolean;
  currentPatient?: string;
}

const ReceptionistPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDoctor, setFilterDoctor] = useState('all');

  // Mock data
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      patientName: 'John Doe',
      patientPhone: '0712345678',
      doctorName: 'Dr. Sarah Wilson',
      doctorSpecialization: 'Cardiologist',
      date: '2024-02-15',
      time: '10:00 AM',
      status: 'Scheduled',
      hospital: 'City Medical Center',
      type: 'Private',
      notes: 'First time patient'
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientPhone: '0712345679',
      doctorName: 'Dr. Michael Chen',
      doctorSpecialization: 'General Physician',
      date: '2024-02-15',
      time: '11:00 AM',
      status: 'Confirmed',
      hospital: 'Government Hospital',
      type: 'Government',
      notes: 'Follow-up appointment'
    },
    {
      id: '3',
      patientName: 'Michael Johnson',
      patientPhone: '0712345680',
      doctorName: 'Dr. Lisa Rodriguez',
      doctorSpecialization: 'Dermatologist',
      date: '2024-02-14',
      time: '02:30 PM',
      status: 'Completed',
      hospital: 'Private Clinic',
      type: 'Private',
      notes: 'Skin consultation completed'
    },
    {
      id: '4',
      patientName: 'Sarah Williams',
      patientPhone: '0712345681',
      doctorName: 'Dr. Sarah Wilson',
      doctorSpecialization: 'Cardiologist',
      date: '2024-02-14',
      time: '03:00 PM',
      status: 'No Show',
      hospital: 'City Medical Center',
      type: 'Private',
      notes: 'Patient did not arrive'
    }
  ];

  const mockDoctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      specialization: 'Cardiologist',
      hospital: 'City Medical Center',
      availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      isAvailable: true
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialization: 'General Physician',
      hospital: 'Government Hospital',
      availableSlots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      isAvailable: true
    },
    {
      id: '3',
      name: 'Dr. Lisa Rodriguez',
      specialization: 'Dermatologist',
      hospital: 'Private Clinic',
      availableSlots: ['09:00', '10:00', '11:00', '14:00'],
      isAvailable: false,
      currentPatient: 'Michael Johnson'
    },
    {
      id: '4',
      name: 'Dr. James Anderson',
      specialization: 'Orthopedist',
      hospital: 'City Medical Center',
      availableSlots: ['08:00', '09:00', '14:00', '15:00', '16:00'],
      isAvailable: true
    }
  ];

  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(mockAppointments);

  useEffect(() => {
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === filterStatus);
    }

    // Doctor filter
    if (filterDoctor !== 'all') {
      filtered = filtered.filter(appointment => appointment.doctorName === filterDoctor);
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, filterStatus, filterDoctor]);

  const handleStatusUpdate = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(appointment =>
      appointment.id === appointmentId
        ? { ...appointment, status: newStatus }
        : appointment
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'No Show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'No Show':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getAvailabilityStatus = (doctor: Doctor) => {
    if (!doctor.isAvailable) {
      return { text: 'Busy', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> };
    }
    return { text: 'Available', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
  };

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
                <h1 className="text-xl font-bold text-gray-900">MediPulse Receptionist Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.profile?.firstName}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center space-x-2">
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Availability</span>
            </TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Management</CardTitle>
                <CardDescription>Monitor and manage all appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="No Show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {doctors.map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.name}>{doctor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Appointments List */}
            <div className="grid grid-cols-1 gap-6">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{appointment.patientName}</h3>
                          <p className="text-gray-600">{appointment.doctorName} - {appointment.doctorSpecialization}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{new Date(appointment.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center">
                              <Building className="w-4 h-4 mr-1" />
                              <span>{appointment.hospital}</span>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Phone className="w-4 h-4 mr-1" />
                            <span>{appointment.patientPhone}</span>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-1 italic">"{appointment.notes}"</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(appointment.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{appointment.status}</span>
                          </div>
                        </Badge>
                        <div className="mt-3 space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <div className="mt-2 space-x-1">
                          {appointment.status === 'Scheduled' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleStatusUpdate(appointment.id, 'Confirmed')}
                              >
                                Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleStatusUpdate(appointment.id, 'Cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {appointment.status === 'Confirmed' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleStatusUpdate(appointment.id, 'Completed')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Availability</h2>
              <p className="text-gray-600">Monitor doctor schedules and availability</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {doctors.map((doctor) => {
                const availability = getAvailabilityStatus(doctor);
                return (
                  <Card key={doctor.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                            <Stethoscope className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{doctor.name}</h3>
                            <p className="text-gray-600">{doctor.specialization}</p>
                            <p className="text-sm text-gray-500">{doctor.hospital}</p>
                          </div>
                        </div>
                        <Badge className={availability.color}>
                          <div className="flex items-center">
                            {availability.icon}
                            <span className="ml-1">{availability.text}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      {!doctor.isAvailable && doctor.currentPatient && (
                        <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <strong>Currently with:</strong> {doctor.currentPatient}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2">Available Time Slots:</h4>
                        <div className="flex flex-wrap gap-2">
                          {doctor.availableSlots.map((slot, index) => (
                            <Badge key={index} variant="secondary">
                              {slot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book New Appointment</CardTitle>
                <CardDescription>Help patients schedule appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment Booking</h3>
                  <p className="text-gray-600 mb-6">Use the comprehensive booking system to schedule appointments for patients</p>
                  <Button className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Open Booking System
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Confirmations</p>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed Today</p>
                      <p className="text-2xl font-bold text-gray-900">16</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">No Shows</p>
                      <p className="text-2xl font-bold text-gray-900">2</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReceptionistPortal;

