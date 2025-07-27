// AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fonction pour vérifier l'auth
  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/me');
      setUser(res.data);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await api.post('/token/refresh');
          const retryRes = await api.get('/me');
          setUser(retryRes.data);
          setIsAuthenticated(true);
          return true;
        } catch {
          // Refresh échoué, on continue vers le reset
        }
      }
      
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier au démarrage
  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      await api.post('/login', credentials);
      
      // Attendre que les cookies soient définis
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Re-vérifier l'auth avec les nouveaux cookies
      await checkAuth();
      
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.post('/logout');
    } finally {
      // Reset complet de l'état
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };