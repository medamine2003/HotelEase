import axios from 'axios';

const API_URL = 'http://localhost:8000/api/clients';


export const createCustomer = async (customer) => {
  console.log(" Données envoyées à l'API :", customer);
  const response = await axios.post(API_URL, customer, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json',
    },
  });

  return response.data;
};


export const getCustomers = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, {
      params,
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data['hydra:member'] || response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    throw error;
  }
};

// Lire un client par ID
export const getCustomerById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: {
        'Accept': 'application/ld+json',
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du client ID ${id}:`, error);
    throw error;
  }
};

// Mettre à jour un client
export const updateCustomer = async (id, updatedCustomer) => {
  return axios.patch(`${API_URL}/${id}`, updatedCustomer, {
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json',
    },
  });
};

// Supprimer un client
export const deleteCustomer = async (id) => {
  return axios.delete(`${API_URL}/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
};
