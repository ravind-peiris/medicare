// API service functions for Medicare Healthcare Management System

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// Authentication API
export const authAPI = {
  login: async (identifier: string, password: string, role: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role }),
    });
    return handleResponse(response);
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateProfile: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Patients API
export const patientsAPI = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/patients?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByCardNumber: async (cardNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/card/${cardNumber}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (patientData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  update: async (id: string, patientData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  addMedicalRecord: async (id: string, recordData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/medical-history`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(recordData),
    });
    return handleResponse(response);
  },

  search: async (query: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams({ q: query });
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/patients/search?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  deactivate: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Doctors API
export const doctorsAPI = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    specialization?: string; 
    department?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.specialization) queryParams.append('specialization', params.specialization);
    if (params?.department) queryParams.append('department', params.department);
    
    const response = await fetch(`${API_BASE_URL}/doctors?${queryParams}`);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`);
    return handleResponse(response);
  },

  create: async (doctorData: any) => {
    const response = await fetch(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(doctorData),
    });
    return handleResponse(response);
  },

  update: async (id: string, doctorData: any) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(doctorData),
    });
    return handleResponse(response);
  },

  getAvailability: async (id: string, date?: string) => {
    const queryParams = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE_URL}/doctors/${id}/availability${queryParams}`);
    return handleResponse(response);
  },

  search: async (query: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams({ q: query });
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/doctors/search?${queryParams}`);
    return handleResponse(response);
  },

  getSpecializations: async () => {
    const response = await fetch(`${API_BASE_URL}/doctors/specializations`);
    return handleResponse(response);
  },

  getDepartments: async () => {
    const response = await fetch(`${API_BASE_URL}/doctors/departments`);
    return handleResponse(response);
  },

  deactivate: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    doctor?: string; 
    patient?: string; 
    date?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.doctor) queryParams.append('doctor', params.doctor);
    if (params?.patient) queryParams.append('patient', params.patient);
    if (params?.date) queryParams.append('date', params.date);
    
    const response = await fetch(`${API_BASE_URL}/appointments?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (appointmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

  update: async (id: string, appointmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

  getAvailableSlots: async (doctor: string, date: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/available-slots?doctor=${doctor}&date=${date}`);
    return handleResponse(response);
  },

  cancel: async (id: string, cancellationReason?: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cancellationReason }),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Bills API
export const billsAPI = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    patient?: string; 
    dateFrom?: string; 
    dateTo?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.patient) queryParams.append('patient', params.patient);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const response = await fetch(`${API_BASE_URL}/bills?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByBillNumber: async (billNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/bills/bill-number/${billNumber}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (billData: any) => {
    const response = await fetch(`${API_BASE_URL}/bills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(billData),
    });
    return handleResponse(response);
  },

  update: async (id: string, billData: any) => {
    const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(billData),
    });
    return handleResponse(response);
  },

  getOverdue: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/bills/overdue?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  markAsPaid: async (id: string, paymentMethod?: string) => {
    const response = await fetch(`${API_BASE_URL}/bills/${id}/mark-paid`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentMethod }),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Payments API
export const paymentsAPI = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    method?: string; 
    dateFrom?: string; 
    dateTo?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.method) queryParams.append('method', params.method);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const response = await fetch(`${API_BASE_URL}/payments?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (paymentData: any) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  updateStatus: async (id: string, status: string, failureReason?: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, failureReason }),
    });
    return handleResponse(response);
  },

  processRefund: async (id: string, refundData: any) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}/refund`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(refundData),
    });
    return handleResponse(response);
  },

  getByReference: async (referenceNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/reference/${referenceNumber}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getStatistics: async (params?: { dateFrom?: string; dateTo?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const response = await fetch(`${API_BASE_URL}/payments/statistics?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Reports API
export const reportsAPI = {
  getDashboard: async (params?: { dateFrom?: string; dateTo?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const response = await fetch(`${API_BASE_URL}/reports/dashboard?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getPatients: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/reports/patients?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAppointments: async (params?: { dateFrom?: string; dateTo?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const response = await fetch(`${API_BASE_URL}/reports/appointments?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getFinancial: async (params?: { dateFrom?: string; dateTo?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const response = await fetch(`${API_BASE_URL}/reports/financial?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  exportData: async (type: string, params?: { dateFrom?: string; dateTo?: string }) => {
    const queryParams = new URLSearchParams({ type });
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const response = await fetch(`${API_BASE_URL}/reports/export?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export default {
  auth: authAPI,
  patients: patientsAPI,
  doctors: doctorsAPI,
  appointments: appointmentsAPI,
  bills: billsAPI,
  payments: paymentsAPI,
  reports: reportsAPI,
};

