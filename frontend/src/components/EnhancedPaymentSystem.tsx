import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Shield, 
  Building, 
  Heart, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  FileText,
  Download,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Stethoscope,
  Receipt,
  Banknote,
  Smartphone
} from 'lucide-react';

interface PaymentDetails {
  amount: number;
  currency: string;
  description: string;
  patientId: string;
  appointmentId: string;
  hospitalType: 'government' | 'private';
  paymentMethod: 'card' | 'cash' | 'insurance' | 'later' | 'government';
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
    billingAddress: string;
  };
  insuranceDetails?: {
    provider: string;
    policyNumber: string;
    coverageType: string;
    expiryDate: string;
  };
}

interface BillingBreakdown {
  consultationFee: number;
  medicationCost: number;
  testCost: number;
  procedureCost: number;
  governmentCoverage: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  totalAmount: number;
}

interface EnhancedPaymentSystemProps {
  billId?: string;
  onPaymentSuccess?: () => void;
}

const EnhancedPaymentSystem = ({ billId, onPaymentSuccess }: EnhancedPaymentSystemProps) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    amount: 0,
    currency: 'USD',
    description: '',
    patientId: '',
    appointmentId: '',
    hospitalType: 'private',
    paymentMethod: 'card'
  });
  const [billingBreakdown, setBillingBreakdown] = useState<BillingBreakdown | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');

  // Mock billing breakdown
  const mockBillingBreakdown: BillingBreakdown = {
    consultationFee: 150,
    medicationCost: 75,
    testCost: 200,
    procedureCost: 300,
    governmentCoverage: 0,
    insuranceCoverage: 0,
    patientResponsibility: 725,
    totalAmount: 725
  };

  useEffect(() => {
    // Simulate loading billing details
    setTimeout(() => {
      setBillingBreakdown(mockBillingBreakdown);
      setPaymentDetails(prev => ({
        ...prev,
        amount: mockBillingBreakdown.totalAmount,
        description: 'Medical consultation and treatment'
      }));
    }, 1000);
  }, []);

  const handlePaymentMethodChange = (method: string) => {
    setPaymentDetails(prev => ({ ...prev, paymentMethod: method as any }));
  };

  const handleCardDetailsChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      cardDetails: {
        ...prev.cardDetails!,
        [field]: value
      }
    }));
  };

  const handleInsuranceDetailsChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      insuranceDetails: {
        ...prev.insuranceDetails!,
        [field]: value
      }
    }));
  };

  const calculateCoverage = () => {
    if (!billingBreakdown) return;

    const total = billingBreakdown.totalAmount;
    let governmentCoverage = 0;
    let insuranceCoverage = 0;
    let patientResponsibility = total;

    if (paymentDetails.hospitalType === 'government') {
      governmentCoverage = total;
      patientResponsibility = 0;
    } else if (paymentDetails.paymentMethod === 'insurance') {
      // Simulate insurance coverage (80% coverage)
      insuranceCoverage = total * 0.8;
      patientResponsibility = total * 0.2;
    }

    setBillingBreakdown(prev => ({
      ...prev!,
      governmentCoverage,
      insuranceCoverage,
      patientResponsibility
    }));
  };

  const processPayment = async () => {
    setLoading(true);
    setPaymentStatus('processing');

    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('success');
      setCurrentStep('confirmation');
      setLoading(false);
    }, 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-5 h-5" />;
      case 'cash': return <Banknote className="w-5 h-5" />;
      case 'insurance': return <Shield className="w-5 h-5" />;
      case 'later': return <Clock className="w-5 h-5" />;
      case 'government': return <Building className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'card': return 'text-blue-600';
      case 'cash': return 'text-green-600';
      case 'insurance': return 'text-purple-600';
      case 'later': return 'text-orange-600';
      case 'government': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Payment System</h1>
        <p className="text-gray-600">Flexible payment options for all healthcare services</p>
      </div>

      {/* Hospital Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Hospital Type
          </CardTitle>
          <CardDescription>Select the type of hospital for billing calculation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${
                paymentDetails.hospitalType === 'government' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:shadow-md'
              }`}
              onClick={() => {
                setPaymentDetails(prev => ({ ...prev, hospitalType: 'government', paymentMethod: 'government' }));
                calculateCoverage();
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Building className="w-8 h-8 text-red-600" />
                  <div>
                    <h4 className="font-semibold">Government Hospital</h4>
                    <p className="text-sm text-gray-600">Fully covered by government</p>
                    <Badge variant="destructive" className="mt-2">FREE</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                paymentDetails.hospitalType === 'private' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
              }`}
              onClick={() => {
                setPaymentDetails(prev => ({ ...prev, hospitalType: 'private', paymentMethod: 'card' }));
                calculateCoverage();
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Heart className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-semibold">Private Hospital</h4>
                    <p className="text-sm text-gray-600">Payment required</p>
                    <Badge variant="secondary" className="mt-2">PAYABLE</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Billing Breakdown */}
      {billingBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Billing Breakdown
            </CardTitle>
            <CardDescription>Detailed cost breakdown for your treatment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Consultation Fee</span>
                    <span>{formatCurrency(billingBreakdown.consultationFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medication Cost</span>
                    <span>{formatCurrency(billingBreakdown.medicationCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Test Cost</span>
                    <span>{formatCurrency(billingBreakdown.testCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Procedure Cost</span>
                    <span>{formatCurrency(billingBreakdown.procedureCost)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-green-600">
                    <span>Government Coverage</span>
                    <span>-{formatCurrency(billingBreakdown.governmentCoverage)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Insurance Coverage</span>
                    <span>-{formatCurrency(billingBreakdown.insuranceCoverage)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount</span>
                      <span>{formatCurrency(billingBreakdown.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-red-600">
                      <span>Patient Responsibility</span>
                      <span>{formatCurrency(billingBreakdown.patientResponsibility)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Selection */}
      {paymentDetails.hospitalType === 'private' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Method
            </CardTitle>
            <CardDescription>Choose your preferred payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  paymentDetails.paymentMethod === 'card' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodChange('card')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-semibold">Credit/Debit Card</h4>
                      <p className="text-sm text-gray-600">Pay securely online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  paymentDetails.paymentMethod === 'insurance' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodChange('insurance')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-purple-600" />
                    <div>
                      <h4 className="font-semibold">Insurance</h4>
                      <p className="text-sm text-gray-600">Use your insurance coverage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  paymentDetails.paymentMethod === 'cash' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodChange('cash')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Banknote className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold">Cash at Hospital</h4>
                      <p className="text-sm text-gray-600">Pay when you arrive</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  paymentDetails.paymentMethod === 'later' ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodChange('later')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-orange-600" />
                    <div>
                      <h4 className="font-semibold">Pay Later</h4>
                      <p className="text-sm text-gray-600">Pay before your appointment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Details Forms */}
      {paymentDetails.hospitalType === 'private' && paymentDetails.paymentMethod === 'card' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Card Payment Details
            </CardTitle>
            <CardDescription>Enter your card information securely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Card Number</Label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={paymentDetails.cardDetails?.cardNumber || ''}
                  onChange={(e) => handleCardDetailsChange('cardNumber', e.target.value)}
                />
              </div>
              <div>
                <Label>Cardholder Name</Label>
                <Input
                  placeholder="John Doe"
                  value={paymentDetails.cardDetails?.cardholderName || ''}
                  onChange={(e) => handleCardDetailsChange('cardholderName', e.target.value)}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  placeholder="MM/YY"
                  value={paymentDetails.cardDetails?.expiryDate || ''}
                  onChange={(e) => handleCardDetailsChange('expiryDate', e.target.value)}
                />
              </div>
              <div>
                <Label>CVV</Label>
                <Input
                  placeholder="123"
                  type="password"
                  value={paymentDetails.cardDetails?.cvv || ''}
                  onChange={(e) => handleCardDetailsChange('cvv', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Billing Address</Label>
              <Input
                placeholder="123 Main Street, City, Country"
                value={paymentDetails.cardDetails?.billingAddress || ''}
                onChange={(e) => handleCardDetailsChange('billingAddress', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentDetails.hospitalType === 'private' && paymentDetails.paymentMethod === 'insurance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Insurance Details
            </CardTitle>
            <CardDescription>Enter your insurance information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Insurance Provider</Label>
                <Input
                  placeholder="Blue Cross, Aetna, etc."
                  value={paymentDetails.insuranceDetails?.provider || ''}
                  onChange={(e) => handleInsuranceDetailsChange('provider', e.target.value)}
                />
              </div>
              <div>
                <Label>Policy Number</Label>
                <Input
                  placeholder="ABC123456789"
                  value={paymentDetails.insuranceDetails?.policyNumber || ''}
                  onChange={(e) => handleInsuranceDetailsChange('policyNumber', e.target.value)}
                />
              </div>
              <div>
                <Label>Coverage Type</Label>
                <Select value={paymentDetails.insuranceDetails?.coverageType || ''} onValueChange={(value) => handleInsuranceDetailsChange('coverageType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coverage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100%">100% Coverage</SelectItem>
                    <SelectItem value="80%">80% Coverage</SelectItem>
                    <SelectItem value="60%">60% Coverage</SelectItem>
                    <SelectItem value="40%">40% Coverage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={paymentDetails.insuranceDetails?.expiryDate || ''}
                  onChange={(e) => handleInsuranceDetailsChange('expiryDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="text-lg font-bold">{formatCurrency(billingBreakdown?.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span>Coverage Applied</span>
              <span>-{formatCurrency((billingBreakdown?.governmentCoverage || 0) + (billingBreakdown?.insuranceCoverage || 0))}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Amount to Pay</span>
                <span className="text-red-600">{formatCurrency(billingBreakdown?.patientResponsibility || 0)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {getPaymentMethodIcon(paymentDetails.paymentMethod)}
              <span>Payment Method: {paymentDetails.paymentMethod.charAt(0).toUpperCase() + paymentDetails.paymentMethod.slice(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button 
          className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
          onClick={processPayment}
          disabled={loading || (paymentDetails.hospitalType === 'private' && billingBreakdown?.patientResponsibility === 0)}
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {paymentDetails.hospitalType === 'government' ? 'Confirm Free Service' : 'Process Payment'}
            </>
          )}
        </Button>
      </div>

      {/* Payment Status */}
      {paymentStatus === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Payment Successful!</h3>
            <p className="text-green-700 mb-4">Your payment has been processed successfully.</p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90">
                <Calendar className="w-4 h-4 mr-2" />
                View Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedPaymentSystem;
