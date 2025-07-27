import api from './api';

// === FONCTIONS UTILITAIRES POUR LA PRÉCISION ===

/**
 * Arrondit un nombre à 2 décimales de manière sécurisée
 */
export const roundToTwoDecimals = (num) => {
  if (typeof num === 'string') {
    num = parseFloat(num);
  }
  if (isNaN(num)) {
    return 0;
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Vérifie si un montant est pratiquement zéro (gère les erreurs de précision)
 */
export const isEffectivelyZero = (amount) => {
  return Math.abs(roundToTwoDecimals(amount)) < 0.01;
};

/**
 * Formate un montant en euros avec arrondi automatique
 */
export const formatAmount = (amount) => {
  // CORRECTION PRINCIPALE : Arrondir AVANT de formater
  const roundedAmount = roundToTwoDecimals(amount);
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(roundedAmount);
};

/**
 * Calcule le statut de paiement en tenant compte des erreurs de précision
 */
export const getPaymentStatus = (montantPaye, montantTotal) => {
  const paye = roundToTwoDecimals(montantPaye);
  const total = roundToTwoDecimals(montantTotal);
  
  if (paye === 0) {
    return 'impaye';
  }
  
  if (paye >= total || isEffectivelyZero(total - paye)) {
    return 'complet';
  }
  
  return 'partiel';
};

/**
 * Valide qu'un montant de paiement ne dépasse pas le restant dû
 */
export const validatePaymentAmount = (amount, montantRestant) => {
  const montantSaisi = roundToTwoDecimals(parseFloat(amount));
  const restant = roundToTwoDecimals(montantRestant);
  
  if (isNaN(montantSaisi) || montantSaisi <= 0) {
    return "Le montant doit être un nombre positif.";
  }
  
  if (montantSaisi > restant && !isEffectivelyZero(restant - montantSaisi)) {
    return `Le montant ne peut pas dépasser le restant dû (${formatAmount(restant)}).`;
  }
  
  return null; // Pas d'erreur
};

// === FONCTIONS API ===

/**
 * Créer un paiement
 */
export const createPayment = async (payment) => {
  // Validation et nettoyage des données
  const validatedPayment = {
    ...payment,
    typePaiement: payment.typePaiement || 'solde',
    numeroTransaction: payment.numeroTransaction || null,
    commentaire: payment.commentaire || null,
    // S'assurer que la date est bien formatée
    datePaiement: payment.datePaiement || new Date().toISOString(),
    // Arrondir le montant à 2 décimales
    montant: roundToTwoDecimals(payment.montant).toString()
  };
  
  const response = await api.post('/paiements', validatedPayment, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json',
    },
  });
  
  return response.data;
};

/**
 * Récupérer tous les paiements - Version simplifiée
 */
export const getPayments = async (params = {}) => {
  const response = await api.get('/paiements', {
    params,
    headers: {
      'Accept': 'application/ld+json',
    }
  });
  
  // L'API renvoie { "member": [...] }, on retourne directement ça
  return response.data.member || response.data['hydra:member'] || [];
};

/**
 * Récupérer les paiements d'une réservation spécifique
 */
export const getPaymentsByReservation = async (reservationId) => {
  const response = await api.get('/paiements', {
    params: {
      'reservation': `/api/reservations/${reservationId}`
    },
    headers: {
      'Accept': 'application/ld+json',
    }
  });
  return response.data['hydra:member'] || response.data;
};

/**
 * Récupérer les paiements par type
 */
export const getPaymentsByType = async (typePaiement) => {
  const response = await api.get('/paiements', {
    params: {
      'typePaiement': typePaiement
    },
    headers: {
      'Accept': 'application/ld+json',
    }
  });
  return response.data['hydra:member'] || response.data;
};

/**
 * Lire un paiement par ID
 */
export const getPaymentById = async (id) => {
  const response = await api.get(`/paiements/${id}`, {
    headers: {
      'Accept': 'application/ld+json',
    }
  });
  return response.data;
};

/**
 * Mettre à jour un paiement
 */
export const updatePayment = async (id, updatedPayment) => {
  const validatedPayment = {
    ...updatedPayment,
    // S'assurer que les nouveaux champs sont bien formatés
    typePaiement: updatedPayment.typePaiement || 'solde',
    numeroTransaction: updatedPayment.numeroTransaction || null,
    commentaire: updatedPayment.commentaire || null,
    // Arrondir le montant à 2 décimales si présent
    ...(updatedPayment.montant && { 
      montant: roundToTwoDecimals(updatedPayment.montant).toString() 
    })
  };
  
  return api.patch(`/paiements/${id}`, validatedPayment, {
    headers: {
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json',
    },
  });
};

/**
 * Supprimer un paiement
 */
export const deletePayment = async (id) => {
  return api.delete(`/paiements/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
};

// === FONCTIONS UTILES AVEC CORRECTION DE PRÉCISION ===

/**
 * Calculer le total des paiements pour une réservation avec arrondi
 */
export const calculateTotalPaid = (payments) => {
  const total = payments.reduce((sum, payment) => {
    const amount = parseFloat(payment.montant);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  return roundToTwoDecimals(total);
};

/**
 * Filtrer les paiements par type
 */
export const filterPaymentsByType = (payments, type) => {
  return payments.filter(payment => payment.typePaiement === type);
};

/**
 * Obtenir le dernier paiement d'une liste
 */
export const getLatestPayment = (payments) => {
  if (!payments || payments.length === 0) return null;
  
  return payments.reduce((latest, current) => {
    const currentDate = new Date(current.datePaiement);
    const latestDate = new Date(latest.datePaiement);
    return currentDate > latestDate ? current : latest;
  });
};

/**
 * Obtenir les statistiques des paiements avec arrondi
 */
export const getPaymentStats = (payments) => {
  const totalAmount = calculateTotalPaid(payments);
  const acomptes = filterPaymentsByType(payments, 'acompte');
  const soldes = filterPaymentsByType(payments, 'solde');
  const remboursements = filterPaymentsByType(payments, 'remboursement');
  
  return {
    totalAmount: roundToTwoDecimals(totalAmount),
    totalCount: payments.length,
    acomptes: {
      count: acomptes.length,
      amount: roundToTwoDecimals(calculateTotalPaid(acomptes))
    },
    soldes: {
      count: soldes.length,
      amount: roundToTwoDecimals(calculateTotalPaid(soldes))
    },
    remboursements: {
      count: remboursements.length,
      amount: roundToTwoDecimals(calculateTotalPaid(remboursements))
    }
  };
};

/**
 * Calculer le montant restant à payer pour une réservation
 */
export const calculateRemainingAmount = (montantTotal, montantPaye) => {
  const total = roundToTwoDecimals(montantTotal);
  const paye = roundToTwoDecimals(montantPaye);
  const restant = roundToTwoDecimals(total - paye);
  
  // S'assurer que le restant n'est jamais négatif et gérer les micro-erreurs
  return Math.max(0, isEffectivelyZero(restant) ? 0 : restant);
};