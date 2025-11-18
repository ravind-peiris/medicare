import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Plus,
  Save,
  X,
  Edit
} from 'lucide-react';
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

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onAddRecord: () => void;
  showNewRecord: boolean;
  onCloseRecord: () => void;
  onUpdate?: (updatedPatient: Patient) => void;
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

const PatientProfile: React.FC<PatientProfileProps> = ({
  patient,
  onBack,
  onAddRecord,
  showNewRecord,
  onCloseRecord,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phone,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    address: patient.address,
    emergencyContact: patient.emergencyContact,
    bloodType: patient.bloodType,
    allergies: patient.allergies.join(', ')
  });
  const [newRecord, setNewRecord] = useState({
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: ''
  });

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

  const handleSaveRecord = () => {
    // Here you would typically save the record to the API
    console.log('Saving new record:', newRecord);
    // Reset form
    setNewRecord({
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: ''
    });
    onCloseRecord();
  };

  const handleCancelRecord = () => {
    setNewRecord({
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: ''
    });
    onCloseRecord();
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      bloodType: patient.bloodType,
      allergies: patient.allergies.join(', ')
    });
  };

  const handleSaveEdit = async () => {
    try {
      const updatedPatientData = {
        user: {
          profile: {
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            email: editForm.email,
            phone: editForm.phone,
            dateOfBirth: editForm.dateOfBirth,
            gender: editForm.gender,
            address: editForm.address,
            emergencyContact: editForm.emergencyContact
          }
        },
        bloodType: editForm.bloodType,
        allergies: editForm.allergies.split(',').map(a => a.trim()).filter(a => a.length > 0)
      };

      await apiService.patients.update(patient.id, updatedPatientData);

      const updatedPatient: Patient = {
        ...patient,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        address: editForm.address,
        emergencyContact: editForm.emergencyContact,
        bloodType: editForm.bloodType,
        allergies: editForm.allergies.split(',').map(a => a.trim()).filter(a => a.length > 0)
      };

      setIsEditing(false);
      if (onUpdate) {
        onUpdate(updatedPatient);
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Failed to update patient information. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      bloodType: patient.bloodType,
      allergies: patient.allergies.join(', ')
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Patients</span>
              </Button>
              <div className="w-16 h-16 bg-gradient-to-r from-[#503459] to-[#81638b] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-sm text-gray-600">Patient ID: {patient.cardNumber}</p>
              </div>
            </div>
            <Button
              onClick={onAddRecord}
              className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Health Record
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="medical">Medical History</TabsTrigger>
            <TabsTrigger value="records">Health Records</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Patient's basic information and contact details</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={handleStartEdit}
                      className="flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Full Name:</span>
                        {isEditing ? (
                          <div className="ml-2 flex space-x-2">
                            <Input
                              value={editForm.firstName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                              placeholder="First Name"
                              className="flex-1"
                            />
                            <Input
                              value={editForm.lastName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Last Name"
                              className="flex-1"
                            />
                          </div>
                        ) : (
                          <span className="ml-2">{patient.firstName} {patient.lastName}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Date of Birth:</span>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editForm.dateOfBirth}
                            onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            className="ml-2 flex-1"
                          />
                        ) : (
                          <span className="ml-2">{new Date(patient.dateOfBirth).toLocaleDateString()} (Age: {getAge(patient.dateOfBirth)})</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Gender:</span>
                        {isEditing ? (
                          <Select value={editForm.gender} onValueChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}>
                            <SelectTrigger className="ml-2 flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="ml-2">{patient.gender}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Blood Type:</span>
                        {isEditing ? (
                          <Select value={editForm.bloodType} onValueChange={(value) => setEditForm(prev => ({ ...prev, bloodType: value }))}>
                            <SelectTrigger className="ml-2 flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                        ) : (
                          <Badge variant="secondary" className="ml-2">{patient.bloodType}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Email:</span>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            className="ml-2 flex-1"
                          />
                        ) : (
                          <span className="ml-2">{patient.email}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Phone:</span>
                        {isEditing ? (
                          <Input
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="ml-2 flex-1"
                          />
                        ) : (
                          <span className="ml-2">{patient.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Address:</span>
                        {isEditing ? (
                          <Input
                            value={editForm.address}
                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                            className="ml-2 flex-1"
                          />
                        ) : (
                          <span className="ml-2">{patient.address}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Emergency Contact:</span>
                        {isEditing ? (
                          <Input
                            value={editForm.emergencyContact}
                            onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                            className="ml-2 flex-1"
                          />
                        ) : (
                          <span className="ml-2">{patient.emergencyContact}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-red-600">Allergies</h3>
                  {isEditing ? (
                    <Textarea
                      value={editForm.allergies}
                      onChange={(e) => setEditForm(prev => ({ ...prev, allergies: e.target.value }))}
                      placeholder="Enter allergies separated by commas (e.g., Penicillin, Latex, Shellfish)"
                      rows={2}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.length > 0 ? (
                        patient.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive">{allergy}</Badge>
                        ))
                      ) : (
                        <span className="text-gray-500">No known allergies</span>
                      )}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                      onClick={handleSaveEdit}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>Patient's medical history and vital information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Medical History</h3>
                  <p className="text-gray-600">Detailed medical history will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Records</CardTitle>
                <CardDescription>Patient's health records and visit history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Yet</h3>
                  <p className="text-gray-600">Health records will appear here after adding them</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Record Modal */}
      {showNewRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Add New Health Record</CardTitle>
              <CardDescription>Create a new health record for {patient.firstName} {patient.lastName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Diagnosis</label>
                <Textarea
                  value={newRecord.diagnosis}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Treatment</label>
                <Textarea
                  value={newRecord.treatment}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, treatment: e.target.value }))}
                  placeholder="Enter treatment details..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prescription</label>
                <Textarea
                  value={newRecord.prescription}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, prescription: e.target.value }))}
                  placeholder="Enter prescription details..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <Button variant="outline" onClick={handleCancelRecord}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
                  onClick={handleSaveRecord}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
