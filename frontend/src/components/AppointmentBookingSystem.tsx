import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  MapPin, 
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CreditCard,
  Shield,
  Heart,
  User,
  Stethoscope,
  Building,
  Star,
  Calendar,
  Download
} from 'lucide-react';
import CustomCalendar from '@/components/CustomCalendar';
import { useAuth } from '@/components/UserAuth';
import apiService from '@/lib/apiService';
import { useNavigate } from 'react-router-dom';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  rating: number;
  experience: number;
  consultationFee: number;
  availableSlots: string[];
  image?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingStep {
  step: number;
  title: string;
  description: string;
}

interface AppointmentBookingSystemProps {
  onBack?: () => void;
}

const AppointmentBookingSystem: React.FC<AppointmentBookingSystemProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [filterHospital, setFilterHospital] = useState('all');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);

  const navigate = useNavigate();

  // Define helper variables outside render function
  const selectedHospitalData = hospitals.find((h: any) => h._id === selectedHospital);
  const isGovernmentHospital = selectedHospitalData?.type === 'Government';

  const specializations = ['Cardiologist', 'General Physician', 'Dermatologist', 'Orthopedist', 'Neurologist'];

  const bookingSteps: BookingStep[] = [
    {
      step: 1,
      title: 'Select Doctor',
      description: 'Choose your preferred doctor and specialization'
    },
    {
      step: 2,
      title: 'Choose Date & Time',
      description: 'Select your preferred appointment date and time slot'
    },
    {
      step: 3,
      title: 'Select Hospital',
      description: 'Choose where you want to meet the doctor'
    },
    {
      step: 4,
      title: 'Payment',
      description: 'Complete your appointment booking with payment'
    },
    {
      step: 5,
      title: 'Confirmation',
      description: 'Review and confirm your appointment details'
    }
  ];

  const timeSlots: TimeSlot[] = [
    { time: '08:00', available: true },
    { time: '09:00', available: true },
    { time: '10:00', available: false },
    { time: '11:00', available: true },
    { time: '14:00', available: true },
    { time: '15:00', available: false },
    { time: '16:00', available: true }
  ];

  // Generate next 30 days
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  // Mock Sri Lankan Hospitals Data
  const mockHospitals = [
    // Government Hospitals (20)
    { _id: 'gov1', name: 'National Hospital of Sri Lanka', type: 'Government', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'gov2', name: 'Colombo South Teaching Hospital', type: 'Government', address: { city: 'Kalubowila', district: 'Colombo' } },
    { _id: 'gov3', name: 'Lady Ridgeway Hospital for Children', type: 'Government', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'gov4', name: 'De Soysa Hospital for Women', type: 'Government', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'gov5', name: 'Sri Jayewardenepura General Hospital', type: 'Government', address: { city: 'Kotte', district: 'Colombo' } },
    { _id: 'gov6', name: 'Teaching Hospital Karapitiya', type: 'Government', address: { city: 'Galle', district: 'Galle' } },
    { _id: 'gov7', name: 'Teaching Hospital Kandy', type: 'Government', address: { city: 'Kandy', district: 'Kandy' } },
    { _id: 'gov8', name: 'Teaching Hospital Jaffna', type: 'Government', address: { city: 'Jaffna', district: 'Jaffna' } },
    { _id: 'gov9', name: 'Teaching Hospital Anuradhapura', type: 'Government', address: { city: 'Anuradhapura', district: 'Anuradhapura' } },
    { _id: 'gov10', name: 'Base Hospital Negombo', type: 'Government', address: { city: 'Negombo', district: 'Gampaha' } },
    { _id: 'gov11', name: 'District General Hospital Gampaha', type: 'Government', address: { city: 'Gampaha', district: 'Gampaha' } },
    { _id: 'gov12', name: 'Teaching Hospital Kurunegala', type: 'Government', address: { city: 'Kurunegala', district: 'Kurunegala' } },
    { _id: 'gov13', name: 'Teaching Hospital Batticaloa', type: 'Government', address: { city: 'Batticaloa', district: 'Batticaloa' } },
    { _id: 'gov14', name: 'Base Hospital Chilaw', type: 'Government', address: { city: 'Chilaw', district: 'Puttalam' } },
    { _id: 'gov15', name: 'District General Hospital Matara', type: 'Government', address: { city: 'Matara', district: 'Matara' } },
    { _id: 'gov16', name: 'District General Hospital Ratnapura', type: 'Government', address: { city: 'Ratnapura', district: 'Ratnapura' } },
    { _id: 'gov17', name: 'Base Hospital Homagama', type: 'Government', address: { city: 'Homagama', district: 'Colombo' } },
    { _id: 'gov18', name: 'District General Hospital Badulla', type: 'Government', address: { city: 'Badulla', district: 'Badulla' } },
    { _id: 'gov19', name: 'Base Hospital Panadura', type: 'Government', address: { city: 'Panadura', district: 'Kalutara' } },
    { _id: 'gov20', name: 'District General Hospital Trincomalee', type: 'Government', address: { city: 'Trincomalee', district: 'Trincomalee' } },
    
    // Private Hospitals (10)
    { _id: 'pvt1', name: 'Asiri Central Hospital', type: 'Private', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'pvt2', name: 'Nawaloka Hospital', type: 'Private', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'pvt3', name: 'Durdans Hospital', type: 'Private', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'pvt4', name: 'Lanka Hospitals', type: 'Private', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'pvt5', name: 'Hemas Hospital Wattala', type: 'Private', address: { city: 'Wattala', district: 'Gampaha' } },
    { _id: 'pvt6', name: 'Asiri Surgical Hospital', type: 'Private', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'pvt7', name: 'Golden Key Eye Hospital', type: 'Private', address: { city: 'Rajagiriya', district: 'Colombo' } },
    { _id: 'pvt8', name: 'Ninewells Hospital', type: 'Private', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'pvt9', name: 'Central Hospital', type: 'Private', address: { city: 'Colombo', district: 'Colombo' } },
    { _id: 'pvt10', name: 'Oasis Hospital', type: 'Private', address: { city: 'Colombo', district: 'Colombo' } },
  ];

  // Load doctors and hospitals on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load doctors with fallback to mock data
        try {
          const doctorsResponse = await apiService.doctors.getAll(1, 100);
          const doctorsData = (doctorsResponse.data as any).doctors || doctorsResponse.data;
          const formattedDoctors = doctorsData.map((doc: any) => ({
            id: doc._id,
            name: doc.user?.profile ? `Dr. ${doc.user.profile.firstName} ${doc.user.profile.lastName}` : 'Unknown Doctor',
            specialization: doc.specialization,
            hospital: 'Multiple Locations', // Will be updated when we link doctors to hospitals
            rating: doc.rating?.average || 0,
            experience: doc.experience,
            consultationFee: doc.consultationFee,
            availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'] // Will be calculated from availability
          }));
          setDoctors(formattedDoctors);
          setFilteredDoctors(formattedDoctors);
        } catch (doctorErr) {
          console.log('Using mock doctor data due to API failure');
          // Mock doctors data as fallback
          const mockDoctors = [
            {
              id: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId format
              name: 'Dr. Sarah Wilson',
              specialization: 'General Physician',
              hospital: 'MediPulse General Hospital',
              rating: 4.8,
              experience: 12,
              consultationFee: 3000,
              availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00']
            },
            {
              id: '507f1f77bcf86cd799439012',
              name: 'Dr. Michael Chen',
              specialization: 'Cardiologist',
              hospital: 'MediPulse General Hospital',
              rating: 4.9,
              experience: 15,
              consultationFee: 4000,
              availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00']
            },
            {
              id: '507f1f77bcf86cd799439013',
              name: 'Dr. Priya Patel',
              specialization: 'Dermatologist',
              hospital: 'MediPulse General Hospital',
              rating: 4.7,
              experience: 8,
              consultationFee: 2500,
              availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00']
            }
          ];
          setDoctors(mockDoctors);
          setFilteredDoctors(mockDoctors);
        }

        // Try to load hospitals from API, fallback to mock data
        try {
          const hospitalsResponse = await apiService.hospitals.getAll(1, 100);
          const hospitalsData = (hospitalsResponse.data as any).hospitals || hospitalsResponse.data;
          
          // Use API data if available, otherwise use mock data
          if (hospitalsData && hospitalsData.length > 0) {
            setHospitals(hospitalsData);
          } else {
            setHospitals(mockHospitals);
          }
        } catch (hospitalErr) {
          console.log('Using mock hospital data');
          setHospitals(mockHospitals);
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load doctors - using sample data');
        // Still set mock hospitals even if doctors fail
        setHospitals(mockHospitals);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = doctors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Specialization filter
    if (filterSpecialization !== 'all') {
      filtered = filtered.filter(doctor => doctor.specialization === filterSpecialization);
    }

    // Hospital filter
    if (filterHospital !== 'all') {
      filtered = filtered.filter(doctor => doctor.hospital === filterHospital);
    }

    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, filterSpecialization, filterHospital]);

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleHospitalSelect = (hospital: string) => {
    setSelectedHospital(hospital);
    setCurrentStep(4);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
  };

  const handleCardDetailsChange = (field: string, value: string) => {
    setCardDetails(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleBookingConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields and IDs
      if (!selectedDoctor?.id || !selectedHospital || !selectedDate || !selectedTime) {
        setError('Missing required booking information');
        setLoading(false);
        return;
      }

      // Get patient ID from the current user
      let patientId;
      try {
        const patientResponse = await apiService.patients.getMe();
        // Response structure: { status: 'success', data: { patient: {...} } }
        patientId = patientResponse.data.patient?._id || patientResponse.data._id;
        
        if (!patientId) {
          throw new Error('Patient ID not found in response');
        }
      } catch (err) {
        console.error('Error fetching patient profile:', err);
        setError('Unable to fetch patient information. Please ensure you have a patient profile.');
        setLoading(false);
        return;
      }

      // Validate that IDs are proper MongoDB ObjectIds (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(selectedDoctor.id)) {
        setError('Invalid doctor ID format');
        setLoading(false);
        return;
      }

      if (!/^[0-9a-fA-F]{24}$/.test(patientId)) {
        setError('Invalid patient ID format');
        setLoading(false);
        return;
      }

      // Create appointment - only include hospital if it's a valid MongoDB ObjectId
      const appointmentData: any = {
        patient: patientId,
        doctor: selectedDoctor.id,
        date: selectedDate,
        time: selectedTime,
        reason: 'General Consultation',
        notes: `Hospital: ${selectedHospitalData?.name || 'Not specified'}`
      };

      // Only include hospital if it's a valid MongoDB ObjectId (24 hex characters)
      if (selectedHospital && /^[0-9a-fA-F]{24}$/.test(selectedHospital)) {
        appointmentData.hospital = selectedHospital;
      }

      console.log('Creating appointment with data:', appointmentData);
      console.log('Patient ID:', patientId);
      console.log('Doctor ID:', selectedDoctor.id);
      console.log('Date:', selectedDate);
      console.log('Time:', selectedTime);
      console.log('Hospital ID:', selectedHospital);

      await apiService.appointments.create(appointmentData);

      // If payment is required and method is selected, create payment record
      if (!isGovernmentHospital && paymentMethod && paymentMethod !== 'later' && paymentMethod !== 'cash') {
        // Payment will be handled separately
        console.log('Payment method:', paymentMethod);
      }

      // Navigate to confirmation step instead of going back to patient portal
      setCurrentStep(5);
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      console.error('Error response:', err.response);

      // More detailed error handling
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map((error: any) =>
          `${error.param || error.field}: ${error.msg || error.message}`
        ).join(', ');
        setError(`Validation failed: ${validationErrors}`);
      } else if (err.response?.data?.message) {
        setError(`Backend error: ${err.response.data.message}`);
      } else {
        setError(err.message || 'Failed to create appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadAppointmentReceipt = async () => {
    try {
      // Dynamic import for jsPDF
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF();

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(80, 52, 89);
      pdf.text('MediPulse', 105, 30, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text('Appointment Confirmation Receipt', 105, 40, { align: 'center' });

      // Patient info (using current user info - fallback to generic if not available)
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Patient: ${user?.profile?.firstName || 'Patient'} ${user?.profile?.lastName || ''}`, 20, 60);
      pdf.text(`Patient ID: ${patientData?.cardNumber || 'N/A'}`, 20, 70);

      // Appointment details
      pdf.setFontSize(14);
      pdf.setTextColor(80, 52, 89);
      pdf.text('Appointment Details', 20, 90);

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);

      // Appointment info
      pdf.text(`Appointment ID: ${Date.now()}`, 20, 105);
      pdf.text(`Doctor: ${selectedDoctor?.name || 'Not selected'}`, 20, 115);
      pdf.text(`Specialization: ${selectedDoctor?.specialization || 'Not selected'}`, 20, 125);
      pdf.text(`Date: ${selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected'}`, 20, 135);
      pdf.text(`Time: ${selectedTime || 'Not selected'}`, 20, 145);
      pdf.text(`Hospital: ${selectedHospitalData?.name || 'Not selected'}`, 20, 155);

      // Hospital and payment info
      pdf.setFontSize(12);
      pdf.setTextColor(80, 52, 89);
      pdf.text('Hospital Information:', 20, 170);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Name: ${selectedHospitalData?.name || 'Not selected'}`, 20, 180);
      pdf.text(`Type: ${selectedHospitalData?.type || 'Not specified'}`, 20, 190);
      pdf.text(`Location: ${selectedHospitalData?.address?.city || 'Not specified'}`, 20, 200);

      // Payment info
      if (!isGovernmentHospital) {
        pdf.setFontSize(12);
        pdf.setTextColor(80, 52, 89);
        pdf.text('Payment Information:', 20, 215);

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Payment Method: ${paymentMethod || 'Not selected'}`, 20, 225);
        pdf.text(`Consultation Fee: LKR ${selectedDoctor?.consultationFee?.toLocaleString() || '0'}`, 20, 235);

        // Card details if applicable
        if (paymentMethod === 'card' && cardDetails.cardNumber) {
          pdf.text(`Card: **** **** **** ${cardDetails.cardNumber.slice(-4)}`, 20, 245);
          pdf.text(`Cardholder: ${cardDetails.cardholderName || 'N/A'}`, 20, 255);
        }

        // Insurance details if applicable
        if (paymentMethod === 'insurance' && cardDetails.cardholderName) {
          pdf.text(`Insurance Provider: ${cardDetails.cardholderName || 'N/A'}`, 20, 245);
          pdf.text(`Policy Number: ${cardDetails.cardNumber || 'N/A'}`, 20, 255);
        }
      } else {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 128, 0);
        pdf.text('Free Government Hospital Service', 20, 225);
      }

      // Terms and conditions
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Terms & Conditions:', 20, 275);
      pdf.text('- Please arrive 15 minutes before your appointment time', 20, 280);
      pdf.text('- Bring your health card and any relevant medical documents', 20, 285);
      pdf.text('- Contact the hospital if you need to reschedule or cancel', 20, 290);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generated by MediPulse - Digital Healthcare Platform', 20, 300);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 305);

      // Save the PDF
      pdf.save(`Appointment_Receipt_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate receipt. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterHospital} onValueChange={setFilterHospital}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by hospital" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {hospitals.map(hospital => (
                    <SelectItem key={hospital._id} value={hospital.name}>{hospital.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                        <Stethoscope className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold">{doctor.name}</h3>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium">{doctor.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">{doctor.specialization}</p>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Building className="w-4 h-4 mr-1" />
                          <span>{doctor.hospital}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{doctor.experience || 0} years experience</span>
                          <div className="text-right">
                            {doctor.consultationFee === 0 ? (
                              <Badge className="bg-green-100 text-green-800">Free</Badge>
                            ) : (
                              <span className="font-semibold text-[#503459]">
                                LKR {doctor.consultationFee?.toLocaleString() || '0'}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-4 bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                          onClick={() => handleDoctorSelect(doctor)}
                        >
                          Book Appointment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Selected Doctor Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedDoctor?.name}</h3>
                    <p className="text-gray-600">{selectedDoctor?.specialization}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Date</h3>
              
              {/* Selected Date Display */}
              {selectedDate && (
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Selected Date</p>
                      <p className="text-lg font-bold text-[#503459]">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <CustomCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                minDate={new Date()}
              />
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-[#503459]" />
                  Select Time
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {selectedDoctor?.availableSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <Button
                        key={time}
                        variant={isSelected ? "default" : "outline"}
                        className={`h-14 flex items-center justify-center transition-all duration-200 ${
                          isSelected 
                            ? 'bg-gradient-to-br from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90 shadow-md scale-105' 
                            : 'hover:bg-purple-50 hover:border-[#503459] hover:scale-105'
                        }`}
                        onClick={() => handleTimeSelect(time)}
                      >
                        <Clock className={`w-4 h-4 mr-2 ${isSelected ? 'text-white' : 'text-[#503459]'}`} />
                        <span className="font-semibold">{time}</span>
                      </Button>
                    );
                  })}
                </div>
                {selectedTime && (
                  <div className="mt-4 flex justify-end">
                    <Button 
                      className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                      onClick={() => setCurrentStep(3)}
                    >
                      Continue to Hospital Selection
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Selected Details */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Doctor:</span>
                    <span>{selectedDoctor?.name || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Time:</span>
                    <span>{selectedTime || 'Not selected'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hospital Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Hospital</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading hospitals...</p>
                </div>
              ) : hospitals.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No hospitals available at the moment.</p>
                  <p className="text-sm text-gray-400">Please contact support or try again later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hospitals.map((hospital: any) => {
                    const isSelected = selectedHospital === hospital._id;
                    const isGovernment = hospital.type === 'Government';
                    
                    return (
                      <Card 
                        key={hospital._id}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-[#503459] bg-purple-50' : 'hover:shadow-md'
                        }`}
                        onClick={() => handleHospitalSelect(hospital._id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isGovernment ? 'bg-green-100' : 'bg-[#503459]/10'
                            }`}>
                              <Building className={`w-6 h-6 ${
                                isGovernment ? 'text-green-600' : 'text-[#503459]'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{hospital.name}</h4>
                              <p className="text-sm text-gray-600">{hospital.address?.city || 'Location not specified'}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {isGovernment ? (
                                  <Badge className="bg-green-100 text-green-800">No Payment Required</Badge>
                                ) : (
                                  <Badge variant="secondary">Private Hospital</Badge>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-6 h-6 text-[#503459]" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
            
            {selectedHospital && (
              <div className="flex justify-end">
                <Button 
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={() => setCurrentStep(4)}
                >
                  Continue to Payment
                </Button>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Doctor:</span>
                    <p>{selectedDoctor?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Specialization:</span>
                    <p>{selectedDoctor?.specialization}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date & Time:</span>
                    <p>{selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected'} at {selectedTime || 'Not selected'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Hospital:</span>
                    <p>{selectedHospitalData?.name || 'Not selected'}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Consultation Fee:</span>
                    <span className="text-lg font-bold text-[#503459]">
                      {isGovernmentHospital ? 'FREE' : `LKR ${selectedDoctor?.consultationFee?.toLocaleString() || '0'}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            {!isGovernmentHospital && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      paymentMethod === 'insurance' ? 'ring-2 ring-[#503459] bg-purple-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => handlePaymentMethodSelect('insurance')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Shield className="w-8 h-8 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">Insurance</h4>
                          <p className="text-sm text-gray-600">Pay with your insurance coverage</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all ${
                      paymentMethod === 'card' ? 'ring-2 ring-[#503459] bg-purple-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => handlePaymentMethodSelect('card')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <CreditCard className="w-8 h-8 text-green-600" />
                        <div>
                          <h4 className="font-semibold">Card/Online Payment</h4>
                          <p className="text-sm text-gray-600">Pay with credit/debit card</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all ${
                      paymentMethod === 'later' ? 'ring-2 ring-[#503459] bg-purple-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => handlePaymentMethodSelect('later')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Clock className="w-8 h-8 text-orange-600" />
                        <div>
                          <h4 className="font-semibold">Pay Later</h4>
                          <p className="text-sm text-gray-600">Pay before appointment or at hospital</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all ${
                      paymentMethod === 'cash' ? 'ring-2 ring-[#503459] bg-purple-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => handlePaymentMethodSelect('cash')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Heart className="w-8 h-8 text-red-600" />
                        <div>
                          <h4 className="font-semibold">Cash at Hospital</h4>
                          <p className="text-sm text-gray-600">Pay with cash when you arrive</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-2" />
                          Card Payment Details
                        </CardTitle>
                        <CardDescription>
                          Enter your card information securely
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Card Number</label>
                            <Input
                              placeholder="1234 5678 9012 3456"
                              value={cardDetails.cardNumber}
                              onChange={(e) => handleCardDetailsChange('cardNumber', formatCardNumber(e.target.value))}
                              maxLength={19}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                            <Input
                              placeholder="John Doe"
                              value={cardDetails.cardholderName}
                              onChange={(e) => handleCardDetailsChange('cardholderName', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Expiry Date</label>
                            <Input
                              placeholder="MM/YY"
                              value={cardDetails.expiryDate}
                              onChange={(e) => handleCardDetailsChange('expiryDate', formatExpiryDate(e.target.value))}
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">CVV</label>
                            <Input
                              placeholder="123"
                              value={cardDetails.cvv}
                              onChange={(e) => handleCardDetailsChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                              maxLength={4}
                              type="password"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Billing Address</label>
                          <Input
                            placeholder="123 Main Street, City, Country"
                            value={cardDetails.billingAddress}
                            onChange={(e) => handleCardDetailsChange('billingAddress', e.target.value)}
                          />
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <Shield className="w-5 h-5 text-green-600 mr-2" />
                            <span className="text-sm text-green-800 font-medium">Secure Payment</span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">
                            Your payment information is encrypted and secure. We use industry-standard SSL encryption.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Insurance Payment Form */}
                {paymentMethod === 'insurance' && (
                  <div className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Shield className="w-5 h-5 mr-2" />
                          Insurance Payment
                        </CardTitle>
                        <CardDescription>
                          Verify your insurance coverage
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Insurance Provider</label>
                            <Input
                              placeholder="Blue Cross, Aetna, etc."
                              value={cardDetails.cardholderName} // Reusing for insurance provider
                              onChange={(e) => handleCardDetailsChange('cardholderName', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Policy Number</label>
                            <Input
                              placeholder="ABC123456789"
                              value={cardDetails.cardNumber} // Reusing for policy number
                              onChange={(e) => handleCardDetailsChange('cardNumber', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <Shield className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-sm text-blue-800 font-medium">Insurance Verification</span>
                          </div>
                          <p className="text-xs text-blue-700 mt-1">
                            We will verify your insurance coverage before processing the payment.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {paymentMethod && (
                  <div className="mt-6 flex justify-end">
                    <Button 
                      className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                      onClick={handleBookingConfirm}
                      disabled={loading || (paymentMethod === 'card' && (!cardDetails.cardNumber || !cardDetails.cardholderName || !cardDetails.expiryDate || !cardDetails.cvv))}
                    >
                      {loading ? 'Processing...' : 'Complete Booking'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isGovernmentHospital && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment Required</h3>
                <p className="text-gray-600 mb-6">Government hospitals provide free consultation services.</p>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <Button 
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={handleBookingConfirm}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Complete Booking'}
                </Button>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Appointment Confirmed!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Your appointment has been successfully booked. You will receive a confirmation email shortly.
            </p>
            
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Doctor:</span>
                  <span>{selectedDoctor?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Time:</span>
                  <span>{selectedTime || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Hospital:</span>
                  <span>{selectedHospitalData?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment:</span>
                  <span>{isGovernmentHospital ? 'FREE' : (paymentMethod || 'Not selected')}</span>
                </div>
                {!isGovernmentHospital && paymentMethod === 'card' && cardDetails.cardNumber && (
                  <div className="bg-gray-50 p-3 rounded-lg mt-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Card:</span>
                        <span className="font-mono">**** **** **** {cardDetails.cardNumber.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cardholder:</span>
                        <span>{cardDetails.cardholderName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
                {!isGovernmentHospital && paymentMethod === 'insurance' && cardDetails.cardholderName && (
                  <div className="bg-blue-50 p-3 rounded-lg mt-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Provider:</span>
                        <span>{cardDetails.cardholderName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Policy:</span>
                        <span className="font-mono">{cardDetails.cardNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 space-x-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Button>
              <Button variant="outline" onClick={downloadAppointmentReceipt}>
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button 
                className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                onClick={() => {
                  // Navigate back to patient portal appointments section
                  navigate('/patient-portal#appointments');
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                View My Appointments
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
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
                <h1 className="text-xl font-bold text-gray-900">Book Appointment</h1>
                <p className="text-sm text-gray-600">Schedule your medical consultation</p>
              </div>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 hidden lg:block" style={{ zIndex: 0 }}>
              <div 
                className="h-full bg-gradient-to-r from-[#503459] to-[#81638b] transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (bookingSteps.length - 1)) * 100}%` }}
              />
            </div>
            
            {/* Steps */}
            <div className="relative grid grid-cols-5 gap-2 lg:gap-4" style={{ zIndex: 1 }}>
              {bookingSteps.map((step, index) => (
                <div key={step.step} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
                    currentStep >= step.step
                      ? 'bg-gradient-to-br from-[#503459] to-[#81638b] shadow-lg scale-110'
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    {currentStep > step.step ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <span className={`text-xl font-bold ${
                        currentStep >= step.step ? 'text-white' : 'text-gray-400'
                      }`}>{step.step}</span>
                    )}
                  </div>
                  
                  {/* Step Info */}
                  <div className="mt-3 text-center">
                    <p className={`text-xs sm:text-sm font-semibold transition-colors ${
                      currentStep >= step.step ? 'text-[#503459]' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 hidden lg:block">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentBookingSystem;
