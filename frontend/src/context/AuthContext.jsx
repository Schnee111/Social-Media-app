import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Try to get user from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('✅ User loaded from localStorage:', parsedUser.username);
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        }
        
        // Then fetch fresh data from API
        const response = await api.get('/users/me');
        const userData = response.data.data;
        setUser(userData);
        
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ User data refreshed from API:', userData.username);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, data } = response.data;
      
      // Save token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Save user data to state and localStorage
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      
      console.log('✅ Login successful:', data.username);
      console.log('💾 Saved to localStorage');
      
      toast.success(`Selamat datang, ${data.username}!`);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login gagal';
      console.error('❌ Login failed:', errorMessage);
      toast.error(errorMessage);
      throw error.response?.data || error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, data } = response.data;
      
      // Save token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Save user data to state and localStorage
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      
      console.log('✅ Registration successful:', data.username);
      console.log('💾 Saved to localStorage');
      
      toast.success(`Selamat datang, ${data.username}!`);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registrasi gagal';
      console.error('❌ Registration failed:', errorMessage);
      toast.error(errorMessage);
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    console.log('👋 Logging out:', user?.username);
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    toast.success('Berhasil logout');
  };

  // Method to update user data (e.g., after profile update)
  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    console.log('🔄 User data updated:', newUser.username);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};