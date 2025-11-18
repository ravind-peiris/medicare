import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Heart,
  FileText,
  CreditCard,
  Shield,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';

interface PatientInfo {
  id: string;
  cardNumber: string;
  fullName: string;
  dateOfBirth: string;
  bloodType: string;
  emergencyContact: string;
  allergies: string[];
  medicalConditions: string[];
  lastVisit: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverageType: string;
  };
}

interface AppointmentInfo {
  id: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  department: string;
  status: 'Scheduled' | 'Checked In' | 'In Progress' | 'Completed';
}

const KioskInterface = () => {
  const [currentStep, setCurrentStep] = useState<'scan' | 'verify' | 'appointment' | 'complete'>('scan');
  const [scannedData, setScannedData] = useState<string>('');
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [scanError, setScanError] = useState<string>('');

  // Mock patient data
  const mockPatientData: PatientInfo = {
    id: '12345',
    cardNumber: 'HC123456789',
    fullName: 'John Doe',
    dateOfBirth: '1985-03-15',
    bloodType: 'O+',
    emergencyContact: '+1-555-0123',
    allergies: ['Penicillin', 'Shellfish'],
    medicalConditions: ['Hypertension'],
    lastVisit: '2024-01-15',
    insuranceInfo: {
      provider: 'Blue Cross',
      policyNumber: 'BC123456789',
      coverageType: '100%'
    }
  };

  const mockAppointmentData: AppointmentInfo = {
    id: 'APT001',
    doctorName: 'Dr. Sarah Wilson',
    specialization: 'Cardiologist',
    date: '2024-02-15',
    time: '10:00 AM',
    department: 'Cardiology',
    status: 'Scheduled'
  };

  const playAudioFeedback = (type: 'success' | 'error' | 'scan') => {
    if (!audioEnabled) return;
    
    // In a real implementation, play actual audio files
    console.log(`Playing ${type} audio feedback`);
    
    // Visual feedback for demo
    const audioElement = document.createElement('div');
    audioElement.className = `fixed top-4 right-4 p-4 rounded-lg text-white font-bold z-50 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    audioElement.textContent = type === 'success' ? '✓ Success' : 
                              type === 'error' ? '✗ Error' : '📱 Scan Detected';
    document.body.appendChild(audioElement);
    
    setTimeout(() => {
      document.body.removeChild(audioElement);
    }, 2000);
  };

  const handleScanCard = () => {
    setIsScanning(true);
    setScanError('');
    
    // Simulate QR code scanning
    setTimeout(() => {
      const mockQRData = JSON.stringify({
        type: 'health_card',
        patientId: mockPatientData.id,
        cardNumber: mockPatientData.cardNumber,
        timestamp: new Date().toISOString()
      });
      
      setScannedData(mockQRData);
      validateAndLoadPatient(mockQRData);
      setIsScanning(false);
    }, 2000);
  };

  const validateAndLoadPatient = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'health_card' && parsed.cardNumber) {
        setPatientInfo(mockPatientData);
        setAppointmentInfo(mockAppointmentData);
        setCurrentStep('verify');
        playAudioFeedback('success');
      } else {
        throw new Error('Invalid card format');
      }
    } catch (error) {
      setScanError('Invalid health card. Please try again.');
      playAudioFeedback('error');
      setTimeout(() => {
        setCurrentStep('scan');
        setScannedData('');
        setScanError('');
      }, 3000);
    }
  };

  const handleCheckIn = () => {
    if (appointmentInfo) {
      setAppointmentInfo({ ...appointmentInfo, status: 'Checked In' });
      setCurrentStep('complete');
      playAudioFeedback('success');
    }
  };

  const handleReset = () => {
    setCurrentStep('scan');
    setScannedData('');
    setPatientInfo(null);
    setAppointmentInfo(null);
    setScanError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Checked In': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MediPulse Kiosk</h1>
          <p className="text-xl text-gray-600">Digital Health Card Check-In System</p>
          
          {/* Audio Controls */}
          <div className="mt-4 flex justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              {audioEnabled ? 'Audio On' : 'Audio Off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${currentStep === 'scan' ? 'text-[#503459]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'scan' ? 'bg-[#503459] text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Scan Card</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${currentStep === 'verify' ? 'text-[#503459]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'verify' ? 'bg-[#503459] text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Verify</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${currentStep === 'appointment' ? 'text-[#503459]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'appointment' ? 'bg-[#503459] text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Appointment</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${currentStep === 'complete' ? 'text-[#503459]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'complete' ? 'bg-[#503459] text-white' : 'bg-gray-200'
              }`}>
                4
              </div>
              <span className="ml-2 font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Step 1: Scan Card */}
        {currentStep === 'scan' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center">
                <QrCode className="w-8 h-8 mr-2" />
                Scan Your Health Card
              </CardTitle>
              <CardDescription>
                Position your digital health card QR code in front of the scanner
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-gray-100 p-8 rounded-lg">
                <Camera className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Scanner Ready</p>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={handleScanCard}
                  disabled={isScanning}
                >
                  {isScanning ? 'Scanning...' : 'Start Scanning'}
                </Button>
              </div>
              
              {isScanning && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-blue-700">Scanning for QR code...</span>
                  </div>
                </div>
              )}

              {scanError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700">{scanError}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Verify Patient */}
        {currentStep === 'verify' && patientInfo && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                Patient Verification
              </CardTitle>
              <CardDescription>
                Please verify your information is correct
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                      <p className="text-lg font-semibold">{patientInfo.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                      <p className="text-lg">{formatDate(patientInfo.dateOfBirth)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Blood Type</Label>
                      <p className="text-lg">{patientInfo.bloodType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                      <p className="text-lg">{patientInfo.emergencyContact}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Medical Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Allergies</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patientInfo.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Medical Conditions</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patientInfo.medicalConditions.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Last Visit</Label>
                      <p className="text-lg">{formatDate(patientInfo.lastVisit)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={() => setCurrentStep('appointment')}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Appointment Details */}
        {currentStep === 'appointment' && appointmentInfo && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-6 h-6 mr-2" />
                Appointment Details
              </CardTitle>
              <CardDescription>
                Review your appointment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Appointment Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Doctor</Label>
                        <p className="font-semibold">{appointmentInfo.doctorName}</p>
                        <p className="text-sm text-gray-600">{appointmentInfo.specialization}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Date & Time</Label>
                        <p className="font-semibold">{formatDate(appointmentInfo.date)} at {appointmentInfo.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Department</Label>
                        <p className="font-semibold">{appointmentInfo.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className={getStatusColor(appointmentInfo.status)}>
                        {appointmentInfo.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Instructions</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li>• Please arrive 15 minutes before your appointment</li>
                      <li>• Bring a valid ID and your health card</li>
                      <li>• If you have insurance, bring your insurance card</li>
                      <li>• Check in at the reception desk after scanning</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => setCurrentStep('verify')}>
                  Back
                </Button>
                <Button 
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={handleCheckIn}
                >
                  Check In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center text-green-600">
                <CheckCircle className="w-8 h-8 mr-2" />
                Check-In Complete!
              </CardTitle>
              <CardDescription>
                You have successfully checked in for your appointment
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Next Steps</h3>
                <ul className="text-green-800 space-y-1">
                  <li>• Please proceed to the waiting area</li>
                  <li>• You will be called when the doctor is ready</li>
                  <li>• Keep your health card handy</li>
                </ul>
              </div>

              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                >
                  Check In Another Patient
                </Button>
                <Button 
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default KioskInterface;
