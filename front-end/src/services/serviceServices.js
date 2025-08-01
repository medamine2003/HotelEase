//import axios from 'axios';
import api from './api';
//const API_URL = 'http://localhost:8000/api/services';

// Créer un service
export const createService = async (service) => {
  console.log("Données envoyées à l'API :", service);
  const response = await api.post('/services', service, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json',
    },
  });

  return response.data;
};

// Récupérer tous les services
export const getServices = async (params = {}) => {
  try {
    const response = await api.get('/services', {
      params,
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data['hydra:member'] || response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    throw error;
  }
};

// Récupérer un service par ID
export const getServiceById = async (id) => {
  try {
    const response = await api.get(`/services/${id}`, {
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du service ID ${id}:`, error);
    throw error;
  }
};

// Mettre à jour un service
export const updateService = async (id, updatedService) => {
  return api.patch(`/services/${id}`, updatedService, {
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json',
    },
  });
};

// Supprimer un service
export const deleteService = async (id) => {
  return api.delete(`/services/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
};
