import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface DoctorSchedule {
  id: string;
  doctorId: string;
  availability: AvailabilitySlot[];
  consultationDuration: number;
  breakDuration: number;
  workingDays: number[];
}

const DoctorAvailabilityManager = () => {
  const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [newSlot, setNewSlot] = useState<Partial<AvailabilitySlot>>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true
  });

  const daysOfWeek = [
    { value: 0, name: 'Sunday' },
    { value: 1, name: 'Monday' },
    { value: 2, name: 'Tuesday' },
    { value: 3, name: 'Wednesday' },
    { value: 4, name: 'Thursday' },
    { value: 5, name: 'Friday' },
    { value: 6, name: 'Saturday' }
  ];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        // Mock schedule data for now
        setSchedule({
          id: 'schedule-1',
          doctorId: data.data.user.id,
          availability: [
            { id: '1', dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { id: '2', dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { id: '3', dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { id: '4', dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { id: '5', dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { id: '6', dayOfWeek: 6, dayName: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: false },
            { id: '7', dayOfWeek: 0, dayName: 'Sunday', startTime: '00:00', endTime: '00:00', isAvailable: false }
          ],
          consultationDuration: 30,
          breakDuration: 15,
          workingDays: [1, 2, 3, 4, 5]
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!schedule || !newSlot.dayOfWeek || !newSlot.startTime || !newSlot.endTime) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/doctors/availability', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dayOfWeek: newSlot.dayOfWeek,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          isAvailable: newSlot.isAvailable
        })
      });

      if (response.ok) {
        await fetchSchedule();
        setIsAddSlotOpen(false);
        setNewSlot({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true });
      }
    } catch (error) {
      console.error('Error adding slot:', error);
    }
  };

  const handleUpdateSlot = async (slot: AvailabilitySlot) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/doctors/availability/${slot.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slot)
      });

      if (response.ok) {
        await fetchSchedule();
      }
    } catch (error) {
      console.error('Error updating slot:', error);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/doctors/availability/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchSchedule();
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  const toggleAvailability = (slot: AvailabilitySlot) => {
    const updatedSlot = { ...slot, isAvailable: !slot.isAvailable };
    handleUpdateSlot(updatedSlot);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Availability Schedule</span>
              </CardTitle>
              <CardDescription>Manage your working hours and availability</CardDescription>
            </div>
            <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Availability Slot</DialogTitle>
                  <DialogDescription>
                    Add a new time slot for patient appointments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <Select value={newSlot.dayOfWeek?.toString()} onValueChange={(value) => setNewSlot(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newSlot.isAvailable}
                      onCheckedChange={(checked) => setNewSlot(prev => ({ ...prev, isAvailable: checked }))}
                    />
                    <Label>Available for appointments</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddSlotOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSlot}>
                    <Save className="w-4 h-4 mr-2" />
                    Add Slot
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your availability schedule determines when patients can book appointments with you.
              Make sure to keep it updated to avoid scheduling conflicts.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const daySlots = schedule?.availability.filter(slot => slot.dayOfWeek === day.value) || [];
              return (
                <div key={day.value} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{day.name}</h3>
                    <div className="flex items-center space-x-2">
                      {daySlots.length > 0 ? (
                        <Badge variant={daySlots.some(slot => slot.isAvailable) ? "default" : "secondary"}>
                          {daySlots.some(slot => slot.isAvailable) ? "Available" : "Unavailable"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Set</Badge>
                      )}
                    </div>
                  </div>
                  
                  {daySlots.length === 0 ? (
                    <p className="text-gray-500 text-sm">No time slots configured</p>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {slot.isAvailable ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-sm text-gray-600">
                                {slot.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={slot.isAvailable}
                              onCheckedChange={() => toggleAvailability(slot)}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSlot(slot)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Schedule Settings</span>
          </CardTitle>
          <CardDescription>Configure default appointment settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="consultationDuration">Consultation Duration (minutes)</Label>
              <Input
                id="consultationDuration"
                type="number"
                value={schedule?.consultationDuration || 30}
                onChange={(e) => setSchedule(prev => prev ? { ...prev, consultationDuration: parseInt(e.target.value) } : null)}
                min="15"
                max="120"
                step="15"
              />
              <p className="text-sm text-gray-500 mt-1">
                Default duration for each appointment
              </p>
            </div>
            <div>
              <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
              <Input
                id="breakDuration"
                type="number"
                value={schedule?.breakDuration || 15}
                onChange={(e) => setSchedule(prev => prev ? { ...prev, breakDuration: parseInt(e.target.value) } : null)}
                min="0"
                max="60"
                step="5"
              />
              <p className="text-sm text-gray-500 mt-1">
                Break time between appointments
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Slot Dialog */}
      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Slot</DialogTitle>
            <DialogDescription>
              Update the availability slot details
            </DialogDescription>
          </DialogHeader>
          {editingSlot && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editDay">Day of Week</Label>
                <Select value={editingSlot.dayOfWeek.toString()} onValueChange={(value) => setEditingSlot(prev => prev ? { ...prev, dayOfWeek: parseInt(value) } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStartTime">Start Time</Label>
                  <Input
                    id="editStartTime"
                    type="time"
                    value={editingSlot.startTime}
                    onChange={(e) => setEditingSlot(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="editEndTime">End Time</Label>
                  <Input
                    id="editEndTime"
                    type="time"
                    value={editingSlot.endTime}
                    onChange={(e) => setEditingSlot(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSlot.isAvailable}
                  onCheckedChange={(checked) => setEditingSlot(prev => prev ? { ...prev, isAvailable: checked } : null)}
                />
                <Label>Available for appointments</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSlot(null)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingSlot) {
                handleUpdateSlot(editingSlot);
                setEditingSlot(null);
              }
            }}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAvailabilityManager;

