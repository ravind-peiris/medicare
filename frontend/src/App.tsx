import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/UserAuth';
import MediPulseLanding from './pages/MediPulseLanding';
import MediPulseLogin from './pages/MediPulseLogin';
import MediPulseRegister from './pages/MediPulseRegister';
import Index from './pages/Index';
import PatientPortal from './pages/PatientPortal';
import DoctorPortal from './pages/DoctorPortal';
import ManagerDashboard from './pages/ManagerDashboard';
import ReceptionistPortal from './pages/ReceptionistPortal';
import DigitalHealthCard from './components/DigitalHealthCard';
import KioskInterface from './components/KioskInterface';
import HealthcareAnalytics from './components/HealthcareAnalytics';
import EnhancedPaymentSystem from './components/EnhancedPaymentSystem';
import NotFound from './pages/NotFound';
import AppointmentDetails from './pages/AppointmentDetails';
import BillsPage from './pages/BillsPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<MediPulseLanding />} />
            <Route path="/login" element={<MediPulseLogin />} />
            <Route path="/register" element={<MediPulseRegister />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/patient-portal" element={<PatientPortal />} />
            <Route path="/doctor-portal" element={<DoctorPortal />} />
            <Route path="/appointments/:id" element={<AppointmentDetails />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/manager-dashboard" element={<ManagerDashboard />} />
            <Route path="/receptionist-portal" element={<ReceptionistPortal />} />
            <Route path="/health-card" element={<DigitalHealthCard />} />
            <Route path="/kiosk" element={<KioskInterface />} />
            <Route path="/analytics" element={<HealthcareAnalytics />} />
            <Route path="/payment" element={<EnhancedPaymentSystem />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
