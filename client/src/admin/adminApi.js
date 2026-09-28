const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_BASE = `${BACKEND_URL}/api/admin`;


const getHeaders = () => {
  const token = sessionStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    if (!window.location.pathname.includes('/admin/login')) {
      window.location.href = '/admin/login?expired=1';
    }
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Session expired. Please log in again.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred while processing your request');
  }
  return data;
};

export const adminLogin = async (email, password) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Invalid credentials');
  }

  if (data.token) {
    sessionStorage.setItem('adminToken', data.token);
    sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
  }
  return data;
};

export const sendAdminForgotPasswordOtp = async (email) => {
  const response = await fetch(`${API_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send OTP code');
  }
  return data;
};

export const verifyAdminResetOtp = async (email, otp) => {
  const response = await fetch(`${API_BASE}/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Invalid OTP code');
  }
  return data;
};

export const resetAdminPassword = async (email, otp, newPassword) => {
  const response = await fetch(`${API_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to reset admin password');
  }
  return data;
};


export const getAdminStats = async () => {
  const response = await fetch(`${API_BASE}/stats`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getAdminUsers = async ({ page = 1, limit = 20, search = '', status = 'All' } = {}) => {
  const query = new URLSearchParams({ page, limit, search, status }).toString();
  const response = await fetch(`${API_BASE}/users?${query}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getAdminUserDetail = async (userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const deleteAdminUser = async (userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getAdminMeetings = async ({ page = 1, limit = 20, search = '', status = 'All' } = {}) => {
  const query = new URLSearchParams({ page, limit, search, status }).toString();
  const response = await fetch(`${API_BASE}/meetings?${query}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getAdminMeetingDetail = async (roomId) => {
  const response = await fetch(`${API_BASE}/meetings/${roomId}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getAdminActivity = async ({ page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams({ page, limit }).toString();
  const response = await fetch(`${API_BASE}/activity?${query}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getAdminSystemStatus = async () => {
  const response = await fetch(`${API_BASE}/system/status`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getAdminAuditLogs = async () => {
  const response = await fetch(`${API_BASE}/audit-logs`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};
