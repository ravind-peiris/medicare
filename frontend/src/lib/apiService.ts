// API Service for MediPulse Healthcare System
// Handles all API calls to the backend

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      // Enhanced error handling to show validation errors
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const validationMessages = errorData.errors.map((err: any) =>
          `${err.param || err.field}: ${err.msg || err.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${validationMessages}`);
      }
      // Provide more specific error messages based on status codes
      if (response.status === 404) {
        throw new Error('Resource not found');
      } else if (response.status === 403) {
        throw new Error('Access denied - you may not have permission to perform this action');
      } else if (response.status === 401) {
        throw new Error('Authentication required - please log in again');
      } else if (response.status === 400) {
        throw new Error(errorData.message || 'Invalid request data');
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      throw new Error('Empty response received from server');
    }
    return data;
  }
  throw new Error('Invalid response format from server');
};

// Auth API
export const authAPI = {
  login: async (identifier: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    return handleResponse(response);
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateProfile: async (profileData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData)
    });
    return handleResponse(response);
  }
};

// Patients API
export const patientsAPI = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await fetch(`${API_BASE_URL}/patients?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getHealthRecords: async (patientId: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/health-records`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  addHealthRecord: async (patientId: string, recordData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/health-records`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(recordData)
    });
    return handleResponse(response);
  }
};

// Doctors API
export const doctorsAPI = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await fetch(`${API_BASE_URL}/doctors?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMyAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/doctors/me/appointments`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMyRevenue: async () => {
    const response = await fetch(`${API_BASE_URL}/doctors/me/revenue`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateAvailability: async (availabilityData: any) => {
    const response = await fetch(`${API_BASE_URL}/doctors/me/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(availabilityData)
    });
    return handleResponse(response);
  },

  update: async (id: string, doctorData: any) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(doctorData)
    });
    return handleResponse(response);
  }
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await fetch(`${API_BASE_URL}/appointments?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (appointmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  cancel: async (id: string, cancellationReason?: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cancellationReason })
    });
    return handleResponse(response);
  },

  getAvailableSlots: async (doctorId: string, date: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/available-slots?doctor=${doctorId}&date=${date}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Bills API
export const billsAPI = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await fetch(`${API_BASE_URL}/bills?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getByBillNumber: async (billNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/bills/bill-number/${billNumber}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (billData: any) => {
    const response = await fetch(`${API_BASE_URL}/bills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(billData)
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  markAsPaid: async (id: string, paymentMethod: string) => {
    const response = await fetch(`${API_BASE_URL}/bills/${id}/mark-paid`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentMethod })
    });
    return handleResponse(response);
  },

  getOverdue: async (page = 1, limit = 10) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await fetch(`${API_BASE_URL}/bills/overdue?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Payments API
export const paymentsAPI = {
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await fetch(`${API_BASE_URL}/payments?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getByReference: async (referenceNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/reference/${referenceNumber}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (paymentData: any) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });
    return handleResponse(response);
  },

  updateStatus: async (id: string, status: string, failureReason?: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, failureReason })
    });
    return handleResponse(response);
  },

  processRefund: async (id: string, refundData: any) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}/refund`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(refundData)
    });
    return handleResponse(response);
  },

  getStatistics: async (dateFrom?: string, dateTo?: string) => {
    const queryParams = new URLSearchParams();
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);
    
    const response = await fetch(`${API_BASE_URL}/payments/statistics?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Reports API
export const reportsAPI = {
  generate: async (reportType: string, filters: any) => {
    const response = await fetch(`${API_BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reportType, filters })
    });
    return handleResponse(response);
  },

  getAll: async (page = 1, limit = 10) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await fetch(`${API_BASE_URL}/reports?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  download: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}/download`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to download report');
    }
    return response.blob();
  }
};

