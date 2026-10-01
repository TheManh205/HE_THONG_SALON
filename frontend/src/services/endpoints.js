import api from './api';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const serviceAPI = {
  getAll: (params) => api.get('/services/', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services/', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

export const hairdresserAPI = {
  getAll: (params) => api.get('/hairdressers/', { params }),
  getById: (id) => api.get(`/hairdressers/${id}`),
  create: (data) => api.post('/hairdressers/', data),
  update: (id, data) => api.put(`/hairdressers/${id}`, data),
  updateSchedules: (id, schedules) => api.put(`/hairdressers/${id}/schedules`, schedules),
  upsertDailySchedule: (id, body) => api.put(`/hairdressers/${id}/daily-schedule`, body),
};

export const appointmentAPI = {
  checkOverlap: (data) => api.post('/appointments/check-overlap', data),
  getAvailableSlots: (params) => api.get('/appointments/available-slots', { params }),
  publicBook: (data) => api.post('/appointments/book', data),
  getMyBookings: (phone) => api.get('/appointments/my-bookings', { params: { phone } }),
  publicCancel: (id, phone) => api.post(`/appointments/public-cancel/${id}`, null, { params: { phone } }),
  adminCreate: (data) => api.post('/appointments/', data),
  getAll: (params) => api.get('/appointments/', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  cancel: (id) => api.post(`/appointments/${id}/cancel`),
};

export const customerAPI = {
  getAll: (params) => api.get('/customers/', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  getHistory: (id) => api.get(`/customers/${id}/history`),
};

export const invoiceAPI = {
  getAll: (params) => api.get('/invoices/', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices/', data),
};

export const paymentAPI = {
  getAll: (params) => api.get('/payments/', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments/', data),
};

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getRevenue: (days = 7) => api.get('/analytics/revenue', { params: { days } }),
  getRevenueByRange: (startDate, endDate) =>
    api.get('/analytics/revenue-range', { params: { start_date: startDate, end_date: endDate } }),
  getStylistPerformance: (startDate, endDate) =>
    api.get('/analytics/stylist-performance', { params: { start_date: startDate, end_date: endDate } }),
  getPopularServices: (limit = 5) => api.get('/analytics/popular-services', { params: { limit } }),
  getCustomerRetention: () => api.get('/analytics/customer-retention'),
};

export const aiAPI = {
  getRecommendations: (data) => api.post('/ai/recommend', data),
  generateCareMessage: (data) => api.post('/ai/generate-care-message', data),
  summarizeHistory: (customerId) => api.post('/ai/summarize-history', { customer_id: customerId }),
};
