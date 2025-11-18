import React from 'react';
import { AuthProvider, useAuth, LoginForm } from '@/components/UserAuth';
import Dashboard from '@/components/Dashboard';
import PatientPortal from './PatientPortal';
import DoctorPortal from './DoctorPortal';
import ManagerDashboard from './ManagerDashboard';
import ReceptionistPortal from './ReceptionistPortal';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Redirect users to their specific portals
  if (user?.role === 'Patient') {
    return <PatientPortal />;
  }
  
  if (user?.role === 'Doctor') {
    return <DoctorPortal />;
  }
  
  if (user?.role === 'Healthcare Manager') {
    return <ManagerDashboard />;
  }
  
  if (user?.role === 'Receptionist') {
    return <ReceptionistPortal />;
  }

  // Fallback to generic dashboard
  return <Dashboard />;
};

export default function Index() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}