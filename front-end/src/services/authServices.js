// services/authService.js
import api from './api';

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/me');
    return response.data;
  } catch (error) {
    console.error('Erreur récupération utilisateur connecté:', error);
    throw error;
  }
};