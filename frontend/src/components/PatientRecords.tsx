import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Plus, 
  Edit, 
  Save, 
  User, 
  Heart, 
  Pill,
  TestTube,
  Stethoscope,
  AlertTriangle,
  Calendar,
  Clock
} from 'lucide-react';
import { Patient, MedicalRecord, mockPatients } from '@/lib/mockData';
import { useAuth } from './UserAuth';
import DigitalHealthCard from './DigitalHealthCard';

const PatientRecords: React.FC = () => {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);
  const [newRecord, setNewRecord] = useState<Partial<MedicalRecord>>({});
  const [showAddRecord, setShowAddRecord] = useState(false);

  useEffect(() => {
    // If user is a patient, load their own records
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
    setEditedPatient({ ...patient });
  };

  const handleScanComplete = () => {
    setShowScanner(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedPatient(selectedPatient ? { ...selectedPatient } : null);
  };

  const handleSave = () => {
    if (editedPatient) {
      // In a real system, this would update the database
      setSelectedPatient(editedPatient);
      setIsEditing(false);
      
      // Simulate audit trail
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action: 'Patient record updated',
        user: user?.username || 'Unknown',
        changes: 'Demographics updated'
      };
      console.log('Audit Trail:', auditEntry);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPatient(selectedPatient);
  };

  const handleAddMedicalRecord = () => {
    if (newRecord.type && newRecord.description && selectedPatient) {
      const record: MedicalRecord = {
        id: `MR${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: newRecord.type as MedicalRecord['type'],
        description: newRecord.description,
        doctor: user?.role === 'Staff' ? 'Current Doctor' : 'Dr. System',
        department: newRecord.department || 'General'
      };

      const updatedPatient = {
        ...selectedPatient,
        medicalHistory: [...selectedPatient.medicalHistory, record]
      };

      setSelectedPatient(updatedPatient);
      setNewRecord({});
      setShowAddRecord(false);
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'Diagnosis': return <Stethoscope className="h-4 w-4" />;
      case 'Prescription': return <Pill className="h-4 w-4" />;
      case 'Test Result': return <TestTube className="h-4 w-4" />;
      case 'Treatment': return <Heart className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'Diagnosis': return 'bg-red-100 text-red-800';
      case 'Prescription': return 'bg-blue-100 text-blue-800';
      case 'Test Result': return 'bg-green-100 text-green-800';
      case 'Treatment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showScanner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patient Records Management</h2>
            <p className="text-gray-600">Access and manage patient medical records</p>
          </div>
        </div>
        
        <DigitalHealthCard 
          onPatientFound={handlePatientFound}
          onScanComplete={handleScanComplete}
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
          <h2 className="text-2xl font-bold text-gray-900">Patient Records</h2>
          <p className="text-gray-600">
            {user?.role === 'Patient' ? 'Your medical records and health information' : 'Manage patient medical records and information'}
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

      {/* Patient Header Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-3 rounded-full">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Card: {selectedPatient.cardNumber} • DOB: {selectedPatient.dateOfBirth}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Blood Type: {selectedPatient.bloodType}
              </Badge>
              {selectedPatient.allergies.length > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Allergies
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
        </TabsList>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {user?.role === 'Staff' && (
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} size="sm">
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit} variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={isEditing ? editedPatient?.firstName || '' : selectedPatient.firstName}
                    onChange={(e) => setEditedPatient(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={isEditing ? editedPatient?.lastName || '' : selectedPatient.lastName}
                    onChange={(e) => setEditedPatient(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={isEditing ? editedPatient?.phone || '' : selectedPatient.phone}
                    onChange={(e) => setEditedPatient(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    disabled={!isEditing || user?.role === 'Patient'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={isEditing ? editedPatient?.email || '' : selectedPatient.email}
                    onChange={(e) => setEditedPatient(prev => prev ? { ...prev, email: e.target.value } : null)}
                    disabled={!isEditing || user?.role === 'Patient'}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={isEditing ? editedPatient?.address || '' : selectedPatient.address}
                  onChange={(e) => setEditedPatient(prev => prev ? { ...prev, address: e.target.value } : null)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input
                  value={isEditing ? editedPatient?.emergencyContact || '' : selectedPatient.emergencyContact}
                  onChange={(e) => setEditedPatient(prev => prev ? { ...prev, emergencyContact: e.target.value } : null)}
                  disabled={!isEditing}
                />
              </div>
              {selectedPatient.allergies.length > 0 && (
                <div className="space-y-2">
                  <Label>Allergies</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Medical History</CardTitle>
                {user?.role === 'Staff' && (
                  <Dialog open={showAddRecord} onOpenChange={setShowAddRecord}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Record
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Medical Record</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select 
                            value={newRecord.type} 
                            onValueChange={(value) => setNewRecord(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select record type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Diagnosis">Diagnosis</SelectItem>
                              <SelectItem value="Prescription">Prescription</SelectItem>
                              <SelectItem value="Test Result">Test Result</SelectItem>
                              <SelectItem value="Treatment">Treatment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Input
                            placeholder="e.g., Cardiology, General Medicine"
                            value={newRecord.department || ''}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, department: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Enter medical record details..."
                            value={newRecord.description || ''}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <Button onClick={handleAddMedicalRecord} className="w-full">
                          Add Record
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedPatient.medicalHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No medical records found.</p>
                ) : (
                  selectedPatient.medicalHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                      <Card key={record.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-full ${getRecordColor(record.type)}`}>
                                {getRecordIcon(record.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge variant="outline" className={getRecordColor(record.type)}>
                                    {record.type}
                                  </Badge>
                                  <span className="text-sm text-gray-500">{record.department}</span>
                                </div>
                                <p className="font-medium mb-1">{record.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{record.date}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>{record.doctor}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPatient.insurance ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Insurance Provider</Label>
                    <Input value={selectedPatient.insurance.provider} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Policy Number</Label>
                    <Input value={selectedPatient.insurance.policyNumber} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Coverage Type</Label>
                    <Input value={selectedPatient.insurance.coverageType} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input value={selectedPatient.insurance.expiryDate} disabled />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No insurance information available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientRecords;