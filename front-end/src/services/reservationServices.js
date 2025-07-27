//import axios from 'axios';
import api from './api';
//const API_URL = 'http://localhost:8000/api/reservations';

// Créer une réservation
export const createReservation = async (reservation) => {
  console.log("Données envoyées à l'API :", reservation);
  const response = await api.post('/reservations', reservation, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json',
    },
  });

  return response.data;
};

// Récupérer toutes les réservations
export const getReservations = async (params = {}) => {
  try {
    const response = await api.get('/reservations', {
      params,
      headers: {
        'Accept': 'application/ld+json',
      },
    });
    
    // Forcez un array
    return response.data.member || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    throw error;
  }
};

// Lire une réservation par ID
export const getReservationById = async (id) => {
  try {
    const response = await api.get(`/reservations/${id}`, {
      headers: {
        'Accept': 'application/ld+json',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la réservation ID ${id}:`, error);
    throw error;
  }
};

// Mettre à jour une réservation
export const updateReservation = async (id, updatedReservation) => {
  return api.patch(`/reservations/${id}`, updatedReservation, {
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json',
    },
  });
};

// Supprimer une réservation
export const deleteReservation = async (id) => {
  return api.delete(`/reservations/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
};
