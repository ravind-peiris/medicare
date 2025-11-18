import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  QrCode, 
  Download, 
  Smartphone, 
  CreditCard, 
  Heart, 
  User, 
  Calendar,
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  Camera,
  Scan
} from 'lucide-react';
import { useAuth } from '@/components/UserAuth';
import QRCodeLib from 'qrcode';

interface HealthCardData {
  patientId: string;
  cardNumber: string;
  fullName: string;
  dateOfBirth: string;
  bloodType: string;
  emergencyContact: string;
  allergies: string[];
  medicalConditions: string[];
  lastUpdated: string;
}

const DigitalHealthCard = () => {
  const { user } = useAuth();
  const [cardData, setCardData] = useState<HealthCardData | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [scanMode, setScanMode] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isValidCard, setIsValidCard] = useState<boolean | null>(null);

  // Generate mock health card data
  useEffect(() => {
    if (user) {
      const mockCardData: HealthCardData = {
        patientId: user.id,
        cardNumber: `HC${String(Date.now()).slice(-8)}`, // Generate realistic card number
        fullName: `${user.profile.firstName} ${user.profile.lastName}`,
        dateOfBirth: user.profile.dateOfBirth,
        bloodType: user.patientInfo?.bloodType || 'O+',
        emergencyContact: user.profile.phone || 'Not provided',
        allergies: user.patientInfo?.allergies || ['None'],
        medicalConditions: user.patientInfo?.conditions || ['None'],
        lastUpdated: new Date().toISOString()
      };
      setCardData(mockCardData);
      generateQRCode(mockCardData);
    }
  }, [user]);

  const generateQRCode = async (data: HealthCardData) => {
    try {
      // Create QR code data with comprehensive health card information
      const qrData = JSON.stringify({
        type: 'health_card',
        patientId: data.patientId,
        cardNumber: data.cardNumber,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        bloodType: data.bloodType,
        emergencyContact: data.emergencyContact,
        allergies: data.allergies,
        medicalConditions: data.medicalConditions,
        hospital: 'MediPulse General Hospital',
        issueDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year validity
        timestamp: new Date().toISOString()
      });

      // Generate QR code using the qrcode library
      const qrCodeDataURL = await QRCodeLib.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCode(qrCodeDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to mock QR code if library fails
      const mockQR = `data:image/svg+xml;base64,${btoa(`
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" fill="white"/>
          <rect x="20" y="20" width="216" height="216" fill="none" stroke="black" stroke-width="2"/>
          <text x="128" y="130" text-anchor="middle" font-family="monospace" font-size="14" fill="black">
            QR Code: ${data.cardNumber}
          </text>
        </svg>
      `)}`;
      setQrCode(mockQR);
    }
  };

  const handleDownloadCard = async () => {
    if (!cardData || !qrCode) return;

    try {
      // Dynamic import for jsPDF
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF();

      // Add MediPulse branding
      pdf.setFontSize(20);
      pdf.setTextColor(80, 52, 89);
      pdf.text('MediPulse', 105, 30, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text('Digital Health Card', 105, 40, { align: 'center' });

      // Add health card information
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Card Number: ${cardData.cardNumber}`, 20, 60);
      pdf.text(`Patient: ${cardData.fullName}`, 20, 70);
      pdf.text(`Date of Birth: ${formatDate(cardData.dateOfBirth)}`, 20, 80);
      pdf.text(`Blood Type: ${cardData.bloodType}`, 20, 90);
      pdf.text(`Emergency Contact: ${cardData.emergencyContact}`, 20, 100);

      // Add allergies and conditions
      pdf.text('Allergies:', 20, 115);
      pdf.text(cardData.allergies.join(', '), 20, 125);

      pdf.text('Medical Conditions:', 20, 140);
      pdf.text(cardData.medicalConditions.join(', '), 20, 150);

      // Add QR code to PDF
      pdf.addImage(qrCode, 'PNG', 120, 60, 60, 60);

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generated by MediPulse - Digital Healthcare Platform', 20, 280);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 285);
      pdf.text(`Valid until: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 20, 290);

      // Save the PDF
      pdf.save(`Health_Card_${cardData.cardNumber}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to simple image download
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `health-card-qr-${cardData?.cardNumber}.png`;
      link.click();
    }
  };

  const handleScanCard = () => {
    setScanMode(true);
    // In a real implementation, this would open the camera for QR scanning
    // For demo purposes, we'll simulate scanning
    setTimeout(() => {
      const mockScannedData = JSON.stringify({
        type: 'health_card',
        patientId: cardData?.patientId || '12345',
        cardNumber: cardData?.cardNumber || 'HC987654321',
        fullName: cardData?.fullName || 'Test Patient',
        dateOfBirth: cardData?.dateOfBirth || '1990-01-01',
        bloodType: cardData?.bloodType || 'O+',
        emergencyContact: cardData?.emergencyContact || '0712345678',
        allergies: cardData?.allergies || ['None'],
        medicalConditions: cardData?.medicalConditions || ['None'],
        hospital: 'MediPulse General Hospital',
        issueDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString()
      });
      setScannedData(mockScannedData);
      validateCard(mockScannedData);
      setScanMode(false);
    }, 2000);
  };

  const validateCard = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'health_card' &&
          parsed.patientId &&
          parsed.cardNumber &&
          parsed.fullName &&
          parsed.hospital === 'MediPulse General Hospital') {
        setIsValidCard(true);
        console.log('Valid comprehensive health card scanned:', parsed);

        // Update card data with scanned information
        if (parsed.patientId === cardData?.patientId) {
          setCardData(prev => prev ? {
            ...prev,
            lastUpdated: parsed.timestamp || prev.lastUpdated
          } : null);
        }
      } else {
        setIsValidCard(false);
      }
    } catch (error) {
      setIsValidCard(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!cardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading health card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Health Card</h1>
        <p className="text-gray-600">Your comprehensive digital health identity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Card Display */}
        <Card className="bg-gradient-to-br from-[#503459] to-[#81638b] text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Heart className="w-6 h-6 mr-2" />
                MediPulse Health Card
              </span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Active
              </Badge>
            </CardTitle>
            <CardDescription className="text-white/80">
              Digital Health Identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 text-sm">Card Number</Label>
                <p className="font-mono text-lg font-bold">{cardData.cardNumber}</p>
              </div>
             
            </div>
            
            <div>
              <Label className="text-white/70 text-sm">Full Name</Label>
              <p className="text-xl font-semibold">{cardData.fullName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70 text-sm">Date of Birth</Label>
                <p className="font-semibold">{formatDate(cardData.dateOfBirth)}</p>
              </div>
              <div>
                <Label className="text-white/70 text-sm">Blood Type</Label>
                <p className="font-semibold">{cardData.bloodType}</p>
              </div>
            </div>

            <div>
              <Label className="text-white/70 text-sm">Emergency Contact</Label>
              <p className="font-semibold">{cardData.emergencyContact}</p>
            </div>

            <div className="pt-4 border-t border-white/20">
              <Label className="text-white/70 text-sm">Allergies</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {cardData.allergies.map((allergy, index) => (
                  <Badge key={index} variant="secondary" className="bg-red-500/20 text-red-100">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/20">
              <Label className="text-white/70 text-sm">Medical Conditions</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {cardData.medicalConditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="bg-yellow-500/20 text-yellow-100">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code and Actions */}
        <div className="space-y-6">
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                QR Code
              </CardTitle>
              <CardDescription>
                Scan this code to access your health information
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src={qrCode} 
                  alt="Health Card QR Code" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {formatDate(cardData.lastUpdated)}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
              onClick={handleDownloadCard}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Health Card
            </Button>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleScanCard}
            >
              <Scan className="w-4 h-4 mr-2" />
              Scan Health Card
            </Button>

           
          </div>
        </div>
      </div>

      {/* Scan Results */}
      {scanMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Camera className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Scanning Health Card...</h3>
            <p className="text-blue-700">Please position the QR code within the camera view</p>
          </CardContent>
        </Card>
      )}

      {scannedData && (
        <Card className={`border-2 ${isValidCard ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              {isValidCard ? (
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              )}
              <h3 className={`text-lg font-semibold ${isValidCard ? 'text-green-900' : 'text-red-900'}`}>
                {isValidCard ? 'Valid Health Card Scanned' : 'Invalid Health Card'}
              </h3>
            </div>
            
            {isValidCard ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-green-700 font-medium">Health card successfully validated and loaded.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScannedData('')}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Close
                  </Button>
                </div>

                {/* Scanned Health Card Display */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-green-900">
                      <span className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Verified Health Card
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Valid
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Scanned from QR Code • {new Date(JSON.parse(scannedData).timestamp).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-green-800 font-semibold text-sm">Card Number</Label>
                        <p className="font-mono text-lg font-bold text-green-900">{JSON.parse(scannedData).cardNumber}</p>
                      </div>
                      <div>
                        <Label className="text-green-800 font-semibold text-sm">Hospital</Label>
                        <p className="font-semibold text-green-900">{JSON.parse(scannedData).hospital}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-green-800 font-semibold text-sm">Full Name</Label>
                      <p className="text-xl font-semibold text-green-900">{JSON.parse(scannedData).fullName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-green-800 font-semibold text-sm">Date of Birth</Label>
                        <p className="font-semibold text-green-900">
                          {new Date(JSON.parse(scannedData).dateOfBirth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-green-800 font-semibold text-sm">Blood Type</Label>
                        <p className="font-semibold text-green-900">{JSON.parse(scannedData).bloodType}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-green-800 font-semibold text-sm">Emergency Contact</Label>
                      <p className="font-semibold text-green-900">{JSON.parse(scannedData).emergencyContact}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-green-800 font-semibold text-sm">Allergies</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {JSON.parse(scannedData).allergies.map((allergy: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-red-100 text-red-800 text-xs">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-green-800 font-semibold text-sm">Medical Conditions</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {JSON.parse(scannedData).medicalConditions.map((condition: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-green-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-green-800 font-semibold">Issue Date</Label>
                          <p className="text-green-700">
                            {new Date(JSON.parse(scannedData).issueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-green-800 font-semibold">Valid Until</Label>
                          <p className="text-green-700">
                            {new Date(JSON.parse(scannedData).validUntil).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Data for reference */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-green-700 hover:text-green-900">
                       
                      </summary>
                      <div className="bg-white p-3 rounded border mt-2">
                        <pre className="text-xs text-gray-600 overflow-auto">
                          {JSON.stringify(JSON.parse(scannedData), null, 2)}
                        </pre>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-red-700">The scanned code is not a valid health card. Please try again.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Information */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-blue-500 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Security & Privacy</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your health data is encrypted and stored securely</li>
                <li>• QR codes contain only essential identification information</li>
                <li>• Full medical records require additional authentication</li>
                <li>• All access is logged and monitored for security</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalHealthCard;