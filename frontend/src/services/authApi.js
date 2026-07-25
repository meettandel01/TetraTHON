import api from './api';

export const authApi = {
  loginPin: (email_or_id, pin) => api.post('/auth/login/pin', { email_or_id, pin }),
  register: (name, email, role, pin) => api.post('/auth/register', { name, email, role, pin }),
  loginSso: (role, provider) => api.post('/auth/login/sso', { role, provider }),
  loginOtp: (parent_id, otp) => api.post('/auth/login/otp', { parent_id, otp }),
  logout: () => api.post('/auth/logout'), // Optionally implement on backend
  getMe: () => api.get('/auth/me'),
};