// Notifications API
export const notificationsAPI = {
  getAll: async (page = 1, limit = 10) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await fetch(`${API_BASE_URL}/notifications?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  markAsRead: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getAnalytics: async (dateFrom?: string, dateTo?: string) => {
    const queryParams = new URLSearchParams();
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);
    
    const response = await fetch(`${API_BASE_URL}/dashboard/analytics?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const apiService = {
  auth: {
    login: (identifier: string, password: string) =>
      fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      }).then(handleResponse),

    register: (userData: any) =>
      fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }).then(handleResponse),

    getCurrentUser: () =>
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    updateProfile: (profileData: any) =>
      fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      }).then(handleResponse),

    changePassword: (passwordData: { currentPassword: string; newPassword: string }) =>
      fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData)
      }).then(handleResponse)
  },

  patients: {
    getAll: (page = 1, limit = 10, filters = {}): Promise<ApiResponse<{ patients: any[] }>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      return fetch(`${API_BASE_URL}/patients?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    getMe: (): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/patients/me`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    getById: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/patients/${id}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    getHealthRecords: (patientId: string): Promise<ApiResponse<any[]>> =>
      fetch(`${API_BASE_URL}/patients/${patientId}/health-records`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    addHealthRecord: (patientId: string, recordData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/patients/${patientId}/health-records`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recordData)
      }).then(handleResponse)
  },

  doctors: {
    getAll: (page = 1, limit = 10, filters = {}): Promise<ApiResponse<{ doctors: any[] }>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      return fetch(`${API_BASE_URL}/doctors?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    getById: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/doctors/${id}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    getMyAppointments: (): Promise<ApiResponse<any[]>> =>
      fetch(`${API_BASE_URL}/doctors/me/appointments`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    getMyRevenue: (): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/doctors/me/revenue`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    updateAvailability: (availabilityData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/doctors/me/availability`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(availabilityData)
      }).then(handleResponse),

    update: (id: string, doctorData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(doctorData)
      }).then(handleResponse)
  },

  appointments: {
    getAll: (page = 1, limit = 10, filters = {}): Promise<ApiResponse<{ appointments: any[] }>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      return fetch(`${API_BASE_URL}/appointments?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    getById: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/appointments/${id}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    create: (appointmentData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(appointmentData)
      }).then(handleResponse),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    cancel: (id: string, cancellationReason?: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cancellationReason })
      }).then(handleResponse),

    getAvailableSlots: (doctorId: string, date: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/appointments/available-slots?doctor=${doctorId}&date=${date}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    delete: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).then(handleResponse)
  },

  bills: {
    getAll: (page = 1, limit = 10, filters = {}): Promise<ApiResponse<{ bills: any[] }>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      return fetch(`${API_BASE_URL}/bills?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    getById: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/bills/${id}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    getByBillNumber: (billNumber: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/bills/bill-number/${billNumber}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    create: (billData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/bills`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(billData)
      }).then(handleResponse),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/bills/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    markAsPaid: (id: string, paymentMethod: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/bills/${id}/mark-paid`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentMethod })
      }).then(handleResponse),

    getOverdue: (page = 1, limit = 10): Promise<ApiResponse<any[]>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      return fetch(`${API_BASE_URL}/bills/overdue?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    delete: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/bills/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).then(handleResponse)
  },

  payments: {
    getAll: (page = 1, limit = 10, filters = {}): Promise<ApiResponse<{ payments: any[] }>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      return fetch(`${API_BASE_URL}/payments?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    getById: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/payments/${id}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    getByReference: (referenceNumber: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/payments/reference/${referenceNumber}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    create: (paymentData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData)
      }).then(handleResponse),

    updateStatus: (id: string, status: string, failureReason?: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/payments/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, failureReason })
      }).then(handleResponse),

    processRefund: (id: string, refundData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/payments/${id}/refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(refundData)
      }).then(handleResponse),

    getStatistics: (dateFrom?: string, dateTo?: string): Promise<ApiResponse<any>> => {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);
      
      return fetch(`${API_BASE_URL}/payments/statistics?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    }
  },

  reports: {
    generate: (reportType: string, filters: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reportType, filters })
      }).then(handleResponse),

    getAll: (page = 1, limit = 10): Promise<ApiResponse<{ reports: any[] }>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      return fetch(`${API_BASE_URL}/reports?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    getById: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/reports/${id}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    download: (id: string): Promise<Blob> =>
      fetch(`${API_BASE_URL}/reports/${id}/download`, {
        headers: getAuthHeaders()
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to download report');
        }
        return response.blob();
      })
  },

  notifications: {
    getAll: (page = 1, limit = 10): Promise<ApiResponse<{ notifications: any[] }>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      return fetch(`${API_BASE_URL}/notifications?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    markAsRead: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      }).then(handleResponse),

    markAllAsRead: (): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      }).then(handleResponse),

    delete: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).then(handleResponse)
  },

  dashboard: {
    getStats: (): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    getAnalytics: (dateFrom?: string, dateTo?: string): Promise<ApiResponse<any>> => {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);
      
      return fetch(`${API_BASE_URL}/dashboard/analytics?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    }
  },

  healthRecords: {
    getByPatient: (patientId: string): Promise<ApiResponse<{ records: any[] }>> =>
      fetch(`${API_BASE_URL}/health-records/patient/${patientId}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    getMe: (): Promise<ApiResponse<{ records: any[] }>> =>
      fetch(`${API_BASE_URL}/health-records/me`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    getById: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/health-records/${id}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    create: (recordData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/health-records`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recordData)
      }).then(handleResponse),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/health-records/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    delete: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/health-records/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).then(handleResponse)
  },

  hospitals: {
    getAll: (page = 1, limit = 10, filters = {}): Promise<ApiResponse<{ hospitals: any[] }>> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      return fetch(`${API_BASE_URL}/hospitals?${queryParams}`, {
        headers: getAuthHeaders()
      }).then(handleResponse);
    },

    getById: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/hospitals/${id}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    create: (hospitalData: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/hospitals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(hospitalData)
      }).then(handleResponse),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/hospitals/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    delete: (id: string): Promise<ApiResponse<any>> =>
      fetch(`${API_BASE_URL}/hospitals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).then(handleResponse)
  }
};

export default apiService;
