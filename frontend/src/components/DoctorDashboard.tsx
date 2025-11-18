import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  Bell, 
  Stethoscope,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Plus,
  Settings
} from 'lucide-react';
import { useAuth } from '@/components/UserAuth';
import apiService from '@/lib/apiService';

interface Patient {
  id: string;
  cardNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: MedicalRecord[];
}

interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'Diagnosis' | 'Prescription' | 'Test Result' | 'Treatment';
  description: string;
  doctor: string;
  department: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  reason: string;
  notes?: string;
}

interface Notification {
  id: string;
  type: 'appointment' | 'patient_update' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewRecord, setShowNewRecord] = useState(false);

  // New Health Record Component
  const NewHealthRecord = ({
    patient,
    onClose,
    onSubmit
  }: {
    patient: Patient;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
  }) => {
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
        await onSubmit(formData);
      } catch (err: any) {
        setError(err.message || 'Failed to create health record');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">New Health Record</h2>
            <p className="text-gray-600">For: {patient.firstName} {patient.lastName}</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Back to Records
          </Button>
        </div>

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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Record'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch appointments
      const appointmentsRes = await fetch('http://localhost:5000/api/appointments', { headers });
      const appointmentsData = await appointmentsRes.json();
      setAppointments(appointmentsData.data?.appointments || []);

      // Fetch patients
      const patientsRes = await fetch('http://localhost:5000/api/patients', { headers });
      const patientsData = await patientsRes.json();
      setPatients(patientsData.data?.patients || []);

      // Fetch medical records
      const recordsRes = await fetch('http://localhost:5000/api/health-records', { headers });
      const recordsData = await recordsRes.json();
      setMedicalRecords(recordsData.data?.records || []);

      // Mock notifications for now
      setNotifications([
        {
          id: '1',
          type: 'appointment',
          title: 'New Appointment Request',
          message: 'John Doe requested an appointment for tomorrow at 2:00 PM',
          timestamp: '2024-01-15T10:30:00Z',
          read: false
        },
        {
          id: '2',
          type: 'patient_update',
          title: 'Patient Update',
          message: 'Jane Smith updated her medical information',
          timestamp: '2024-01-15T09:15:00Z',
          read: false
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleViewPatientRecords = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('records');
  };

  const handleAddRecord = (patient?: Patient) => {
    if (patient) {
      setSelectedPatient(patient);
    }
    setShowNewRecord(true);
  };

  const handleCloseRecord = () => {
    setShowNewRecord(false);
    setSelectedPatient(null);
    fetchDashboardData(); // Refresh data after adding record
  };

  const handleCreateRecord = async (recordData: any) => {
    try {
      await apiService.healthRecords.create({
        patientId: selectedPatient?.id || '',
        ...recordData
      });
      handleCloseRecord();
    } catch (error) {
      console.error('Error creating health record:', error);
      throw error;
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action === 'confirm' ? 'Confirmed' : 'Cancelled',
          ...(action === 'reject' && { cancellationReason: 'Doctor unavailable' })
        })
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const todayAppointments = appointments.filter(apt => 
    new Date(apt.date).toDateString() === new Date().toDateString()
  );

  const pendingAppointments = appointments.filter(apt => 
    apt.status === 'Scheduled'
  );

  const unreadNotifications = notifications.filter(notif => !notif.read);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {unreadNotifications.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {todayAppointments.filter(apt => apt.status === 'Completed').length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground">
                Active patients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadNotifications.length}</div>
              <p className="text-xs text-muted-foreground">
                Unread messages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>Your appointments for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todayAppointments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No appointments scheduled for today</p>
                    ) : (
                      todayAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{appointment.patientName}</p>
                            <p className="text-sm text-gray-600">{appointment.time}</p>
                            <p className="text-xs text-gray-500">{appointment.reason}</p>
                          </div>
                          <Badge variant={
                            appointment.status === 'Completed' ? 'default' :
                            appointment.status === 'Confirmed' ? 'secondary' :
                            'outline'
                          }>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>Latest updates and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Appointment Management</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>Appointments awaiting your confirmation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingAppointments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No pending appointment requests</p>
                    ) : (
                      pendingAppointments.map((appointment) => (
                        <div key={appointment.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium">{appointment.patientName}</p>
                              <p className="text-sm text-gray-600">{appointment.date} at {appointment.time}</p>
                              <p className="text-xs text-gray-500 mt-1">{appointment.reason}</p>
                            </div>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAppointmentAction(appointment.id, 'reject')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your confirmed appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointments.filter(apt => apt.status === 'Confirmed').length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
                    ) : (
                      appointments
                        .filter(apt => apt.status === 'Confirmed')
                        .slice(0, 5)
                        .map((appointment) => (
                        <div key={appointment.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{appointment.patientName}</p>
                              <p className="text-sm text-gray-600">{appointment.date} at {appointment.time}</p>
                              <p className="text-xs text-gray-500 mt-1">{appointment.reason}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Patient Management</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Patient List</CardTitle>
                <CardDescription>View and manage your patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                          <p className="text-sm text-gray-600">Card: {patient.cardNumber}</p>
                          <p className="text-xs text-gray-500">{patient.bloodType} • {patient.allergies.length} allergies</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewPatientRecords(patient)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Records
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAddRecord(patient)}>
                          <FileText className="w-4 h-4 mr-1" />
                          Add Record
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="records" className="space-y-6">
            {showNewRecord && selectedPatient ? (
              <NewHealthRecord
                patient={selectedPatient}
                onClose={handleCloseRecord}
                onSubmit={handleCreateRecord}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Medical Records</h2>
                  <Button onClick={() => setShowNewRecord(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Medical records management allows you to securely view, update, and add patient information.
                    All actions are logged and require proper authentication.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Records</CardTitle>
                      <CardDescription>Latest medical records you've updated</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {medicalRecords.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No recent records</p>
                        ) : (
                          medicalRecords.slice(0, 5).map((record) => (
                            <div key={record.id} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-sm">{record.description}</p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(record.date).toLocaleDateString()} • {record.type}
                                  </p>
                                </div>
                                <Badge variant="outline">{record.type}</Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                Patient ID: {record.patientId} • Dr. {record.doctor}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common medical record tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Add Diagnosis
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Add Prescription
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Add Test Results
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Add Treatment Notes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Schedule Management</h2>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Manage Availability
              </Button>
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Manage your availability schedule to allow patients to book appointments during your preferred times.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Your availability for the current week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="text-center">
                      <p className="font-medium mb-2">{day}</p>
                      <div className="space-y-1">
                        <div className="p-2 bg-green-100 text-green-800 rounded text-xs">
                          9:00 AM - 12:00 PM
                        </div>
                        <div className="p-2 bg-green-100 text-green-800 rounded text-xs">
                          2:00 PM - 5:00 PM
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;

