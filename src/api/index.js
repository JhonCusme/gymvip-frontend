import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_URL });

// INTERCEPTOR REQUEST — inyectar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gymvip_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const gymSlug = localStorage.getItem('gymvip_slug');
  if (gymSlug && !config.params?.gym) {
    config.params = { ...config.params, gym: gymSlug };
  }
  return config;
});

// INTERCEPTOR RESPONSE — manejar 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // No redirigir si ya estamos en login
      if (window.location.pathname === '/login') {
        return Promise.reject(err);
      }
      const slug = localStorage.getItem('gymvip_slug');
      localStorage.removeItem('gymvip_token');
      localStorage.removeItem('gymvip_user');
      localStorage.removeItem('gymvip_gym');
      localStorage.removeItem('gymvip_role');
      localStorage.removeItem('gymvip_slug');
      window.location.href = slug ? `/login?gym=${slug}` : '/login';
    }
    return Promise.reject(err);
  }
);

// ============================================================
// AUTH
// ============================================================
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  getGymInfo: (slug) => api.get(`/gym/${slug}/info`),
};

// ============================================================
// Upload Photo
// ============================================================
export const uploadAPI = {
  uploadGymLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/super/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadInstructorPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post('/admin/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// ============================================================
// SUPER ADMIN
// ============================================================
export const superAPI = {
  getGyms: () => api.get('/super/gyms'),
  createGym: (data) => api.post('/super/gyms', data),
  updateGym: (id, data) => api.put(`/super/gyms/${id}`, data),
  toggleGym: (id) => api.patch(`/super/gyms/${id}/toggle`),
  deleteGym: (id) => api.delete(`/super/gyms/${id}`),
  getGymAdmins: (id) => api.get(`/super/gyms/${id}/admins`),
  addGymAdmin: (id, data) => api.post(`/super/gyms/${id}/admins`, data),
  removeGymAdmin: (gymId, userId) => api.delete(`/super/gyms/${gymId}/admins/${userId}`),
  getGymPlans: (id) => api.get(`/super/gyms/${id}/membership-plans`),
  createGymPlan: (id, data) => api.post(`/super/gyms/${id}/membership-plans`, data),
  applyTheme: (id, themeSlug) => api.post(`/super/gyms/${id}/apply-theme`, { themeSlug }),
  getGlobalReport: () => api.get('/super/reports'),
  getThemes: () => api.get('/super/themes'),
};

export const wodAPI = {
  getWods: (params) => api.get('/admin/wods', { params }),
  getWod: (date) => api.get(`/admin/wods/${date}`),
  saveWod: (data) => api.post('/admin/wods', data),
  deleteWod: (date) => api.delete(`/admin/wods/${date}`),
  getUserWod: () => api.get('/usuario/wod'),
};

// ============================================================
// ADMIN
// ============================================================
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  // Usuarios
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  resetPassword: (id, data) => api.post(`/admin/users/${id}/reset-password`, data),
  activateMembership: (id, data) => api.post(`/admin/users/${id}/activate-membership`, data),
  // Membresías Types
  getMembershipTypes: () => api.get('/admin/membership-types'),
  createMembershipType: (data) => api.post('/admin/membership-types', data),
  updateMembershipType: (id, data) => api.put(`/admin/membership-types/${id}`, data),
  deleteMembershipType: (id) => api.delete(`/admin/membership-types/${id}`),
  // Membresías
  getMemberships: (params) => api.get('/admin/memberships', { params }),
  // Sesiones
  getSessions: () => api.get('/admin/sessions'),
  createSession: (data) => api.post('/admin/sessions', data),
  updateSession: (id, data) => api.put(`/admin/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/admin/sessions/${id}`),
  // Horarios
  getSchedules: () => api.get('/admin/schedules'),
  createSchedule: (data) => api.post('/admin/schedules', data),
  deleteSchedule: (id) => api.delete(`/admin/schedules/${id}`),
  // Instructores
  getInstructors: () => api.get('/admin/instructors'),
  createInstructor: (data) => api.post('/admin/instructors', data),
  updateInstructor: (id, data) => api.put(`/admin/instructors/${id}`, data),
  deleteInstructor: (id) => api.delete(`/admin/instructors/${id}`),
  // Recepcionistas
  getReceptionists: () => api.get('/admin/receptionists'),
  createReceptionist: (data) => api.post('/admin/receptionists', data),
  // Pagos
  getPayments: (params) => api.get('/admin/payments', { params }),
  // Reportes
  getReports: (params) => api.get('/admin/reports', { params }),
  getAttendance: (params) => api.get('/admin/attendance', { params }),
  getReceptionAudit: (params) => api.get('/admin/reception-audit', { params }),
  validateEntry: (data) => api.post('/admin/validate-entry', data),
  // Asignar Roles Adicionales
  assignRole: (userId, role) => api.post(`/admin/users/${userId}/roles`, { role }),
  removeRole: (userId, role) => api.delete(`/admin/users/${userId}/roles/${role}`),
};

// ============================================================
// RECEPCIÓN
// ============================================================
export const receptionAPI = {
  getDashboard: () => api.get('/recepcion/dashboard'),
  getClients: (params) => api.get('/recepcion/clients', { params }),
  getClient: (id) => api.get(`/recepcion/clients/${id}`),
  createClient: (data) => api.post('/recepcion/clients', data),
  createMembership: (id, data) => api.post(`/recepcion/clients/${id}/membership`, data),
  registerPayment: (id, data) => api.post(`/recepcion/clients/${id}/payment`, data),
  getMemberships: (params) => api.get('/recepcion/memberships', { params }),
  getPayments: (params) => api.get('/recepcion/payments', { params }),
  getSchedules: (params) => api.get('/recepcion/schedules', { params }),
  bookClient: (classId, data) => api.post(`/recepcion/schedules/${classId}/book`, data),
  getEnrolled: (classId) => api.get(`/recepcion/schedules/${classId}/enrolled`),
  validateEntry: (data) => api.post('/recepcion/scanner/validate', data),
  getAttendance: (params) => api.get('/recepcion/attendance', { params }),
  getMembershipTypes: () => api.get('/recepcion/membership-types'),
};

// ============================================================
// USUARIO
// ============================================================
export const userAPI = {
  getHome: () => api.get('/usuario/home'),
  getSchedule: (params) => api.get('/usuario/schedule', { params }),
  bookClass: (id) => api.post(`/usuario/schedule/${id}/book`),
  cancelBooking: (id) => api.delete(`/usuario/bookings/${id}`),
  getMyBookings: () => api.get('/usuario/bookings'),
  getMyQR: () => api.get('/usuario/qr'),
  getProfile: () => api.get('/usuario/profile'),
  updateProfile: (data) => api.put('/usuario/profile', data),
  getPaymentHistory: () => api.get('/usuario/payment-history'),
  getNotifications: () => api.get('/usuario/notifications'),
  getMembershipPlans: () => api.get('/usuario/membership-plans'),
  getWod: () => api.get('/usuario/wod'),
  payWithPayphone: (data) => api.post('/usuario/payphone/pay', data),
  signConsent: () => api.post('/usuario/payphone/consent'),
  getAutoCharge: () => api.get('/usuario/payphone/auto-charge'),
  cancelAutoCharge: () => api.delete('/usuario/payphone/auto-charge'),
};

// ============================================================
// INSTRUCTOR
// ============================================================
export const instructorAPI = {
  getTodayClasses: () => api.get('/instructor/today-classes'),
  getAttendance: (params) => api.get('/instructor/attendance', { params }),
  getRoutines: () => api.get('/instructor/routines'),
  createRoutine: (data) => api.post('/instructor/routines', data),
  getProfile: () => api.get('/instructor/profile'),
  updateProfile: (data) => api.put('/instructor/profile', data),
  getWods: (params) => api.get('/admin/wods', { params }),
  getWod: (date) => api.get(`/admin/wods/${date}`),
  saveWod: (data) => api.post('/admin/wods', data),
  deleteWod: (date) => api.delete(`/admin/wods/${date}`),
  getClassStudents: (classInstanceId) => api.get(`/instructor/classes/${classInstanceId}/students`),
  markAttendance: (bookingId, attended) => api.post(`/instructor/bookings/${bookingId}/attendance`, { attended }),
};

export default api;
