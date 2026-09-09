import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.hostname}:5000`;

  const checkAuth = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/auth/me`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      await fetch(`${serverUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth, serverUrl }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
