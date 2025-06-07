import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

type AxiosInstance = ReturnType<typeof axios.create>;

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string, role: UserRole, department: string) => Promise<AuthResponse>;
  signInWithGoogle: (credential: string) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  authAxios: AxiosInstance;
  refreshToken: () => Promise<AuthResponse | null>; // Updated function name
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = `http://${window.location.hostname}:5000/api`;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('eduUser');
    const savedToken = localStorage.getItem('eduToken');
    if (savedUser && savedToken) {
      if (!isTokenExpired(savedToken)) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('eduUser');
        localStorage.removeItem('eduToken');
      }
    }
    setLoading(false);
  }, []);

  const authAxios: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  authAxios.interceptors.request.use(
    (config) => {
      if (!config.headers) {
        config.headers = {};
      }
      if (token && isTokenExpired(token)) {
        // Token is expired, do not attach it to the request
        // Optionally, you could navigate to the login page here
        // navigate('/login');
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        department: data.user.department,
      };

      setUser(userData);
      setToken(data.token);
      localStorage.setItem('eduUser', JSON.stringify(userData));
      localStorage.setItem('eduToken', data.token);

      toast({ title: "Login Successful", description: `Welcome, ${userData.name}!`, variant: "default" });

      switch (userData.role) {
        case 'student': navigate('/student/dashboard'); break;
        case 'teacher': navigate('/teacher/dashboard'); break;
        case 'hod': navigate('/hod/dashboard'); break;
        default: navigate('/');
      }

      return { token: data.token, user: userData };
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials, please try again.",
        variant: "destructive",
      });
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (credential: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ idToken: credential })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google Sign-In failed');
      }

      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        department: data.user.department,
      };

      setUser(userData);
      setToken(data.token);
      localStorage.setItem('eduUser', JSON.stringify(userData));
      localStorage.setItem('eduToken', data.token);

      toast({ title: "Login Successful", description: `Welcome, ${userData.name}!`, variant: "default" });

      switch (userData.role) {
        case 'student': navigate('/student/dashboard'); break;
        case 'teacher': navigate('/teacher/dashboard'); break;
        case 'hod': navigate('/hod/dashboard'); break;
        default: navigate('/');
      }

      return { token: data.token, user: userData };
    } catch (error) {
      toast({
        title: "Google Sign-In Failed",
        description: error instanceof Error ? error.message : "Authentication failed. Please try again.",
        variant: "destructive",
      });
      console.error('Google Sign-In error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string, email: string, password: string, role: UserRole, department: string
  ): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ name, email, password, role, department }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        department: data.user.department,
      };

      setUser(userData);
      setToken(data.token);
      localStorage.setItem('eduUser', JSON.stringify(userData));
      localStorage.setItem('eduToken', data.token);

      toast({ title: "Registration Successful", description: `Welcome, ${userData.name}!`, variant: "default" });

      switch (userData.role) {
        case 'student': navigate('/student/dashboard'); break;
        case 'teacher': navigate('/teacher/dashboard'); break;
        case 'hod': navigate('/hod/dashboard'); break;
        default: navigate('/');
      }

      return { token: data.token, user: userData };
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Registration failed. Please try again.",
        variant: "destructive",
      });
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eduUser');
    localStorage.removeItem('eduToken');
    toast({ title: "Logged Out", description: "You have been successfully logged out.", variant: "default" });
    navigate('/login');
  };

  const refreshToken = async (): Promise<AuthResponse | null> => {
    // Since we don't have a refresh endpoint, we need to redirect to login
    toast({
      title: "Session Expired",
      description: "Please log in again.",
      variant: "destructive",
    });
    logout(); // Clear current session
    return null;
  };

  // Fix isAuthenticated to require both token and user
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, signInWithGoogle, logout, isAuthenticated, authAxios, refreshToken // Updated to refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
