import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestRegister = () => {
  const [formData, setFormData] = useState({
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'password123',
    role: 'Patient',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      address: '123 Test Street',
      emergencyContact: '9876543210'
    }
  });
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Sending data:', formData);
      
      const response = await fetch('http://localhost:5000/api/auth/debug-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        setResult('SUCCESS: ' + JSON.stringify(data, null, 2));
      } else {
        setResult('ERROR: ' + JSON.stringify(data, null, 2));
      }
    } catch (error) {
      setResult('NETWORK ERROR: ' + error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Password</Label>
              <Input
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>First Name</Label>
              <Input
                value={formData.profile.firstName}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, firstName: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label>Last Name</Label>
              <Input
                value={formData.profile.lastName}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, lastName: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.profile.phone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, phone: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.profile.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, dateOfBirth: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label>Gender</Label>
              <Input
                value={formData.profile.gender}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, gender: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label>Address</Label>
              <Input
                value={formData.profile.address}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, address: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label>Emergency Contact</Label>
              <Input
                value={formData.profile.emergencyContact}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, emergencyContact: e.target.value }
                }))}
              />
            </div>
            
            <Button type="submit" className="w-full">Test Register</Button>
          </form>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-xs overflow-auto">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRegister;
