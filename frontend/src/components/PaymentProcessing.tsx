import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  AlertTriangle,
  Download,
  Calendar
} from 'lucide-react';
import { Bill, Payment, Patient, mockBills, mockPayments, mockPatients } from '@/lib/mockData';
import { useAuth } from './UserAuth';
import DigitalHealthCard from './DigitalHealthCard';

const PaymentProcessing: React.FC = () => {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Insurance' | 'Card' | 'Cash'>('Card');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    // If user is a patient, load their info and skip scanner
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
    setShowScanner(false);
  };

  const getPatientBills = () => {
    if (!selectedPatient) return [];
    return bills.filter(bill => bill.patientId === selectedPatient.id);
  };

  const getPatientPayments = () => {
    if (!selectedPatient) return [];
    const patientBills = getPatientBills();
    return payments.filter(payment => 
      patientBills.some(bill => bill.id === payment.billId)
    );
  };

  const processPayment = async () => {
    if (!selectedBill) return;

    setIsProcessing(true);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const success = Math.random() > 0.1; // 90% success rate for demo

    if (success) {
      const newPayment: Payment = {
        id: `PAY${Date.now()}`,
        billId: selectedBill.id,
        amount: selectedBill.amount,
        method: paymentMethod,
        date: new Date().toISOString().split('T')[0],
        status: 'Success',
        transactionId: `TXN${Date.now()}`
      };

      setPayments(prev => [...prev, newPayment]);
      setBills(prev => prev.map(bill => 
        bill.id === selectedBill.id 
          ? { ...bill, status: 'Paid' as const, paymentMethod }
          : bill
      ));

      setNotification({ 
        type: 'success', 
        message: `Payment of ₨${selectedBill.amount.toFixed(2)} processed successfully! Receipt sent via email.` 
      });
    } else {
      setNotification({ 
        type: 'error', 
        message: 'Payment failed. Please check your details and try again.' 
      });
    }

    setIsProcessing(false);
    setShowPayment(false);
    setSelectedBill(null);
    setCardDetails({ number: '', expiry: '', cvv: '', name: '' });

    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Success': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showScanner && user?.role === 'Staff') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Processing</h2>
            <p className="text-gray-600">Process patient bills and payments</p>
          </div>
        </div>
        
        <DigitalHealthCard 
          onPatientFound={handlePatientFound}
          onScanComplete={() => setShowScanner(false)}
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
          <h2 className="text-2xl font-bold text-gray-900">Payment Processing</h2>
          <p className="text-gray-600">
            {user?.role === 'Patient' ? 'View and pay your bills' : 'Process patient payments'}
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

      {/* Notification */}
      {notification && (
        <Alert className={notification.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Patient Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-600 text-white p-3 rounded-full">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Card: {selectedPatient.cardNumber}
                  {selectedPatient.insurance && (
                    <span className="ml-2">• Insurance: {selectedPatient.insurance.provider}</span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-purple-600">
                ₨{getPatientBills()
                  .filter(bill => bill.status === 'Pending' || bill.status === 'Overdue')
                  .reduce((sum, bill) => sum + bill.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="bills" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bills">Bills & Payments</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Bills Tab */}
        <TabsContent value="bills" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Bills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5" />
                  <span>Pending Bills</span>
                </CardTitle>
                <CardDescription>Bills awaiting payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getPatientBills()
                    .filter(bill => bill.status === 'Pending' || bill.status === 'Overdue')
                    .map((bill) => (
                      <Card key={bill.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{bill.description}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{bill.date}</span>
                                </div>
                                <Badge className={getBillStatusColor(bill.status)}>
                                  {bill.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">₨{bill.amount.toFixed(2)}</p>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setShowPayment(true);
                                }}
                              >
                                Pay Now
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {getPatientBills().filter(bill => bill.status === 'Pending' || bill.status === 'Overdue').length === 0 && (
                    <p className="text-gray-500 text-center py-8">No pending bills</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Paid Bills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Paid Bills</span>
                </CardTitle>
                <CardDescription>Recently paid bills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getPatientBills()
                    .filter(bill => bill.status === 'Paid')
                    .slice(0, 5)
                    .map((bill) => (
                      <Card key={bill.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{bill.description}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{bill.date}</span>
                                </div>
                                <Badge className={getBillStatusColor(bill.status)}>
                                  {bill.status}
                                </Badge>
                                {bill.paymentMethod && (
                                  <Badge variant="outline">
                                    {bill.paymentMethod}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">₨{bill.amount.toFixed(2)}</p>
                              <Button variant="outline" size="sm">
                                <Download className="h-3 w-3 mr-1" />
                                Receipt
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {getPatientBills().filter(bill => bill.status === 'Paid').length === 0 && (
                    <p className="text-gray-500 text-center py-8">No paid bills</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getPatientPayments().map((payment) => {
                  const bill = bills.find(b => b.id === payment.billId);
                  return (
                    <Card key={payment.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${
                              payment.status === 'Success' ? 'bg-green-100 text-green-600' :
                              payment.status === 'Failed' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {payment.status === 'Success' ? <CheckCircle className="h-5 w-5" /> :
                               payment.status === 'Failed' ? <XCircle className="h-5 w-5" /> :
                               <Clock className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{bill?.description || 'Unknown Bill'}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{payment.date}</span>
                                </div>
                                <Badge className={getPaymentStatusColor(payment.status)}>
                                  {payment.status}
                                </Badge>
                                <Badge variant="outline">
                                  {payment.method}
                                </Badge>
                                {payment.transactionId && (
                                  <span className="text-xs text-gray-500">
                                    ID: {payment.transactionId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">₨{payment.amount.toFixed(2)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {getPatientPayments().length === 0 && (
                  <p className="text-gray-500 text-center py-8">No payment history</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Details */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bill Description:</span>
                      <span className="font-medium">{selectedBill.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-lg font-bold">₨{selectedBill.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span>{selectedBill.date}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: 'Insurance' | 'Card' | 'Cash') => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Card">Credit/Debit Card</SelectItem>
                    <SelectItem value="Insurance">Insurance Coverage</SelectItem>
                    <SelectItem value="Cash">Cash Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Card Details (if Card payment) */}
              {paymentMethod === 'Card' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cardholder Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Insurance Info (if Insurance payment) */}
              {paymentMethod === 'Insurance' && selectedPatient.insurance && (
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Insurance Coverage</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">Provider:</span> {selectedPatient.insurance.provider}</p>
                      <p><span className="text-gray-600">Policy:</span> {selectedPatient.insurance.policyNumber}</p>
                      <p><span className="text-gray-600">Coverage:</span> {selectedPatient.insurance.coverageType}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Process Payment Button */}
              <Button 
                onClick={processPayment}
                className="w-full"
                disabled={isProcessing || (paymentMethod === 'Card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name))}
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₨{selectedBill.amount.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentProcessing;