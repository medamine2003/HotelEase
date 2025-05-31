import axios from 'axios';

const API_URL = 'http://localhost:8000/api/chambres';

// Créer une room
export const createRoom = async (room) => {
  console.log("Données envoyées à l'API :", room);
  const response = await axios.post(API_URL, room, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json',
    },
  });

  return response.data;
};

// Lire toutes les rooms (optionnel : avec params de filtrage)
export const getRooms = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, {
      params,
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data['hydra:member'] || response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des rooms:', error);
    throw error;
  }
};

// Lire une room par ID
export const getRoomById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la room ID ${id}:`, error);
    throw error;
  }
};

// Mettre à jour une room
export const updateRoom = async (id, updatedRoom) => {
  return axios.patch(`${API_URL}/${id}`, updatedRoom, {
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json',
    },
  });
};

// Supprimer une room
export const deleteRoom = async (id) => {
  return axios.delete(`${API_URL}/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
};
