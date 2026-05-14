import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hn_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const stored = localStorage.getItem('hn_user');
      if (stored) setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, [token]);

  const login = (tok, userData) => {
    setToken(tok);
    setUser(userData);
    localStorage.setItem('hn_token', tok);
    localStorage.setItem('hn_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hn_token');
    localStorage.removeItem('hn_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('hn_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
