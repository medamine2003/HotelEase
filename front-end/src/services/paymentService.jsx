import axios from 'axios';

const API_URL = 'http://localhost:8000/api/paiements';

// Créer un paiement
export const createPayment = async (payment) => {
  console.log("Données envoyées à l'API :", payment);
  const response = await axios.post(API_URL, payment, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json',
    },
  });

  return response.data;
};

// Récupérer tous les paiements
export const getPayments = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, {
      params,
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data['hydra:member'] || response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements :', error);
    throw error;
  }
};

// Lire un paiement par ID
export const getPaymentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du paiement ID ${id} :`, error);
    throw error;
  }
};

// Mettre à jour un paiement
export const updatePayment = async (id, updatedPayment) => {
  return axios.patch(`${API_URL}/${id}`, updatedPayment, {
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json',
    },
  });
};

// Supprimer un paiement
export const deletePayment = async (id) => {
  return axios.delete(`${API_URL}/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
};
