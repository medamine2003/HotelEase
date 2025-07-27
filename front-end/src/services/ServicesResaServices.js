import api from './api';

/**
 * Ajouter un service à une réservation
 * @param {number} reservationId - ID de la réservation
 * @param {number} serviceId - ID du service à ajouter
 * @param {number} quantite - Quantité du service (défaut: 1)
 */
export const addServiceToReservation = async (reservationId, serviceId, quantite = 1) => {
  try {
    console.log(`🔄 Ajout service ${serviceId} à la réservation ${reservationId}`);
    const response = await api.post(`/reservations/${reservationId}/add-service`, {
      serviceId: serviceId,
      quantite: quantite
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    console.log('✅ Service ajouté:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du service:', error);
    throw error;
  }
};

/**
 * Supprimer un service d'une réservation
 * @param {number} reservationId - ID de la réservation
 * @param {number} serviceId - ID du service à supprimer
 */
export const removeServiceFromReservation = async (reservationId, reservationServiceId) => {
  try {
    console.log(`🔄 Suppression service ${reservationServiceId} de la réservation ${reservationId}`);
    const response = await api.delete(`/reservation_services/${reservationServiceId}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('✅ Service supprimé:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du service:', error);
    throw error;
  }
};

/**
 * Mettre à jour la quantité d'un service
 * @param {number} reservationId - ID de la réservation
 * @param {number} serviceId - ID du service
 * @param {number} quantite - Nouvelle quantité
 */
export const updateServiceQuantity = async (reservationId, serviceId, quantite) => {
  try {
    console.log(`🔄 Mise à jour quantité service ${serviceId} (${quantite}x)`);
    const response = await api.patch(`/reservations/${reservationId}/update-service/${serviceId}`, {
      quantite: quantite
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    console.log('✅ Quantité mise à jour:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la quantité:', error);
    throw error;
  }
};

/**
 * Récupérer tous les services d'une réservation
 * @param {number} reservationId - ID de la réservation
 */
export const getReservationServices = async (reservationId) => {
  try {
    console.log(`🔄 Récupération des services pour la réservation ${reservationId}`);
    const response = await api.get(`/reservations/${reservationId}/list-services`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('✅ Services récupérés:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des services:', error);
    throw error;
  }
};

/**
 * Récupérer tous les services disponibles
 */
export const getAvailableServices = async () => {
  try {
    console.log('🔄 Récupération des services disponibles');
    const response = await api.get('/services', {
      headers: {
        'Accept': 'application/ld+json',
      }
    });

    const services = response.data['hydra:member'] || response.data.member || response.data || [];
    console.log('✅ Services disponibles récupérés:', services.length);
    return services;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des services disponibles:', error);
    throw error;
  }
};

/**
 * Récupérer une réservation avec ses services
 * @param {number} reservationId - ID de la réservation
 */
export const getReservationWithServices = async (reservationId) => {
  try {
    console.log(`🔄 Récupération réservation ${reservationId} avec services`);
    const response = await api.get(`/reservations/${reservationId}`, {
      headers: {
        'Accept': 'application/ld+json',
      }
    });

    console.log('✅ Réservation récupérée:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la réservation:', error);
    throw error;
  }
};