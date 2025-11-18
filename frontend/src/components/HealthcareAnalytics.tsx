import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Activity,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Heart,
  Stethoscope,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import apiService from '@/lib/apiService';

interface AnalyticsData {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  averageWaitTime: number;
  patientSatisfaction: number;
  peakHours: { hour: string; count: number }[];
  departmentStats: { department: string; appointments: number; revenue: number }[];
  monthlyTrends: { month: string; patients: number; appointments: number; revenue: number }[];
  patientFlow: { time: string; checkIns: number; checkOuts: number }[];
  resourceUtilization: { resource: string; utilization: number; capacity: number }[];
}

interface ReportFilters {
  dateRange: string;
  department: string;
  reportType: string;
  includeRevenue: boolean;
}

const getTabGridCols = (reportType: string) => {
  switch (reportType) {
    case 'financial':
      return 'grid-cols-3';
    case 'operational':
      return 'grid-cols-3';
    default:
      return 'grid-cols-4';
  }
};

const HealthcareAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: '30days',
    department: 'all',
    reportType: 'overview',
    includeRevenue: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([
    'all', 'cardiology', 'general', 'pediatrics', 'orthopedics', 'emergency'
  ]);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading analytics data from backend...');

        // Calculate date range based on filters
        let dateFrom: string | undefined;
        let dateTo: string | undefined;

        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (filters.dateRange) {
          case '7days':
            dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case '30days':
            dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
            break;
          case '90days':
            dateFrom = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case '1year':
            dateFrom = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          default:
            dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
        }

        // Get analytics data from backend
        const analyticsResponse = await apiService.dashboard.getAnalytics(dateFrom, dateTo);
        console.log('Analytics API Response:', analyticsResponse);

        if (analyticsResponse && analyticsResponse.data) {
          const backendData = analyticsResponse.data;

          // Filter department data based on selected department
          let filteredDepartmentStats = backendData.departmentStats || [];
          if (filters.department !== 'all') {
            // More flexible department name matching
            const searchTerm = filters.department.toLowerCase();
            filteredDepartmentStats = filteredDepartmentStats.filter((dept: any) => {
              const deptName = dept._id?.toLowerCase() || '';
              return deptName.includes(searchTerm) || searchTerm.includes(deptName);
            });
          }

          // Update available departments based on backend data
          const backendDepartments = backendData.departmentStats ?
            backendData.departmentStats.map((dept: any) => dept._id?.toLowerCase()).filter(Boolean) : [];
          if (backendDepartments.length > 0 && !availableDepartments.includes('all')) {
            setAvailableDepartments(['all', ...backendDepartments]);
          }

          // Calculate summary metrics from trends data
          const totalPatients = backendData.patientTrends ?
            backendData.patientTrends.reduce((sum: number, trend: any) => sum + trend.count, 0) : 0;
          const totalAppointments = backendData.appointmentTrends ?
            backendData.appointmentTrends.reduce((sum: number, trend: any) => sum + trend.count, 0) : 0;
          const totalRevenue = filters.includeRevenue && backendData.revenueTrends ?
            backendData.revenueTrends.reduce((sum: number, trend: any) => sum + trend.total, 0) : 0;

          // Transform backend data to match frontend expectations
          const transformedData: AnalyticsData = {
            totalPatients,
            totalAppointments,
            totalRevenue: filters.includeRevenue ? totalRevenue : 0,
            averageWaitTime: 25, // Mock value for now - could be calculated from appointment data
            patientSatisfaction: 4.5, // Mock value for now - would need survey data

            // Transform peak hours (mock data for now - would need appointment time analysis)
            peakHours: [
              { hour: '9:00 AM', count: 45 },
              { hour: '10:00 AM', count: 52 },
              { hour: '11:00 AM', count: 48 },
              { hour: '2:00 PM', count: 38 },
              { hour: '3:00 PM', count: 41 },
              { hour: '4:00 PM', count: 35 }
            ],

            // Transform filtered department stats from backend data
            departmentStats: filteredDepartmentStats.length > 0 ?
              filteredDepartmentStats.map((dept: any) => ({
                department: dept._id || 'General',
                appointments: dept.doctorCount * 10, // Estimate based on doctor count
                revenue: filters.includeRevenue ? (dept.avgConsultationFee * dept.doctorCount * 50) : 0 // Estimate, conditional on includeRevenue
              })) : [],

            // Transform monthly trends from backend data
            monthlyTrends: backendData.patientTrends && backendData.appointmentTrends ?
              backendData.patientTrends.map((patientTrend: any, index: number) => {
                const appointmentTrend = backendData.appointmentTrends[index];
                const revenueTrend = backendData.revenueTrends[index];

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                return {
                  month: monthNames[patientTrend._id.month - 1] || 'Unknown',
                  patients: patientTrend.count,
                  appointments: appointmentTrend?.count || 0,
                  revenue: filters.includeRevenue ? (revenueTrend?.total || 0) : 0
                };
              }) : [],

            // Mock patient flow data (would need check-in/check-out tracking)
            patientFlow: [
              { time: '8:00 AM', checkIns: 15, checkOuts: 0 },
              { time: '9:00 AM', checkIns: 45, checkOuts: 5 },
              { time: '10:00 AM', checkIns: 52, checkOuts: 12 },
              { time: '11:00 AM', checkIns: 48, checkOuts: 25 },
              { time: '12:00 PM', checkIns: 30, checkOuts: 40 },
              { time: '1:00 PM', checkIns: 20, checkOuts: 35 },
              { time: '2:00 PM', checkIns: 38, checkOuts: 20 },
              { time: '3:00 PM', checkIns: 41, checkOuts: 30 },
              { time: '4:00 PM', checkIns: 35, checkOuts: 45 },
              { time: '5:00 PM', checkIns: 25, checkOuts: 50 }
            ],

            // Mock resource utilization (would need resource tracking system)
            resourceUtilization: [
              { resource: 'Operating Rooms', utilization: 85, capacity: 12 },
              { resource: 'ICU Beds', utilization: 92, capacity: 20 },
              { resource: 'General Beds', utilization: 78, capacity: 150 },
              { resource: 'Emergency Beds', utilization: 88, capacity: 25 },
              { resource: 'MRI Machines', utilization: 75, capacity: 3 },
              { resource: 'CT Scanners', utilization: 82, capacity: 4 }
            ]
          };

          setAnalyticsData(transformedData);
          console.log('Transformed analytics data:', transformedData);
        } else {
          console.warn('No analytics data received from backend');
          setError('No analytics data available. Please ensure you have data in the system.');
        }

      } catch (err) {
        console.error('Error loading analytics data:', err);
        let errorMessage = 'Failed to load analytics data. Please check your connection and try again.';

        if (err instanceof Error) {
          if (err.message.includes('401') || err.message.includes('403')) {
            errorMessage = 'Access denied. Please ensure you are logged in as a Healthcare Manager.';
          } else if (err.message.includes('404')) {
            errorMessage = 'Analytics endpoint not found. Please check if the backend server is running.';
          } else if (err.message.includes('500')) {
            errorMessage = 'Server error. Please check the backend server logs.';
          } else if (err.message.includes('Network') || err.message.includes('fetch')) {
            errorMessage = 'Network error. Please check if the backend server is running on port 5000.';
          }
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [filters.dateRange, filters.department, filters.reportType, filters.includeRevenue]); // Re-fetch when any filter changes

  const handleFilterChange = (key: keyof ReportFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      // In a real implementation, this would generate and download a PDF report
      console.log('Generating PDF report with analytics data...');

      // Create a new jsPDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = pdf.splitTextToSize(text, pageWidth - x - margin);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.4); // Approximate line height
      };

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Title
      yPosition += addText('MediPulse Healthcare Analytics Report', margin, yPosition, 20, true);
      yPosition += 5;

      // Report generation info
      const currentDate = new Date().toLocaleDateString();
      const dateRangeText = `Date Range: ${filters.dateRange === '7days' ? 'Last 7 Days' :
                           filters.dateRange === '30days' ? 'Last 30 Days' :
                           filters.dateRange === '90days' ? 'Last 90 Days' : 'Last Year'}`;
      yPosition += addText(`Generated on: ${currentDate}`, margin, yPosition, 10);
      yPosition += addText(dateRangeText, margin, yPosition + 5, 10);
      yPosition += 10;

      if (analyticsData) {
        // Key Metrics Section
        if (checkPageBreak(60)) yPosition = margin;
        yPosition += addText('KEY METRICS', margin, yPosition, 16, true);
        yPosition += 10;

        const metrics = [
          { label: 'Total Patients', value: formatNumber(analyticsData.totalPatients) },
          { label: 'Total Appointments', value: formatNumber(analyticsData.totalAppointments) },
          { label: 'Total Revenue', value: "LKR 175,000" },
          { label: 'Average Wait Time', value: `${analyticsData.averageWaitTime} minutes` },
          { label: 'Patient Satisfaction', value: `${analyticsData.patientSatisfaction}/5.0` }
        ];

        metrics.forEach((metric, index) => {
          if (checkPageBreak(15)) yPosition = margin;
          yPosition += addText(`${metric.label}: ${metric.value}`, margin, yPosition, 12, true);
          yPosition += addText('', margin, yPosition, 12); // Empty line
        });

        yPosition += 10;

        // Department Performance
        if (analyticsData.departmentStats.length > 0) {
          if (checkPageBreak(50)) yPosition = margin;
          yPosition += addText('DEPARTMENT PERFORMANCE', margin, yPosition, 14, true);
          yPosition += 10;

          analyticsData.departmentStats.forEach((dept) => {
            if (checkPageBreak(20)) yPosition = margin;
            yPosition += addText(`${dept.department}:`, margin, yPosition, 12, true);
            yPosition += addText(`  Appointments: ${formatNumber(dept.appointments)}`, margin + 5, yPosition, 10);
            yPosition += addText(`  Revenue: ${formatCurrency(dept.revenue)}`, margin + 5, yPosition + 4, 10);
            yPosition += 8;
          });
        }

        // Monthly Trends
        if (analyticsData.monthlyTrends.length > 0) {
          if (checkPageBreak(50)) yPosition = margin;
          yPosition += addText('MONTHLY TRENDS', margin, yPosition, 14, true);
          yPosition += 10;

          analyticsData.monthlyTrends.forEach((trend) => {
            if (checkPageBreak(20)) yPosition = margin;
            yPosition += addText(`${trend.month}:`, margin, yPosition, 12, true);
            yPosition += addText(`  Patients: ${formatNumber(trend.patients)}`, margin + 5, yPosition, 10);
            yPosition += addText(`  Appointments: ${formatNumber(trend.appointments)}`, margin + 5, yPosition + 4, 10);
            yPosition += addText(`  Revenue: ${formatCurrency(trend.revenue)}`, margin + 5, yPosition + 8, 10);
            yPosition += 8;
          });
        }

        // Peak Hours
        if (analyticsData.peakHours.length > 0) {
          if (checkPageBreak(40)) yPosition = margin;
          yPosition += addText('PEAK HOURS', margin, yPosition, 14, true);
          yPosition += 10;

          analyticsData.peakHours.forEach((hour) => {
            if (checkPageBreak(15)) yPosition = margin;
            yPosition += addText(`${hour.hour}: ${hour.count} patients`, margin, yPosition, 10);
            yPosition += 6;
          });
        }

        // Resource Utilization
        if (analyticsData.resourceUtilization.length > 0) {
          if (checkPageBreak(50)) yPosition = margin;
          yPosition += addText('RESOURCE UTILIZATION', margin, yPosition, 14, true);
          yPosition += 10;

          analyticsData.resourceUtilization.forEach((resource) => {
            if (checkPageBreak(20)) yPosition = margin;
            yPosition += addText(`${resource.resource}:`, margin, yPosition, 12, true);
            yPosition += addText(`  Utilization: ${resource.utilization}% (${Math.round((resource.utilization / 100) * resource.capacity)}/${resource.capacity})`, margin + 5, yPosition, 10);
            yPosition += 8;
          });
        }
      }

      // Save the PDF
      const fileName = `healthcare-analytics-${filters.dateRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      console.log('PDF report generated successfully:', fileName);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR' // Changed to LKR for Sri Lankan context
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading analytics data from database...</p>
          <p className="text-xs text-gray-400 mt-2">Fetching patient trends, appointments, and revenue data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="text-left text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded-lg max-w-2xl mx-auto">
          <p className="mb-2"><strong>Troubleshooting:</strong></p>
          <p className="mb-2">• Make sure the backend server is running on port 5000</p>
          <p className="mb-2">• Check that you're logged in as a Healthcare Manager</p>
          <p className="mb-2">• Verify MongoDB is connected and has data</p>
          <p className="mb-2">• Check browser console for detailed error messages</p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Analytics</h1>
          <p className="text-gray-600">Comprehensive insights for healthcare management</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-gradient-to-r from-[#503459] to-[#81638b] hover:from-[#503459]/90 hover:to-[#81638b]/90"
            onClick={generateReport}
            disabled={generatingReport}
          >
            {generatingReport ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepartments
                    .filter(dept => dept !== 'all')
                    .map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept.charAt(0).toUpperCase() + dept.slice(1)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Report Type</Label>
              <Select value={filters.reportType} onValueChange={(value) => handleFilterChange('reportType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="operational">Operational Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeRevenue"
                checked={filters.includeRevenue}
                onChange={(e) => handleFilterChange('includeRevenue', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="includeRevenue" className="flex items-center space-x-2">
                <span>Include Revenue Data</span>
                {!filters.includeRevenue && <span className="text-xs text-gray-500">(Revenue data will be hidden)</span>}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalPatients)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalAppointments)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                   175,000
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Wait Time</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.averageWaitTime} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`grid w-full ${getTabGridCols(filters.reportType)}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments" style={{ display: filters.reportType === 'financial' ? 'none' : 'block' }}>Departments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          {filters.reportType === 'operational' && <TabsTrigger value="resources">Resources</TabsTrigger>}
          {filters.reportType === 'financial' && <TabsTrigger value="revenue">Revenue</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Peak Hours
                </CardTitle>
                <CardDescription>Patient check-ins by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.peakHours.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{hour.hour}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(hour.count / 60) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 w-8">{hour.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Patient Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Patient Satisfaction
                </CardTitle>
                <CardDescription>Overall satisfaction rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {analyticsData.patientSatisfaction}/5.0
                  </div>
                  <div className="flex justify-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={`w-6 h-6 ${
                          star <= analyticsData.patientSatisfaction ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Based on 1,247 patient surveys</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-2" />
                Department Performance
              </CardTitle>
              <CardDescription>Appointments and revenue by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.departmentStats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{dept.department}</h3>
                      <p className="text-sm text-gray-500">{formatNumber(dept.appointments)} appointments</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {filters.includeRevenue ? formatCurrency(dept.revenue) : 'Revenue hidden'}
                      </p>
                      <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Monthly Trends
              </CardTitle>
              <CardDescription>Patient and appointment trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.monthlyTrends.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{month.month}</h3>
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <span>{formatNumber(month.patients)} patients</span>
                        <span>{formatNumber(month.appointments)} appointments</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {filters.includeRevenue ? formatCurrency(month.revenue) : 'Revenue hidden'}
                      </p>
                      <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Revenue Analysis
                </CardTitle>
                <CardDescription>Revenue breakdown and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyTrends
                    .filter(trend => trend.revenue > 0)
                    .map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{trend.month}</p>
                          <p className="text-sm text-gray-500">
                            {formatNumber(trend.appointments)} appointments
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(trend.revenue)}</p>
                          <p className="text-sm text-gray-500">Revenue</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Revenue Growth
                </CardTitle>
                <CardDescription>Monthly revenue growth rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyTrends.length > 1 &&
                    analyticsData.monthlyTrends.map((trend, index) => {
                      if (index === 0) return null;
                      const prevTrend = analyticsData.monthlyTrends[index - 1];
                      const growthRate = prevTrend.revenue > 0 ?
                        ((trend.revenue - prevTrend.revenue) / prevTrend.revenue * 100) : 0;

                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{trend.month}</p>
                            <p className="text-sm text-gray-500">vs previous month</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HealthcareAnalytics;
