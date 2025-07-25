import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';


const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [loading, setLoading] = useState(true);

  const checkAuthState = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/check-auth`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Auth check failed');
      }
      
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
      localStorage.setItem('isAuthenticated', data.isAuthenticated);
      
      // If authenticated, fetch user details
      if (data.isAuthenticated) {
        await fetchCurrentUser();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('isAuthenticated');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/current-user`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Fetch user error:", err);
      setUser(null);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      
      if (data.errors) {
        return { success: false, errors: data.errors };
      }
      
      if (data.user) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        await fetchCurrentUser();
        return { success: true };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, errors: { general: 'Login failed' } };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('isAuthenticated');
    }
  };

// In your UserContext.js or wherever your register function is defined
const register = async (email, password, role, department, firstName, lastName, rank) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        role,
        ...(role === 'employee' && { department, rank }),
        firstName,
        lastName
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, errors: data.errors || { general: 'Registration failed' } };
    }
    
    // Store the token in localStorage or cookies
    localStorage.setItem('token', data.token);
    
    return { 
      success: true, 
      user: data.user,
      token: data.token
    };
  } catch (error) {
    return { success: false, errors: { general: error.message } };
  }
};
  useEffect(() => {
    checkAuthState();
    
    // Set up periodic auth checks (every 5 minutes)
    const interval = setInterval(checkAuthState, 300000);
    return () => clearInterval(interval);
  }, []);


    const isAdmin = () => user && user.role === 'employer';
    const isEmployee = () => user && user.role ==='employee'

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    fetchCurrentUser,
    checkAuthState,
    isAdmin,
    isEmployee
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
