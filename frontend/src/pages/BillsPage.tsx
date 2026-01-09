import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  DollarSign,
  CreditCard
} from 'lucide-react';
import EnhancedPaymentSystem from '@/components/EnhancedPaymentSystem';
import apiService from '@/lib/apiService';

interface BillData {
  id: string;
  billNumber: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  hospitalName?: string;
  consultationFee: number;
  medicationCost: number;
  testCost: number;
  procedureCost: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  description: string;
}

const BillsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const patientId = searchParams.get('patientId');
  const doctorId = searchParams.get('doctorId');
  const doctorNameFromUrl = searchParams.get('doctorName');

  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  useEffect(() => {
    const loadBillData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading bill data');

        let billInfo = null;

        if (appointmentId) {
          // Try to find existing bill for this appointment
          try {
            const response = await apiService.bills.getAll(1, 10, {
              appointmentId: appointmentId
            });
            const bills = (response.data as any).bills || response.data;
            if (bills && bills.length > 0) {
              billInfo = bills[0];
            }
          } catch (err) {
            console.log('No existing bill found, will create new one');
          }
        }

        if (billInfo) {
          // Format existing bill data
          const formattedBill: BillData = {
            id: billInfo._id,
            billNumber: billInfo.billNumber,
            patientId: billInfo.patient?._id || billInfo.patientId,
            patientName: `${billInfo.patient?.user?.profile?.firstName || 'Unknown'} ${billInfo.patient?.user?.profile?.lastName || 'Patient'}`,
            appointmentId: billInfo.appointment?._id || billInfo.appointmentId,
            appointmentDate: billInfo.appointment?.date || '',
            appointmentTime: billInfo.appointment?.time || '',
            doctorName: `Dr. ${billInfo.appointment?.doctor?.user?.profile?.firstName || 'Unknown'} ${billInfo.appointment?.doctor?.user?.profile?.lastName || ''}`,
            hospitalName: billInfo.appointment?.hospital?.name,
            consultationFee: billInfo.consultationFee || 150, // Default consultation fee
            medicationCost: billInfo.medicationCost || 0,
            testCost: billInfo.testCost || 0,
            procedureCost: billInfo.procedureCost || 0,
            totalAmount: billInfo.totalAmount || (billInfo.consultationFee || 150),
            status: billInfo.status || 'pending',
            createdAt: billInfo.createdAt,
            description: billInfo.description || 'Medical consultation and treatment'
          };
          setBillData(formattedBill);
        } else {
          // No bill or appointment data found
          setError('No bill information found for this appointment. Please contact support.');
        }
      } catch (err: any) {
        console.error('Error loading bill data:', err);
        setError('Failed to load bill information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadBillData();
  }, [appointmentId, patientId]);

  const handleCreateBill = async () => {
    if (!billData) return;

    try {
      setLoading(true);
      const billPayload = {
        appointmentId: billData.appointmentId,
        patientId: billData.patientId,
        billNumber: billData.billNumber,
        consultantFee: billData.consultationFee,
        hospitalFee: billData.totalAmount - billData.consultationFee,
        doctorName: billData.doctorName,
        hospitalName: billData.hospitalName,
        totalAmount: billData.totalAmount,
        description: billData.description
      };

      await apiService.bills.create(billPayload);
      setShowPaymentGateway(true);
    } catch (err: any) {
      console.error('Error creating bill:', err);
      setError('Failed to create bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#503459] mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading bill information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Bill</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (showPaymentGateway) {
    return <EnhancedPaymentSystem onPaymentSuccess={() => {
      setShowPaymentGateway(false);
      navigate('/patient-portal');
    }} />;
  }

  if (!billData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Bill Information</h2>
          <p className="text-gray-600 mb-4">Unable to load bill information for this appointment.</p>
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Appointments
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bill Payment</h1>
                <p className="text-sm text-gray-600">Process payment for appointment</p>
              </div>
            </div>
            <Badge variant={billData.status === 'paid' ? 'default' : 'secondary'}>
              {billData.status}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bill Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Bill Details
            </CardTitle>
            <CardDescription>Invoice #{billData.billNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* No No Patient Information */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Patient Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{billData.patientName}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{new Date(billData.appointmentDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{billData.appointmentTime}</span>
                </div>
              </div>
            </div>

            {/* Doctor & Consultation Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Consultation Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-3 text-[#503459]" />
                      <span className="font-medium">Consulting Doctor:</span>
                    </div>
                    <span className="font-bold text-lg text-[#503459]">{billData.doctorName}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                      <span className="font-medium">Appointment:</span>
                    </div>
                    <span>{new Date(billData.appointmentDate).toLocaleDateString()} at {billData.appointmentTime}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Payment Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-3 text-green-600" />
                      <span className="font-medium">Consultation Fee:</span>
                    </div>
                    <span className="font-bold text-xl text-green-600">${billData.consultationFee}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Additional Costs:</span>
                    <span>${billData.medicationCost + billData.testCost + billData.procedureCost}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Amount & Payment */}
            <div className="bg-gradient-to-r from-[#503459] to-[#81638b] text-white p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Total Amount Due</h3>
                  <p className="text-sm opacity-90">Consultation and additional services</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">${billData.totalAmount}</div>
                  <div className="text-sm opacity-90">USD</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              {billData.status === 'pending' && (
                <Button
                  className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90 px-8 py-3 text-lg font-semibold"
                  onClick={handleCreateBill}
                  disabled={loading}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {loading ? 'Processing...' : `Pay $${billData.totalAmount} Now`}
                </Button>
              )}
              {billData.status === 'paid' && (
                <Button disabled className="bg-green-600 px-8 py-3 text-lg font-semibold">
                  ✓ Payment Completed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


export default BillsPage;
