import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
  Calendar, 
  FileText, 
  CreditCard, 
  Phone,
  Heart,
  User,
  MapPin,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  Download,
  ArrowLeft,
  Camera,
  Edit,
  QrCode,
  LogOut,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/components/UserAuth';
import { useNavigate } from 'react-router-dom';
import AppointmentBookingSystem from '@/components/AppointmentBookingSystem';
import apiService from '@/lib/apiService';

interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending' | 'Confirmed' | 'In Progress' | 'Rescheduled';
  hospital: string;
  type: 'Government' | 'Private';
  fee?: number;
  // Add fields for editing
  doctorId?: string;
  reason?: string;
}

interface HealthRecord {
  id: string;
  date: string;
  doctorName: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  notes: string;
}

interface Bill {
  id: string;
  appointmentId: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  dueDate: string;
  description: string;
  hospital?: string;
  hospitalFee?: number;
  doctorName?: string;
  consultantFee?: number;
}

interface AppointmentData {
  id: string;
  date: string;
  time: string;
  doctorId: string;
  patientId: string;
  status: string;
  // add other appointment fields as needed
}

interface ErrorResponse {
  message: string;
  errors?: Array<{ msg: string }>;
}

interface ApiError {
  message: string;
  errors?: Array<{ msg: string }>;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

const PatientPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showBookingSystem, setShowBookingSystem] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });
  const [form, setForm] = useState<any>({
    bloodType: '',
    allergies: '' as any,
    insurance: { provider: '', policyNumber: '', coverageType: '', expiryDate: '' },
    emergencyContacts: [{ name: '', relationship: '', phone: '', email: '' }]
  });

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['profile', 'appointments', 'health-records', 'bills', 'health-card', 'support'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Mock data
  const mockAppointments: Appointment[] = [
    {
      id: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId format
      doctorName: 'Dr. Sarah Wilson',
      doctorSpecialization: 'Cardiologist',
      date: '2024-02-15',
      time: '10:00 AM',
      status: 'Scheduled',
      hospital: 'City Medical Center',
      type: 'Private',
      fee: 5000,
      doctorId: 'doctor1',
      reason: 'Regular checkup'
    },
    {
      id: '507f1f77bcf86cd799439012',
      doctorName: 'Dr. Michael Chen',
      doctorSpecialization: 'General Physician',
      date: '2024-01-20',
      time: '2:30 PM',
      status: 'Completed',
      hospital: 'Government Hospital',
      type: 'Government',
      doctorId: 'doctor2',
      reason: 'Follow-up consultation'
    },
    {
      id: '507f1f77bcf86cd799439013',
      doctorName: 'Dr. Lisa Rodriguez',
      doctorSpecialization: 'Dermatologist',
      date: '2024-01-10',
      time: '11:00 AM',
      status: 'Pending',
      hospital: 'Private Clinic',
      type: 'Private',
      fee: 3000,
      doctorId: 'doctor3',
      reason: 'Skin consultation'
    }
  ];

  const mockHealthRecords: HealthRecord[] = [
    {
      id: '507f1f77bcf86cd799439014',
      date: '2024-01-20',
      doctorName: 'Dr. Michael Chen',
      diagnosis: 'Common Cold',
      treatment: 'Rest, hydration, over-the-counter medication',
      prescription: 'Paracetamol 500mg every 6 hours',
      notes: 'Patient advised to rest and drink plenty of fluids'
    },
    {
      id: '507f1f77bcf86cd799439015',
      date: '2024-01-10',
      doctorName: 'Dr. Lisa Rodriguez',
      diagnosis: 'Skin Rash',
      treatment: 'Topical cream application',
      prescription: 'Hydrocortisone cream twice daily',
      notes: 'Rash should clear within 1-2 weeks'
    }
  ];

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load patient profile data
        const patientResponse = await apiService.patients.getMe();
        const patient = (patientResponse.data as any).patient || patientResponse.data;
        setPatientData(patient);

        // Load appointments (supports different API shapes)
        const appointmentsResponse = await apiService.appointments.getAll(1, 50);
        const rawAppointments: any = (appointmentsResponse as any)?.data;
        const appointmentsData: any[] = Array.isArray(rawAppointments)
          ? rawAppointments
          : (rawAppointments?.appointments || rawAppointments?.data || []);
        if (!Array.isArray(appointmentsData)) {
          throw new Error('Invalid appointments data received from server');
        }
        const formattedAppointments: Appointment[] = appointmentsData.map((apt: any) => ({
          id: apt._id,
          doctorName: apt.doctor?.user?.profile
            ? `${apt.doctor.user.profile.firstName} ${apt.doctor.user.profile.lastName}`
            : 'Unknown Doctor',
          doctorSpecialization: apt.doctor?.specialization || 'General',
          date: apt.date,
          time: apt.time,
          status: apt.status === 'confirmed' ? 'Scheduled' : apt.status,
          hospital: apt.hospital?.name || 'Not specified',
          type: apt.hospital?.type === 'Government' ? 'Government' : 'Private',
          fee: apt.consultationFee || apt.fee,
          doctorId: apt.doctor?._id,
          reason: apt.reason || ''
        }));
        setAppointments(formattedAppointments);

        // Load health records using the new health records API
        const healthRecordsResponse = await apiService.healthRecords.getMe();
        const recordsData = (healthRecordsResponse.data as any).records || healthRecordsResponse.data;
        const formattedHealthRecords = recordsData.map((record: any) => ({
          id: record._id,
          date: record.date,
          doctorName: record.doctor?.user?.profile ? 
            `Dr. ${record.doctor.user.profile.firstName} ${record.doctor.user.profile.lastName}` : 
            'Unknown Doctor',
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          prescription: record.prescription,
          notes: record.notes
        }));
        setHealthRecords(formattedHealthRecords);

        // Load bills
        const billsResponse = await apiService.bills.getAll(1, 50);
        const billsData = (billsResponse.data as any).bills || billsResponse.data;
        const formattedBills = billsData.map((bill: any) => ({
          id: bill._id,
          appointmentId: bill.appointment?._id || '',
          amount: bill.totalAmount,
          status: bill.status,
          dueDate: bill.dueDate,
          description: bill.items?.[0]?.description || 'Medical Services',
          hospital: bill.appointment?.hospital?.name || 'MediPulse General Hospital',
          hospitalFee: bill.hospitalFee || 1000,
          doctorName: bill.appointment?.doctor?.user?.profile ? 
            `Dr. ${bill.appointment.doctor.user.profile.firstName} ${bill.appointment.doctor.user.profile.lastName}` : 
            'Dr. Unknown',
          consultantFee: bill.consultantFee || 3000
        }));
        setBills(formattedBills);

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Initialize form from loaded patient data when entering edit mode
  useEffect(() => {
    if (editing && patientData) {
      setForm({
        bloodType: patientData.bloodType || '',
        allergies: Array.isArray(patientData.allergies) ? patientData.allergies.join(', ') : (patientData.allergies || ''),
        insurance: {
          provider: patientData.insurance?.provider || '',
          policyNumber: patientData.insurance?.policyNumber || '',
          coverageType: patientData.insurance?.coverageType || '',
          expiryDate: patientData.insurance?.expiryDate ? new Date(patientData.insurance.expiryDate).toISOString().slice(0,10) : ''
        },
        emergencyContacts: patientData.emergencyContacts?.length ? [{
          name: patientData.emergencyContacts[0].name || '',
          relationship: patientData.emergencyContacts[0].relationship || '',
          phone: patientData.emergencyContacts[0].phone || '',
          email: patientData.emergencyContacts[0].email || ''
        }] : [{ name: '', relationship: '', phone: '', email: '' }]
      });
    }
  }, [editing, patientData]);

  const onChangeForm = (path: string, value: any) => {
    setForm((prev: any) => {
      const next = { ...prev };
      const parts = path.split('.');
      let ref = next;
      for (let i = 0; i < parts.length - 1; i++) ref = ref[parts[i]];
      ref[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const saveProfile = async () => {
    if (!patientData?._id) return;
    try {
      setSaving(true);
      const payload: any = {
        bloodType: form.bloodType || undefined,
        allergies: typeof form.allergies === 'string' ? form.allergies.split(',').map((s: string) => s.trim()).filter(Boolean) : form.allergies,
        insurance: {
          provider: form.insurance.provider || undefined,
          policyNumber: form.insurance.policyNumber || undefined,
          coverageType: form.insurance.coverageType || undefined,
          expiryDate: form.insurance.expiryDate || undefined
        },
        emergencyContacts: form.emergencyContacts?.length ? [form.emergencyContacts[0]] : []
      };
      await apiService.patients.update(patientData._id, payload);
      // Refresh local patient data view
      const updated = {
        ...patientData,
        bloodType: payload.bloodType ?? patientData.bloodType,
        allergies: payload.allergies ?? patientData.allergies,
        insurance: { ...(patientData.insurance || {}), ...payload.insurance },
        emergencyContacts: payload.emergencyContacts ?? patientData.emergencyContacts
      };
      setPatientData(updated);
      setEditing(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApiError = (error: ErrorResponse) => {
    if (error.errors && error.errors.length > 0) {
      return error.errors.map(err => err.msg).join(', ');
    }
    return error.message || 'An error occurred';
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data: ApiResponse<Appointment[]> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch appointments');
      }
      
      // Handle the appointments data
      setAppointments(data.data);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to fetch appointments');
    }
  };

  if (showBookingSystem) {
    return <AppointmentBookingSystem onBack={() => setShowBookingSystem(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#503459] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-purple-100 text-purple-800';
      case 'Rescheduled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearError = () => {
    setError(null);
  };

  const handleViewAppointment = (id: string) => {
    clearError();
    navigate(`/appointments/${id}`);
  };

  const openEditDialog = (appointment: Appointment) => {
    clearError();
    if (appointment.status !== 'Pending') {
      return; // Only allow editing of pending appointments
    }
    setAppointmentToEdit(appointment);
    setEditForm({
      doctorId: appointment.doctorId || '',
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason || ''
    });
    setEditDialogOpen(true);
  };

  const openCancelDialog = (id: string) => {
    clearError();
    setSelectedAppointmentId(id);
    setCancelDialogOpen(true);
  };

  const handleEditAppointment = async () => {
    if (!appointmentToEdit) return;

    try {
      setSaving(true);

      // Update the appointment via API
      await apiService.appointments.update(appointmentToEdit.id, {
        doctor: editForm.doctorId,
        date: editForm.date,
        time: editForm.time,
        reason: editForm.reason
      });

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentToEdit.id
            ? {
                ...apt,
                doctorId: editForm.doctorId,
                date: editForm.date,
                time: editForm.time,
                reason: editForm.reason
              }
            : apt
        )
      );

      setEditDialogOpen(false);
      setAppointmentToEdit(null);
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointmentId) return;

    try {
      setLoading(true);
      await apiService.appointments.cancel(selectedAppointmentId, 'Cancelled by patient');

      // Update local state to reflect the cancellation
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointmentId
            ? { ...apt, status: 'Cancelled' as const }
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

  const openDeleteDialog = (id: string) => {
    setSelectedAppointmentId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAppointment = async () => {
    if (!selectedAppointmentId) return;

    try {
      setLoading(true);
      console.log('Attempting to delete appointment with ID:', selectedAppointmentId);

      // Call delete API - the apiService should handle the API call
      await apiService.appointments.delete(selectedAppointmentId);

      // Remove the appointment from local state only after successful API deletion
      setAppointments(prev => prev.filter(apt => apt.id !== selectedAppointmentId));

      setDeleteDialogOpen(false);
      setSelectedAppointmentId(null);
    } catch (error: any) {
      console.error('Error deleting appointment:', error);

      // Only remove from local state if the appointment was not found (404)
      // This suggests it was already deleted from the database
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setError('Appointment not found. It may have already been deleted.');
        // Remove from local state since it's not found on server
        setAppointments(prev => prev.filter(apt => apt.id !== selectedAppointmentId));
      } else if (error.message?.includes('403') || error.message?.includes('unauthorized')) {
        setError('You are not authorized to delete this appointment.');
        // Do NOT remove from local state - user should still see the appointment
      } else if (error.message?.includes('Validation failed')) {
        // If it's a validation error (likely invalid ID format), just close dialog
        console.log('Validation error detected, keeping appointment in local state');
        setError('Invalid appointment ID. Please try again.');
      } else {
        // For any other error (network issues, server errors, etc.)
        // Do NOT remove from local state - the appointment should remain visible
        setError('Failed to delete appointment from database. Please check your connection and try again.');
      }

      setDeleteDialogOpen(false);
      setSelectedAppointmentId(null);
    } finally {
      setLoading(false);
    }
  };

  const exportHealthRecordToPDF = async (record: HealthRecord) => {
    try {
      // Dynamic import for jsPDF
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF();

      // Patient info (using current user info)
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Patient: ${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`, 20, 50);
      pdf.text(`Patient ID: ${patientData?.cardNumber || 'N/A'}`, 20, 60);

      // Record details
      pdf.setFontSize(14);
      pdf.setTextColor(80, 52, 89);
      pdf.text('Medical Record Details', 20, 80);

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);

      // Record info
      pdf.text(`Date: ${new Date(record.date).toLocaleDateString()}`, 20, 95);
      pdf.text(`Doctor: ${record.doctorName}`, 20, 105);
      pdf.text(`Diagnosis: ${record.diagnosis}`, 20, 115);

      // Treatment section
      pdf.setFontSize(12);
      pdf.setTextColor(80, 52, 89);
      pdf.text('Treatment:', 20, 130);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const treatmentLines = pdf.splitTextToSize(record.treatment, 170);
      pdf.text(treatmentLines, 20, 140);

      let currentY = 140 + (treatmentLines.length * 5);

      // Prescription section
      if (currentY < 250) {
        pdf.setFontSize(12);
        pdf.setTextColor(80, 52, 89);
        pdf.text('Prescription:', 20, currentY + 10);

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const prescriptionLines = pdf.splitTextToSize(record.prescription, 170);
        pdf.text(prescriptionLines, 20, currentY + 20);

        currentY += 20 + (prescriptionLines.length * 5);
      }

      // Notes section
      if (currentY < 250 && record.notes) {
        pdf.setFontSize(12);
        pdf.setTextColor(80, 52, 89);
        pdf.text('Doctor Notes:', 20, currentY + 10);

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const notesLines = pdf.splitTextToSize(record.notes, 170);
        pdf.text(notesLines, 20, currentY + 20);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generated by MediPulse - Digital Healthcare Platform', 20, 280);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 285);

      // Save the PDF
      pdf.save(`Health_Record_${record.id}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const exportBillToPDF = async (bill: Bill) => {
    try {
      // Dynamic import for jsPDF
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF();

      // Patient info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Patient: ${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`, 20, 50);
      pdf.text(`Patient ID: ${patientData?.cardNumber || 'N/A'}`, 20, 60);

      // Bill details
      pdf.setFontSize(14);
      pdf.setTextColor(80, 52, 89);
      pdf.text('Medical Bill Details', 20, 80);

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);

      // Bill info
      pdf.text(`Bill ID: ${bill.id}`, 20, 95);
      pdf.text(`Description: ${bill.description}`, 20, 105);
      pdf.text(`Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`, 20, 115);
      pdf.text(`Status: ${bill.status}`, 20, 125);

      // Hospital and Doctor info
      pdf.setFontSize(12);
      pdf.setTextColor(80, 52, 89);
      pdf.text('Hospital:', 20, 140);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Name: ${bill.hospital}`, 20, 150);
      pdf.text(`Hospital Fee: LKR ${bill.hospitalFee?.toLocaleString()}`, 20, 160);

      pdf.setFontSize(12);
      pdf.setTextColor(80, 52, 89);
      pdf.text('Doctor:', 20, 175);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Name: ${bill.doctorName}`, 20, 185);
      pdf.text(`Consultant Fee: LKR ${bill.consultantFee?.toLocaleString()}`, 20, 195);

      // Total
      pdf.setFontSize(14);
      pdf.setTextColor(80, 52, 89);
      pdf.text(`Total Amount: LKR ${bill.amount.toLocaleString()}`, 20, 210);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generated by MediPulse - Digital Healthcare Platform', 20, 280);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 285);

      // Save the PDF
      pdf.save(`Bill_${bill.id}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <>
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
                <h1 className="text-xl font-bold text-gray-900">MediPulse Patient Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.profile?.firstName}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => logout(() => navigate('/login'))}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          window.location.hash = value;
        }}>
          <TabsList className="grid w-full grid-cols-6 gap-2">
            <TabsTrigger value="profile" className="flex items-center justify-center space-x-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center justify-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Records</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center justify-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Bills</span>
            </TabsTrigger>
            <TabsTrigger value="health-card" className="flex items-center justify-center space-x-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Health Card</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center justify-center space-x-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal and medical information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                    </div>
                    <label htmlFor="image-upload" className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50">
                      <Camera className="w-4 h-4 text-gray-600" />
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {patientData?.user?.profile?.firstName || user?.profile?.firstName} {patientData?.user?.profile?.lastName || user?.profile?.lastName}
                    </h2>
                    <p className="text-gray-600">Patient ID: {patientData?.cardNumber || 'N/A'}</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{patientData?.user?.email || user?.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{patientData?.user?.profile?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Born: {patientData?.user?.profile?.dateOfBirth ? new Date(patientData.user.profile.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Blood Type: {patientData?.bloodType || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{patientData?.user?.profile?.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  {!editing ? (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                      <Button className="bg-gradient-to-r from-[#503459] to-[#81638b]" onClick={saveProfile} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            {editing && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile Details</CardTitle>
                  <CardDescription>Update your medical and contact information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Medical</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Blood Type</p>
                          <Input value={form.bloodType} onChange={(e) => onChangeForm('bloodType', e.target.value)} placeholder="e.g., O+" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Allergies (comma separated)</p>
                          <Input value={form.allergies} onChange={(e) => onChangeForm('allergies', e.target.value)} placeholder="e.g., Penicillin, Peanuts" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Emergency Contact</h3>
                      <div className="space-y-3">
                        <Input value={form.emergencyContacts[0]?.name} onChange={(e) => onChangeForm('emergencyContacts.0.name', e.target.value)} placeholder="Name" />
                        <Input value={form.emergencyContacts[0]?.relationship} onChange={(e) => onChangeForm('emergencyContacts.0.relationship', e.target.value)} placeholder="Relationship" />
                        <Input value={form.emergencyContacts[0]?.phone} onChange={(e) => onChangeForm('emergencyContacts.0.phone', e.target.value)} placeholder="Phone" />
                        <Input value={form.emergencyContacts[0]?.email} onChange={(e) => onChangeForm('emergencyContacts.0.email', e.target.value)} placeholder="Email (optional)" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Insurance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input value={form.insurance.provider} onChange={(e) => onChangeForm('insurance.provider', e.target.value)} placeholder="Provider" />
                      <Input value={form.insurance.policyNumber} onChange={(e) => onChangeForm('insurance.policyNumber', e.target.value)} placeholder="Policy Number" />
                      <Input value={form.insurance.coverageType} onChange={(e) => onChangeForm('insurance.coverageType', e.target.value)} placeholder="Coverage Type" />
                      <Input type="date" value={form.insurance.expiryDate} onChange={(e) => onChangeForm('insurance.expiryDate', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Allergies</h3>
                    <div className="flex flex-wrap gap-2">
                      {patientData?.allergies && patientData.allergies.length > 0 ? (
                        patientData.allergies.map((allergy: string, index: number) => (
                          <Badge key={index} variant="destructive">{allergy}</Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No known allergies</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Emergency Contact</h3>
                    {patientData?.emergencyContacts && patientData.emergencyContacts.length > 0 ? (
                      <div className="space-y-2">
                        <p><strong>Name:</strong> {patientData.emergencyContacts[0].name}</p>
                        <p><strong>Relationship:</strong> {patientData.emergencyContacts[0].relationship}</p>
                        <p><strong>Phone:</strong> {patientData.emergencyContacts[0].phone}</p>
                        {patientData.emergencyContacts[0].email && (
                          <p><strong>Email:</strong> {patientData.emergencyContacts[0].email}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No emergency contact added</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Information */}
            {patientData?.insurance && (
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Provider</p>
                      <p className="font-semibold">{patientData.insurance.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Policy Number</p>
                      <p className="font-semibold">{patientData.insurance.policyNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coverage Type</p>
                      <p className="font-semibold">{patientData.insurance.coverageType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expiry Date</p>
                      <p className="font-semibold">
                        {new Date(patientData.insurance.expiryDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
                <p className="text-gray-600">Manage your medical appointments</p>
              </div>
              <Button 
                className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90 whitespace-nowrap"
                onClick={() => setShowBookingSystem(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>

            {appointments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
                  <p className="text-gray-600 mb-4">Book your first appointment to get started</p>
                  <Button 
                    className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                    onClick={() => setShowBookingSystem(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {error && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        <p className="text-red-700">{error}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{appointment.doctorName}</h3>
                            <p className="text-gray-600">{appointment.doctorSpecialization}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{new Date(appointment.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{appointment.time}</span>
                          </div>
                        </div>
                        {appointment.fee && (
                          <div className="mt-2">
                            <span className="font-medium">Fee: LKR {appointment.fee.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status === 'Scheduled' ? 'Confirmed' : 
                           appointment.status === 'Confirmed' ? 'Confirmed' : 
                           appointment.status}
                        </Badge>
                        <div className="mt-2 space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewAppointment(appointment.id)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {appointment.status === 'Pending' && (
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(appointment)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {appointment.status === 'Pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(appointment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          )}
                          {appointment.status === 'Scheduled' && (
                            <Button variant="outline" size="sm" onClick={() => openCancelDialog(appointment.id)}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Health Records</h2>
              <p className="text-gray-600">View your complete medical history</p>
            </div>

            {healthRecords.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No health records yet</h3>
                  <p className="text-gray-600">Your medical records will appear here after doctor consultations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {healthRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{record.diagnosis}</CardTitle>
                        <CardDescription>
                          {new Date(record.date).toLocaleDateString()} • {record.doctorName}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => exportHealthRecordToPDF(record)}>
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Treatment</h4>
                        <p className="text-gray-700">{record.treatment}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Prescription</h4>
                        <p className="text-gray-700">{record.prescription}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Doctor Notes</h4>
                        <p className="text-gray-700">{record.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bills" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bills & Payments</h2>
              <p className="text-gray-600">Manage your medical bills and payments</p>
            </div>

            {bills.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No bills yet</h3>
                  <p className="text-gray-600 mb-4">
                    Bills are automatically created when your appointments are confirmed by the doctor.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>Check your confirmed appointments below:</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {bills.map((bill) => (
                  <Card key={bill.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{bill.description}</CardTitle>
                          <CardDescription>Due: {new Date(bill.dueDate).toLocaleDateString()}</CardDescription>
                        </div>
                        <div className="text-right">
                          
                          <div className="mt-2">
                            
                            <Button variant="outline" size="sm" className="ml-2" onClick={() => exportBillToPDF(bill)}>
                              <Download className="w-4 h-4 mr-2" />
                              Export PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Hospital</h4>
                          <p className="text-gray-700">{bill.hospital}</p>
                          <p className="text-sm text-gray-600">Hospital Fee: LKR {bill.hospitalFee?.toLocaleString()}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Doctor</h4>
                          
                          <p className="text-sm text-gray-600">Consultant Fee: LKR {bill.consultantFee?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-2xl font-bold text-[#503459]">
                          Total: LKR {bill.amount.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Show confirmed appointments without bills */}
            {(() => {
              const confirmedAppointmentsWithoutBills = appointments.filter(apt =>
                (apt.status === 'Scheduled' || apt.status === 'Confirmed') &&
                !bills.some(bill => bill.appointmentId === apt.id)
              );

              if (confirmedAppointmentsWithoutBills.length > 0) {
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Confirmed Appointments Awaiting Bills
                      </CardTitle>
                      <CardDescription>
                        These appointments are confirmed but bills are being prepared by your healthcare provider.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {confirmedAppointmentsWithoutBills.map((appointment) => (
                          <div key={appointment.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{appointment.doctorName}</h4>
                                <p className="text-sm text-gray-600">{appointment.doctorSpecialization}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-blue-100 text-blue-800 mb-2">
                                {appointment.status === 'Scheduled' ? 'Confirmed' : appointment.status}
                              </Badge>
                              {appointment.fee && (
                                <p className="text-sm font-medium text-gray-700">
                                  Expected Fee: LKR {appointment.fee.toLocaleString()}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">Bill will be generated soon</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}
          </TabsContent>

          <TabsContent value="health-card" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  Digital Health Card
                </CardTitle>
                <CardDescription>
                  Your digital health identity and QR code for easy access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <QrCode className="w-16 h-16 text-[#503459] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Access Your Digital Health Card</h3>
                  <p className="text-gray-600 mb-6">
                    View your digital health card with QR code for easy hospital check-ins
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                    onClick={() => window.open('/health-card', '_blank')}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    View Health Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support & Help</CardTitle>
                <CardDescription>Get help with your MediPulse account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Contact Support</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span>+1 (555) 123-4567</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span>support@medipulse.com</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>24/7 Support Available</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        View Help Center
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Phone className="w-4 h-4 mr-2" />
                        Schedule Call
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
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

    {/* Edit Appointment Dialog */}
    <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Update your appointment details. Only pending appointments can be edited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <Input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time</label>
            <Input
              type="time"
              value={editForm.time}
              onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reason for Visit</label>
            <Input
              value={editForm.reason}
              onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for visit"
              disabled={saving}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving} onClick={() => setEditDialogOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEditAppointment}
            disabled={saving}
            className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete Appointment Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this appointment? This action cannot be undone.
            Only pending appointments can be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteAppointment}
            className="bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default PatientPortal;
