import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

// Helper: Check if current time in IST is after 6:00 PM (18:00) or before 6:00 AM
export const isAfterWorkHours = () => {
  try {
    const istTimeStr = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    const [hours] = istTimeStr.split(':').map(Number);
    return hours >= 18 || hours < 6;
  } catch {
    const now = new Date();
    const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    return istHours >= 18 || istHours < 6;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [autoLogoutNotice, setAutoLogoutNotice] = useState(localStorage.getItem('auto_logout_notice') || '');

  const logout = useCallback((reason = '') => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (reason) {
      localStorage.setItem('auto_logout_notice', reason);
      setAutoLogoutNotice(reason);
    } else {
      localStorage.removeItem('auto_logout_notice');
      setAutoLogoutNotice('');
    }
  }, []);

  const clearAutoLogoutNotice = () => {
    localStorage.removeItem('auto_logout_notice');
    setAutoLogoutNotice('');
  };

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const { data } = await API.get('/auth/me');
          // If employee and already after 6:00 PM IST, auto-logout
          if (data.role?.toLowerCase() !== 'admin' && isAfterWorkHours()) {
            logout('Daily shift ended at 6:00 PM. You have been automatically logged out. Login will reopen tomorrow at 6:00 AM.');
            setLoading(false);
            return;
          }
          setUser(data);
        } catch (err) {
          if (err.response?.status === 403 && err.response?.data?.isAfterHours) {
            logout(err.response.data.message || 'Daily shift ended at 6:00 PM. Auto-logout is active.');
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token, logout]);

  // Periodic check: auto-logout employees at 6:00 PM IST
  useEffect(() => {
    if (!user || user.role?.toLowerCase() === 'admin') return;

    const checkSchedule = () => {
      if (isAfterWorkHours()) {
        logout('Daily shift ended at 6:00 PM. You have been automatically logged out. Login will reopen tomorrow at 6:00 AM.');
      }
    };

    // Run check immediately and every 30 seconds
    checkSchedule();
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, [user, logout]);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    
    // Safety check on client in case server returned an employee after 6:00 PM
    if (data.role?.toLowerCase() !== 'admin' && isAfterWorkHours()) {
      logout('Work hours ended. Daily auto-logout took place at 6:00 PM. Login is restricted until 6:00 AM tomorrow.');
      throw new Error('Work hours ended. Daily auto-logout took place at 6:00 PM. Login is restricted until 6:00 AM tomorrow.');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    clearAutoLogoutNotice();
    setToken(data.token);
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const { data } = await API.post('/auth/register', formData);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout, register,
      autoLogoutNotice, clearAutoLogoutNotice, isAfterWorkHours
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
