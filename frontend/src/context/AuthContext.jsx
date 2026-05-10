import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on load
    const checkUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me');
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (username, password) => {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username,
      password,
    });
    setUser(response.data.user);
    return response.data;
  };

  const register = async (username, password) => {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      username,
      password,
    });
    return response.data;
  };

  const logout = async () => {
    await axios.post('http://localhost:5000/api/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
