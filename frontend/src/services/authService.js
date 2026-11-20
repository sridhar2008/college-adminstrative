import api from './api';

export const authService = {
  async login(username_or_email, password) {
    const response = await api.post('/auth/login', {
      username_or_email,
      password,
    });
    if (response.data.access_token) {
      localStorage.setItem('csms_token', response.data.access_token);
      localStorage.setItem('csms_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async getDemoAccounts() {
    const response = await api.get('/auth/demo-accounts');
    return response.data;
  },

  logout() {
    localStorage.removeItem('csms_token');
    localStorage.removeItem('csms_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('csms_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
