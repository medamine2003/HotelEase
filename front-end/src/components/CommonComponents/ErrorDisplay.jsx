// un composant d'affichage
// ce composant est utilisé pour la gestion des erreurs, il est importé et utilisé où c'est nécessaire.
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

  
  const getErrorMessage = (errorData) => {
    

    
    if (typeof errorData === 'string') {
      return errorData;
    }

    
    if (errorData instanceof Error && !errorData.response) {
      return errorData.message;
    }

   
    if (errorData.response) {
      const { status, data } = errorData.response;
      
      

      
      if (status === 422 && data) {
       
        if (data.violations && Array.isArray(data.violations) && data.violations.length > 0) {
          return data.violations.map(violation => {
            return violation.message || 'Erreur de validation';
          });
        }

       
        if (data['hydra:description']) {
          return data['hydra:description'];
        }

        
        if (data.detail) {
          return data.detail;
        }

        
        if (data.title) {
          return data.title;
        }

        if (data.violations && Array.isArray(data.violations) && data.violations.length === 0) {
          return 'Erreur de validation (aucun détail disponible)';
        }

        
        if (typeof data === 'string') {
          return data;
        }

       
        const possibleMessages = [];
        if (data.message) possibleMessages.push(data.message);
        if (data.error) possibleMessages.push(data.error);
        if (possibleMessages.length > 0) {
          return possibleMessages.join(' - ');
        }

        
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