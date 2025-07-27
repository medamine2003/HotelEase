//import axios from 'axios';
import api from './api';


export const createUser = async (user) => {
  console.log("Données envoyées à l'API :", user);
  const response = await api.post('/utilisateurs', user, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json',
    },
  });
  return response.data;
};

export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/utilisateurs', {
      params,
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data['member'] || [];

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await api.get(`/utilisateurs/${id}`, {
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'utilisateur ID ${id}:`, error);
    throw error;
  }
};

export const updateUser = async (id, updatedUser) => {
  return api.patch(`/utilisateurs/${id}`, updatedUser, {
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json',
    },
  });
};

export const deleteUser = async (id) => {
  return api.delete(`/utilisateurs/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
};
