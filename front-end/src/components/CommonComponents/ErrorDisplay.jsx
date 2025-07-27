import React from 'react';
import { Alert } from 'react-bootstrap';

const ErrorDisplay = ({
  error = null,
  variant = 'danger',
  dismissible = true,
  onDismiss,
  className = '',
  title = 'Une erreur s\'est produite'
}) => {
  // Si pas d'erreur, ne rien afficher
  if (!error) {
    return null;
  }

  // Fonction pour extraire le message d'erreur selon différents formats
  const getErrorMessage = (errorData) => {
    

    // Si c'est déjà une string
    if (typeof errorData === 'string') {
      return errorData;
    }

    // Si c'est un objet Error JavaScript standard
    if (errorData instanceof Error && !errorData.response) {
      return errorData.message;
    }

    // Si c'est une erreur Axios avec response
    if (errorData.response) {
      const { status, data } = errorData.response;
      
      

      // Erreur 422 - Validation errors d'API Platform
      if (status === 422 && data) {
        // Format API Platform avec violations (le plus courant)
        if (data.violations && Array.isArray(data.violations) && data.violations.length > 0) {
          return data.violations.map(violation => {
            return violation.message || 'Erreur de validation';
          });
        }

        // Format API Platform avec hydra:description
        if (data['hydra:description']) {
          return data['hydra:description'];
        }

        // Format API Platform avec detail
        if (data.detail) {
          return data.detail;
        }

        // Format API Platform avec title
        if (data.title) {
          return data.title;
        }

        // Si violations existe mais est vide
        if (data.violations && Array.isArray(data.violations) && data.violations.length === 0) {
          return 'Erreur de validation (aucun détail disponible)';
        }

        // Si data est un string
        if (typeof data === 'string') {
          return data;
        }

        // Fallback pour 422 - essayer d'extraire toute info utile
        const possibleMessages = [];
        if (data.message) possibleMessages.push(data.message);
        if (data.error) possibleMessages.push(data.error);
        if (possibleMessages.length > 0) {
          return possibleMessages.join(' - ');
        }

        // Dernier recours pour 422
        return 'Erreur de validation (format de réponse non reconnu)';
      }

      // Erreur 400 - Bad Request
      if (status === 400 && data) {
        if (data.message) return data.message;
        if (data.detail) return data.detail;
        if (data['hydra:description']) return data['hydra:description'];
        if (data.title) return data.title;
      }

      // Erreur 500 - Internal Server Error
      if (status === 500) {
        return data?.message || 'Erreur interne du serveur. Veuillez réessayer plus tard.';
      }

      // Erreur 404 - Not Found
      if (status === 404) {
        return data?.message || 'Ressource non trouvée.';
      }

      // Autres erreurs avec message dans data
      if (data && data.message) {
        return data.message;
      }

      // Fallback avec le status code
      return `Erreur ${status}: ${data?.title || data?.detail || 'Erreur inattendue'}`;
    }

    // Si c'est une erreur réseau sans response
    if (errorData.request) {
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    }

    // Si on a juste un message
    if (errorData.message) {
      return errorData.message;
    }

    // Fallback final
    return 'Une erreur inattendue s\'est produite';
  };

  const errorMessage = getErrorMessage(error);
  const isArrayOfMessages = Array.isArray(errorMessage);

  return (
    <Alert
      variant={variant}
      dismissible={dismissible}
      onClose={onDismiss}
      className={`mb-3 ${className}`}
    >
      <Alert.Heading className="h6 mb-2">{title}</Alert.Heading>
      {isArrayOfMessages ? (
        <ul className="mb-0 ps-3">
          {errorMessage.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-0">{errorMessage}</p>
      )}
    </Alert>
  );
};

export default ErrorDisplay;