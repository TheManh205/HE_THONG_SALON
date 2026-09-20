import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('salon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('salon_token'));
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ username, password });
      const { access_token, role, user_id, full_name, username: uname } = response.data;
      
      const userData = { id: user_id, username: uname, role, full_name };
      setToken(access_token);
      setUser(userData);

      localStorage.setItem('salon_token', access_token);
      localStorage.setItem('salon_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('salon_token');
    localStorage.removeItem('salon_user');
  };

  const demoLogin = async (roleType) => {
    let creds = { username: 'admin', password: 'admin123' };
    if (roleType === 'receptionist') {
      creds = { username: 'letan', password: 'letan123' };
    } else if (roleType === 'hairdresser') {
      creds = { username: 'stylist_nam', password: 'stylist123' };
    }
    return login(creds.username, creds.password);
  };

  const role = user?.role || 'guest';
  const isAdmin = role === 'admin' || role === 'manager';
  const isReceptionist = role === 'receptionist' || isAdmin;
  const isStylist = role === 'hairdresser';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin,
        isReceptionist,
        isStylist,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
