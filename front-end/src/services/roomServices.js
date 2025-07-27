import api from './api';

// Créer une room
export const createRoom = async (room) => {
  try {
    console.log("Données envoyées à l'API :", room);
    const response = await api.post('/chambres', room, {
      headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Erreur retournée par le serveur
      const serverMessage = error.response.data.message || JSON.stringify(error.response.data);
      throw new Error(serverMessage);
    } else if (error.request) {
      // Pas de réponse du serveur
      throw new Error("Le serveur n'a pas répondu");
    } else {
      // Erreur dans la requête
      throw new Error(error.message);
    }
  }
};

// Lire toutes les rooms (optionnel : avec params de filtrage)
export const getRooms = async (params = {}) => {
  try {
    const response = await api.get('/chambres', {
      params,
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data.member || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des rooms:', error);
    throw error;
  }
};

// Lire une room par ID
export const getRoomById = async (id) => {
  try {
    const response = await api.get(`/chambres/${id}`, {
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
  try {
    const response = await api.patch(`/chambres/${id}`, updatedRoom, {
      headers: {
        'Content-Type': 'application/merge-patch+json',
        'Accept': 'application/ld+json',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const serverMessage = error.response.data.message || JSON.stringify(error.response.data);
      throw new Error(serverMessage);
    } else if (error.request) {
      throw new Error("Le serveur n'a pas répondu");
    } else {
      throw new Error(error.message);
    }
  }
};

// Supprimer une room
export const deleteRoom = async (id) => {
  try {
    await api.delete(`/chambres/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
  } catch (error) {
    if (error.response) {
      const serverMessage = error.response.data.message || JSON.stringify(error.response.data);
      throw new Error(serverMessage);
    } else if (error.request) {
      throw new Error("Le serveur n'a pas répondu");
    } else {
      throw new Error(error.message);
    }
  }
};
