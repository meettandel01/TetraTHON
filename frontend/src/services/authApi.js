import api from './api';

export const authApi = {
  loginPin: (student_id, pin) => api.post('/auth/login/pin', { student_id, pin }),
  loginSso: (role, provider) => api.post('/auth/login/sso', { role, provider }),
  loginOtp: (parent_id, otp) => api.post('/auth/login/otp', { parent_id, otp }),
  logout: () => api.post('/auth/logout'), // Optionally implement on backend
  getMe: () => api.get('/auth/me'),
};
