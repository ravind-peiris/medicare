import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Save, 
  X, 
  Calendar,
  User,
  Stethoscope,
  Pill,
  TestTube,
  Activity
} from 'lucide-react';

interface Patient {
  id: string;
  cardNumber: string;
  firstName: string;
  lastName: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: MedicalRecord[];
}

interface MedicalRecord {
  id: string;
  date: string;
  type: 'Diagnosis' | 'Prescription' | 'Test Result' | 'Treatment';
  description: string;
  doctor: string;
  department: string;
  attachments?: string[];
}

interface NewRecord {
  type: 'Diagnosis' | 'Prescription' | 'Test Result' | 'Treatment';
  description: string;
  department: string;
  attachments?: File[];
}

const MedicalRecordsManager = ({ patientId }: { patientId?: string }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isViewRecordOpen, setIsViewRecordOpen] = useState(false);
  const [isEditRecordOpen, setIsEditRecordOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newRecord, setNewRecord] = useState<NewRecord>({
    type: 'Diagnosis',
    description: '',
    department: '',
    attachments: []
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setPatients(data.data?.patients || []);
        if (patientId) {
          const patient = data.data?.patients?.find((p: Patient) => p.id === patientId);
          setSelectedPatient(patient);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!selectedPatient || !newRecord.description.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/patients/${selectedPatient.id}/medical-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: newRecord.type,
          description: newRecord.description,
          department: newRecord.department
        })
      });

      if (response.ok) {
        await fetchPatients(); // Refresh data
        setIsAddRecordOpen(false);
        setNewRecord({ type: 'Diagnosis', description: '', department: '', attachments: [] });
      }
    } catch (error) {
      console.error('Error adding record:', error);
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'Diagnosis':
        return <Stethoscope className="w-4 h-4" />;
      case 'Prescription':
        return <Pill className="w-4 h-4" />;
      case 'Test Result':
        return <TestTube className="w-4 h-4" />;
      case 'Treatment':
        return <Activity className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'Diagnosis':
        return 'bg-red-100 text-red-800';
      case 'Prescription':
        return 'bg-blue-100 text-blue-800';
      case 'Test Result':
        return 'bg-green-100 text-green-800';
      case 'Treatment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
          <CardDescription>Choose a patient to view and manage their medical records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPatient?.id === patient.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                    <p className="text-sm text-gray-600">Card: {patient.cardNumber}</p>
                    <p className="text-xs text-gray-500">{patient.bloodType}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <>
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>{selectedPatient.firstName} {selectedPatient.lastName}</span>
                  </CardTitle>
                  <CardDescription>
                    Medical Records • Card Number: {selectedPatient.cardNumber}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="outline">{selectedPatient.bloodType}</Badge>
                  <Badge variant="secondary">{selectedPatient.medicalHistory.length} records</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Blood Type</Label>
                  <p className="text-sm text-gray-600">{selectedPatient.bloodType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Allergies</Label>
                  <p className="text-sm text-gray-600">
                    {selectedPatient.allergies.length > 0 
                      ? selectedPatient.allergies.join(', ')
                      : 'None recorded'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Records</Label>
                  <p className="text-sm text-gray-600">{selectedPatient.medicalHistory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Records */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>Complete medical records for {selectedPatient.firstName} {selectedPatient.lastName}</CardDescription>
                </div>
                <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Medical Record</DialogTitle>
                      <DialogDescription>
                        Add a new medical record for {selectedPatient.firstName} {selectedPatient.lastName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="recordType">Record Type</Label>
                          <Select value={newRecord.type} onValueChange={(value: any) => setNewRecord(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Diagnosis">Diagnosis</SelectItem>
                              <SelectItem value="Prescription">Prescription</SelectItem>
                              <SelectItem value="Test Result">Test Result</SelectItem>
                              <SelectItem value="Treatment">Treatment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            value={newRecord.department}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, department: e.target.value }))}
                            placeholder="e.g., Cardiology"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newRecord.description}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter detailed description..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddRecordOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddRecord}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Record
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPatient.medicalHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medical records found</p>
                  <p className="text-sm text-gray-400 mt-2">Add the first record for this patient</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPatient.medicalHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getRecordColor(record.type)}`}>
                            {getRecordIcon(record.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className={getRecordColor(record.type)}>
                                {record.type}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(record.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-medium mb-1">{record.description}</p>
                            <p className="text-sm text-gray-600">
                              Dr. {record.doctor} • {record.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsViewRecordOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsEditRecordOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* View Record Dialog */}
      <Dialog open={isViewRecordOpen} onOpenChange={setIsViewRecordOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedRecord && getRecordIcon(selectedRecord.type)}
              <span>Medical Record Details</span>
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-gray-600">{selectedRecord.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedRecord.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Doctor</Label>
                  <p className="text-sm text-gray-600">{selectedRecord.doctor}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm text-gray-600">{selectedRecord.department}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedRecord.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewRecordOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={isEditRecordOpen} onOpenChange={setIsEditRecordOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Medical Record</DialogTitle>
            <DialogDescription>
              Update the medical record information
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editType">Record Type</Label>
                  <Select value={selectedRecord.type} onValueChange={(value) => setSelectedRecord(prev => prev ? { ...prev, type: value as any } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diagnosis">Diagnosis</SelectItem>
                      <SelectItem value="Prescription">Prescription</SelectItem>
                      <SelectItem value="Test Result">Test Result</SelectItem>
                      <SelectItem value="Treatment">Treatment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editDepartment">Department</Label>
                  <Input
                    id="editDepartment"
                    value={selectedRecord.department}
                    onChange={(e) => setSelectedRecord(prev => prev ? { ...prev, department: e.target.value } : null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={selectedRecord.description}
                  onChange={(e) => setSelectedRecord(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRecordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditRecordOpen(false)}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalRecordsManager;

