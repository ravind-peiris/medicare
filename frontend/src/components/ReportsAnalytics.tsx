import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Activity,
  Building,
  Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import apiService from '@/lib/apiService';
import { useAuth } from './UserAuth';

interface ReportData {
  patientVisits: {
    daily: { date: string; visits: number }[];
  };
  departmentStats: { department: string; patients: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

const ReportsAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState('patient-visits');
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([
    'all', 'general-medicine', 'cardiology', 'orthopedics', 'pediatrics', 'emergency'
  ]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading report data from backend...');

        // Calculate date range based on filters
        let dateFrom: string | undefined;
        let dateTo: string | undefined;

        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (dateRange) {
          case 'last-7-days':
            dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case 'last-30-days':
            dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
            break;
          case 'last-3-months':
            dateFrom = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case 'last-year':
            dateFrom = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          default:
            dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
        }

        // Get analytics data from backend
        const analyticsResponse = await apiService.dashboard.getAnalytics(dateFrom, dateTo);
        console.log('Report Analytics API Response:', analyticsResponse);

        if (analyticsResponse && analyticsResponse.data) {
          const backendData = analyticsResponse.data;

          // Update available departments based on backend data
          const backendDepartments = backendData.departmentStats ?
            backendData.departmentStats.map((dept: any) => dept._id?.toLowerCase()).filter(Boolean) : [];
          if (backendDepartments.length > 0 && !availableDepartments.includes('all')) {
            setAvailableDepartments(['all', ...backendDepartments]);
          }

          // Filter department data based on selected department
          let filteredDepartmentStats = backendData.departmentStats || [];
          if (selectedDepartment !== 'all') {
            // More flexible department name matching
            const searchTerm = selectedDepartment.toLowerCase();
            filteredDepartmentStats = filteredDepartmentStats.filter((dept: any) => {
              const deptName = dept._id?.toLowerCase() || '';
              return deptName.includes(searchTerm) || searchTerm.includes(deptName);
            });
          }

          // Transform backend data to match frontend expectations
          const transformedData: ReportData = {
            patientVisits: {
              daily: backendData.patientTrends ?
                backendData.patientTrends.map((trend: any, index: number) => {
                  const date = new Date();
                  date.setMonth(trend._id.month - 1);
                  date.setFullYear(trend._id.year);
                  return {
                    date: date.toISOString().split('T')[0],
                    visits: trend.count
                  };
                }) : []
            },
            departmentStats: filteredDepartmentStats.length > 0 ?
              filteredDepartmentStats.map((dept: any) => ({
                department: dept._id || 'General',
                patients: dept.doctorCount * 8, // Estimate based on doctor count
                revenue: dept.avgConsultationFee * dept.doctorCount * 40 // Estimate
              })) : [],
            monthlyRevenue: backendData.revenueTrends ?
              backendData.revenueTrends.map((trend: any, index: number) => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return {
                  month: monthNames[trend._id.month - 1] || 'Unknown',
                  revenue: trend.total
                };
              }) : []
          };

          setReportData(transformedData);
          console.log('Transformed report data:', transformedData);
        } else {
          console.warn('No report data received from backend');
          setError('No report data available. Please ensure you have data in the system.');
        }

      } catch (err) {
        console.error('Error loading report data:', err);
        let errorMessage = 'Failed to load report data. Please check your connection and try again.';

        if (err instanceof Error) {
          if (err.message.includes('401') || err.message.includes('403')) {
            errorMessage = 'Access denied. Please ensure you are logged in as a Healthcare Manager.';
          } else if (err.message.includes('404')) {
            errorMessage = 'Report endpoint not found. Please check if the backend server is running.';
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

    loadReportData();
  }, [dateRange, selectedDepartment, selectedReportType]); // Re-fetch when any filter changes

  const generateReport = async () => {
    setIsGenerating(true);
    try {
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
      yPosition += addText('MediPulse Reports & Analytics', margin, yPosition, 20, true);
      yPosition += 5;

      // Report generation info
      const currentDate = new Date().toLocaleDateString();
      const reportTypeText = `Report Type: ${selectedReportType === 'patient-visits' ? 'Patient Visits' :
                           selectedReportType === 'revenue' ? 'Revenue Analysis' :
                           selectedReportType === 'department-performance' ? 'Department Performance' : 'Staff Allocation'}`;
      const dateRangeText = `Date Range: ${dateRange === 'last-7-days' ? 'Last 7 Days' :
                           dateRange === 'last-30-days' ? 'Last 30 Days' :
                           dateRange === 'last-3-months' ? 'Last 3 Months' : 'Last Year'}`;
      const departmentText = `Department: ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}`;

      yPosition += addText(`Generated on: ${currentDate}`, margin, yPosition, 10);
      yPosition += addText(reportTypeText, margin, yPosition + 5, 10);
      yPosition += addText(dateRangeText, margin, yPosition + 5, 10);
      yPosition += addText(departmentText, margin, yPosition + 5, 10);
      yPosition += 10;

      if (reportData) {
        // Key Metrics Section
        if (checkPageBreak(60)) yPosition = margin;
        yPosition += addText('KEY METRICS', margin, yPosition, 16, true);
        yPosition += 10;

        const totalPatients = reportData.patientVisits?.daily ?
          reportData.patientVisits.daily.reduce((sum, day) => sum + day.visits, 0) : 0;
        const totalRevenue = reportData.monthlyRevenue ?
          reportData.monthlyRevenue[reportData.monthlyRevenue.length - 1]?.revenue || 0 : 0;

        const metrics = [
          { label: 'Total Patients', value: formatNumber(totalPatients) },
          { label: 'Total Appointments', value: formatNumber(totalPatients) },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Average Wait Time', value: '18 minutes' },
          { label: 'Patient Satisfaction', value: '4.7/5.0' }
        ];

        metrics.forEach((metric, index) => {
          if (checkPageBreak(15)) yPosition = margin;
          yPosition += addText(`${metric.label}: ${metric.value}`, margin, yPosition, 12, true);
          yPosition += addText('', margin, yPosition, 12); // Empty line
        });

        yPosition += 10;

        // Department Performance
        if (reportData.departmentStats.length > 0) {
          if (checkPageBreak(50)) yPosition = margin;
          yPosition += addText('DEPARTMENT PERFORMANCE', margin, yPosition, 14, true);
          yPosition += 10;

          reportData.departmentStats.forEach((dept) => {
            if (checkPageBreak(20)) yPosition = margin;
            yPosition += addText(`${dept.department}:`, margin, yPosition, 12, true);
            yPosition += addText(`  Patients: ${formatNumber(dept.patients)}`, margin + 5, yPosition, 10);
            yPosition += addText(`  Revenue: ${formatCurrency(dept.revenue)}`, margin + 5, yPosition + 4, 10);
            yPosition += 8;
          });
        }

        // Monthly Revenue Trends
        if (reportData.monthlyRevenue.length > 0) {
          if (checkPageBreak(50)) yPosition = margin;
          yPosition += addText('MONTHLY REVENUE TRENDS', margin, yPosition, 14, true);
          yPosition += 10;

          reportData.monthlyRevenue.forEach((trend) => {
            if (checkPageBreak(15)) yPosition = margin;
            yPosition += addText(`${trend.month}: ${formatCurrency(trend.revenue)}`, margin, yPosition, 10);
            yPosition += 6;
          });
        }

        // Patient Visits Data
        if (reportData.patientVisits?.daily.length > 0) {
          if (checkPageBreak(50)) yPosition = margin;
          yPosition += addText('DAILY PATIENT VISITS', margin, yPosition, 14, true);
          yPosition += 10;

          reportData.patientVisits.daily.forEach((visit) => {
            if (checkPageBreak(15)) yPosition = margin;
            yPosition += addText(`${visit.date}: ${visit.visits} patients`, margin, yPosition, 10);
            yPosition += 6;
          });
        }
      }

      // Save the PDF
      const fileName = `reports-analytics-${selectedReportType}-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      console.log('PDF report generated successfully:', fileName);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const exportReport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      generateReport();
    } else {
      // For Excel export, you could implement CSV download or similar
      alert(`Excel export functionality would be implemented here. Current report type: ${selectedReportType}`);
    }
  };

  const getFilteredData = () => {
    // Use real data if available, fallback to mock data for development
    if (reportData) {
      return reportData;
    }

    // Fallback mock data for development when backend is not available
    return {
      patientVisits: {
        daily: [
          { date: '2024-09-20', visits: 45 },
          { date: '2024-09-21', visits: 52 },
          { date: '2024-09-22', visits: 38 },
          { date: '2024-09-23', visits: 61 },
          { date: '2024-09-24', visits: 48 },
          { date: '2024-09-25', visits: 55 },
          { date: '2024-09-26', visits: 42 }
        ]
      },
      departmentStats: [
        { department: 'General Medicine', patients: 120, revenue: 18000 },
        { department: 'Cardiology', patients: 85, revenue: 25000 },
        { department: 'Orthopedics', patients: 65, revenue: 195000 },
        { department: 'Pediatrics', patients: 95, revenue: 142500 }
      ],
      monthlyRevenue: [
        { month: 'Jan', revenue: 450000 },
        { month: 'Feb', revenue: 520000 },
        { month: 'Mar', revenue: 480000 },
        { month: 'Apr', revenue: 610000 },
        { month: 'May', revenue: 580000 },
        { month: 'Jun', revenue: 650000 },
        { month: 'Jul', revenue: 720000 },
        { month: 'Aug', revenue: 680000 },
        { month: 'Sep', revenue: 750000 }
      ]
    };
  };

  const reportTypes = [
    { value: 'patient-visits', label: 'Patient Visits', icon: Users },
    { value: 'revenue', label: 'Revenue Analysis', icon: DollarSign },
    { value: 'department-performance', label: 'Department Performance', icon: Building },
    { value: 'staff-allocation', label: 'Staff Allocation', icon: Activity }
  ];

  const departments = [
    'All Departments',
    'General Medicine',
    'Cardiology',
    'Orthopedics',
    'Pediatrics',
    'Emergency'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate insights and reports for healthcare management</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Report Filters</span>
          </CardTitle>
          <CardDescription>Customize your report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepartments
                    .filter(dept => dept !== 'all')
                    .map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept.charAt(0).toUpperCase() + dept.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold">
                  {reportData?.patientVisits?.daily ?
                    reportData.patientVisits.daily.reduce((sum, day) => sum + day.visits, 0) :
                    '0'
                  }
                </p>
                <p className="text-sm text-green-600">↑ 12% from last month</p>
              </div>
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold">
                  ₨{reportData?.monthlyRevenue ?
                    (reportData.monthlyRevenue[reportData.monthlyRevenue.length - 1]?.revenue || 0).toLocaleString() :
                    '0'
                  }
                </p>
                <p className="text-sm text-green-600">↑ 8% from last month</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Appointments</p>
                <p className="text-3xl font-bold">
                  {reportData?.patientVisits?.daily ?
                    reportData.patientVisits.daily.reduce((sum, day) => sum + day.visits, 0) :
                    '0'
                  }
                </p>
                <p className="text-sm text-blue-600">↑ 5% from last month</p>
              </div>
              <Calendar className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="visits" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visits">Patient Visits</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Patient Visits Tab */}
        <TabsContent value="visits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Patient Visits</CardTitle>
              <CardDescription>Patient visit trends over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getFilteredData().patientVisits.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visits" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
              <CardDescription>Revenue growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getFilteredData().monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₨${value}`, 'Revenue']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Patient count and revenue by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getFilteredData().departmentStats.map((dept, index) => (
                    <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{dept.department}</p>
                          <p className="text-sm text-gray-600">{dept.patients} patients</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₨{dept.revenue.toLocaleString()}</p>
                        <Badge variant="outline">
                          {((dept.revenue / getFilteredData().departmentStats.reduce((sum, d) => sum + d.revenue, 0)) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Revenue breakdown by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getFilteredData().departmentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ department, revenue }) => 
                        `${department}: ₨${(revenue / 1000).toFixed(0)}K`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {getFilteredData().departmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₨${value}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Important metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Patient Satisfaction</p>
                      <p className="text-sm text-gray-600">Average rating</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">4.7/5</p>
                      <p className="text-sm text-green-600">↑ 0.2 from last month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Bed Occupancy Rate</p>
                      <p className="text-sm text-gray-600">Current utilization</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">78%</p>
                      <p className="text-sm text-blue-600">↑ 5% from last month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Staff Efficiency</p>
                      <p className="text-sm text-gray-600">Patients per staff per day</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">12.4</p>
                      <p className="text-sm text-purple-600">↑ 8% from last month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Emergency Response Time</p>
                      <p className="text-sm text-gray-600">Average response time</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">4.2min</p>
                      <p className="text-sm text-green-600">↓ 12% from last month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Operational Insights</CardTitle>
                <CardDescription>Data-driven recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Peak Hours Optimization</p>
                        <p className="text-sm text-blue-700">
                          Consider adding 2 more staff during 2-4 PM peak hours to reduce wait times.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Users className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Cardiology Department Growth</p>
                        <p className="text-sm text-green-700">
                          20% increase in cardiology visits suggests need for additional specialist.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <DollarSign className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Revenue Opportunity</p>
                        <p className="text-sm text-yellow-700">
                          Preventive care programs could increase revenue by 15% based on patient demographics.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-800">Equipment Utilization</p>
                        <p className="text-sm text-purple-700">
                          MRI machine utilization at 95% - consider scheduling optimization or additional unit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsAnalytics;