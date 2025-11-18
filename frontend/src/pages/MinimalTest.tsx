import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MinimalTest = () => {
  const [result, setResult] = useState('');

  const testRegistration = async () => {
    const testData = {
      username: 'testuser5',
      email: 'test5@example.com',
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
    };

    try {
      console.log('Sending data:', testData);
      
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      console.log('Response:', data);
      
      setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error}`);
    }
  };

  const testDebug = async () => {
    const testData = {
      username: 'testuser6',
      email: 'test6@example.com',
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
    };

    try {
      console.log('Sending debug data:', testData);
      
      const response = await fetch('http://localhost:5000/api/auth/debug-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      console.log('Debug response:', data);
      
      setResult(`Debug Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Debug Error:', error);
      setResult(`Debug Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Minimal Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testRegistration} className="w-full">
            Test Registration
          </Button>
          
          <Button onClick={testDebug} variant="outline" className="w-full">
            Test Debug Endpoint
          </Button>
          
          {result && (
            <div className="p-4 bg-gray-100 rounded">
              <pre className="text-xs overflow-auto whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MinimalTest;

