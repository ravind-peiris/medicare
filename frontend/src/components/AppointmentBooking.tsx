import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Doctor, Appointment, Patient, mockDoctors, mockAppointments, mockPatients } from '@/lib/mockData';
import { useAuth } from './UserAuth';
import DigitalHealthCard from './DigitalHealthCard';

const AppointmentBooking: React.FC = () => {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    // If user is a patient, load their info and skip scanner
    if (user?.role === 'Patient' && user.patientId) {
      const patient = mockPatients.find(p => p.id === user.patientId);
      if (patient) {
        setSelectedPatient(patient);
        setShowScanner(false);
      }
    }
  }, [user]);

  const handlePatientFound = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowScanner(false);
  };

  const getAvailableTimeSlots = (doctor: Doctor, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return doctor.availability
      .filter(slot => slot.date === dateStr && slot.available)
      .map(slot => slot.time);
  };

  const handleBookAppointment = () => {
    if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime || !appointmentReason) {
      setNotification({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    const newAppointment: Appointment = {
      id: `A${Date.now()}`,
      patientId: selectedPatient.id,
      doctorId: selectedDoctor.id,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      status: 'Scheduled',
      reason: appointmentReason
    };

    setAppointments(prev => [...prev, newAppointment]);
    
    // Update doctor availability
    const updatedDoctor = {
      ...selectedDoctor,
      availability: selectedDoctor.availability.map(slot => 
        slot.date === newAppointment.date && slot.time === newAppointment.time
          ? { ...slot, available: false }
          : slot
      )
    };

    setNotification({ 
      type: 'success', 
      message: `Appointment booked successfully! Confirmation sent via SMS/Email.` 
    });
    
    // Reset form
    setSelectedDoctor(null);
    setSelectedTime('');
    setAppointmentReason('');
    setShowBooking(false);

    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'Cancelled' as const }
          : apt
      )
    );
    setNotification({ type: 'success', message: 'Appointment cancelled successfully' });
    setTimeout(() => setNotification(null), 3000);
  };

  const getPatientAppointments = () => {
    if (!selectedPatient) return [];
    return appointments.filter(apt => apt.patientId === selectedPatient.id);
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = mockDoctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Unknown Doctor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showScanner && user?.role === 'Staff') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointment Management</h2>
            <p className="text-gray-600">Book and manage patient appointments</p>
          </div>
        </div>
        
        <DigitalHealthCard 
          onPatientFound={handlePatientFound}
          onScanComplete={() => setShowScanner(false)}
        />
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No patient selected. Please scan a digital health card first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointment Management</h2>
          <p className="text-gray-600">
            {user?.role === 'Patient' ? 'Manage your appointments' : 'Book and manage patient appointments'}
          </p>
        </div>
        <div className="flex space-x-2">
          {user?.role === 'Staff' && (
            <Button 
              onClick={() => setShowScanner(true)}
              variant="outline"
            >
              Scan New Card
            </Button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Alert className={notification.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Patient Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-600 text-white p-3 rounded-full">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </CardTitle>
                <CardDescription className="text-green-700">
                  Card: {selectedPatient.cardNumber} • Phone: {selectedPatient.phone}
                </CardDescription>
              </div>
            </div>
            <Dialog open={showBooking} onOpenChange={setShowBooking}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>Book Appointment</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Book New Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Doctor Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Doctor/Department</label>
                    <div className="grid grid-cols-1 gap-2">
                      {mockDoctors.map((doctor) => (
                        <Card 
                          key={doctor.id}
                          className={`cursor-pointer transition-colors ${
                            selectedDoctor?.id === doctor.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3">
                              <Stethoscope className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{doctor.name}</p>
                                <p className="text-sm text-gray-600">{doctor.specialization} • {doctor.department}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Date Selection */}
                  {selectedDoctor && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Date</label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                        className="rounded-md border"
                      />
                    </div>
                  )}

                  {/* Time Selection */}
                  {selectedDoctor && selectedDate && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Available Time Slots</label>
                      <div className="grid grid-cols-3 gap-2">
                        {getAvailableTimeSlots(selectedDoctor, selectedDate).map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {time}
                          </Button>
                        ))}
                      </div>
                      {getAvailableTimeSlots(selectedDoctor, selectedDate).length === 0 && (
                        <p className="text-sm text-gray-500">No available slots for this date</p>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  {selectedTime && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reason for Visit</label>
                      <Textarea
                        placeholder="Describe the reason for your appointment..."
                        value={appointmentReason}
                        onChange={(e) => setAppointmentReason(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Book Button */}
                  <Button 
                    onClick={handleBookAppointment}
                    className="w-full"
                    disabled={!selectedDoctor || !selectedDate || !selectedTime || !appointmentReason}
                  >
                    Book Appointment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Appointments List */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getPatientAppointments()
                  .filter(apt => apt.status === 'Scheduled')
                  .map((appointment) => (
                    <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                              <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{getDoctorName(appointment.doctorId)}</p>
                              <p className="text-sm text-gray-600">{appointment.reason}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{appointment.date}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{appointment.time}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelAppointment(appointment.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {getPatientAppointments().filter(apt => apt.status === 'Scheduled').length === 0 && (
                  <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Appointments</CardTitle>
              <CardDescription>Your appointment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getPatientAppointments()
                  .filter(apt => apt.status === 'Completed')
                  .map((appointment) => (
                    <Card key={appointment.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-green-100 text-green-600 p-2 rounded-full">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{getDoctorName(appointment.doctorId)}</p>
                              <p className="text-sm text-gray-600">{appointment.reason}</p>
                              {appointment.notes && (
                                <p className="text-sm text-green-600 mt-1">Notes: {appointment.notes}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{appointment.date}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{appointment.time}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {getPatientAppointments().filter(apt => apt.status === 'Completed').length === 0 && (
                  <p className="text-gray-500 text-center py-8">No completed appointments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cancelled Appointments</CardTitle>
              <CardDescription>Previously cancelled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getPatientAppointments()
                  .filter(apt => apt.status === 'Cancelled')
                  .map((appointment) => (
                    <Card key={appointment.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-red-100 text-red-600 p-2 rounded-full">
                              <XCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{getDoctorName(appointment.doctorId)}</p>
                              <p className="text-sm text-gray-600">{appointment.reason}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{appointment.date}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{appointment.time}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {getPatientAppointments().filter(apt => apt.status === 'Cancelled').length === 0 && (
                  <p className="text-gray-500 text-center py-8">No cancelled appointments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppointmentBooking;