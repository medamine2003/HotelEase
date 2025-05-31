import axios from 'axios';

const API_URL = 'http://localhost:8000/api/utilisateurs';

export const createUser = async (user) => {
  console.log("Données envoyées à l'API :", user);
  const response = await axios.post(API_URL, user, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json',
    },
  });
  return response.data;
};

export const getUsers = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, {
      params,
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data['hydra:member'] || response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
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
  return axios.patch(`${API_URL}/${id}`, updatedUser, {
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json',
    },
  });
};

export const deleteUser = async (id) => {
  return axios.delete(`${API_URL}/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
};
