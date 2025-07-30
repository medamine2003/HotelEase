// un composant de création et de modification des services
// a component that is used in the creation and modification of services
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import { createService, updateService, getServiceById } from '../../services/serviceServices';
import ErrorDisplay from '../CommonComponents/ErrorDisplay';

function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    prixService: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(id);

  // Fonction pour charger les données du service
  const loadServiceData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getServiceById(id);
      
      // Validation des données reçues
      if (!data || typeof data !== 'object') {
        throw new Error('Données invalides reçues du serveur');
      }

      setFormData({
        nom: data.nom || '',
        prixService: data.prixService ? data.prixService.toString() : ''
      });
    } catch {
      setError("Impossible de charger les données du service. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadServiceData();
  }, [loadServiceData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (error) setError(null);
  };

  const validateForm = () => {
    const errors = [];

    // Validation des champs obligatoires
    if (!formData.nom?.trim()) errors.push("Le nom du service est obligatoire");
    if (!formData.prixService?.trim()) errors.push("Le prix du service est obligatoire");

    if (errors.length > 0) {
      setError(errors.join('. ') + '.');
      return false;
    }

    // Validation du nom : max 80 caractères
    const nomTrimmed = formData.nom.trim();
    if (nomTrimmed.length === 0 || nomTrimmed.length > 80) {
      setError("Le nom doit contenir entre 1 et 80 caractères.");
      return false;
    }

    // Validation du prix : nombre positif
    const prix = parseFloat(formData.prixService);
    if (isNaN(prix) || prix <= 0) {
      setError("Le prix du service doit être un nombre positif.");
      return false;
    }
    if (prix > 999999.99) {
      setError("Le prix ne peut pas dépasser 999 999,99 €.");
      return false;
    }
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(formData.prixService)) {
      setError("Le prix doit être un nombre valide avec deux décimales maximum (ex: 25.50).");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || submitting) return;

    setSubmitting(true);
    setError(null);

    // Préparation des données avec validation
    const payload = {
      nom: formData.nom.trim(),
      prixService: parseFloat(formData.prixService).toFixed(2)
    };

    try {
      if (isEditMode) {
        await updateService(id, payload);
      } else {
        await createService(payload);
      }
      
      navigate('/services');
    } catch (err) {
      
      
      // Essayer plusieurs méthodes pour extraire le message
      try {
        
        const errorData = JSON.parse(err.message);
        if (errorData.violations?.[0]?.message) {
          setError(errorData.violations[0].message);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError("Une erreur est survenue");
        }
      } catch {
        
        if (err.response?.data?.violations?.[0]?.message) {
          setError(err.response.data.violations[0].message);
        } else if (err.response?.data?.detail) {
          setError(err.response.data.detail);
        } 
        
        else {
          setError(err);
        }
      }
    } finally {
      setSubmitting(false);
    }


  };

  const handleCancel = () => {
    navigate('/services');
  };

  const formatPrice = (price) => {
    if (!price) return '';
    const num = parseFloat(price);
    return isNaN(num) ? '' : num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status" aria-hidden="true">
            <span className="visually-hidden">Chargement des données du service...</span>
          </div>
          <p className="mt-2">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 id="page-title" className="mb-4">
            {isEditMode ? `Modifier le service "${formData.nom || `#${id}`}"` : 'Créer un service'}
          </h1>
          
          <ErrorDisplay 
          error={error}
          onDismiss={() => setError(null)}
          title={id ? "Erreur lors de la modification" : "Erreur lors de la création"}
          />
          <Link 
            to='/services'
            className="btn btn-outline-secondary mb-3"
          >
            ← Retour à la liste des services
          </Link>
          <Form onSubmit={handleSubmit} noValidate aria-labelledby="page-title">
            <Form.Group className="mb-3">
              <Form.Label htmlFor="nom">
                Nom du service <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Control
                id="nom"
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                maxLength={80}
                required
                aria-describedby="nom-help"
                aria-invalid={error && !formData.nom.trim() ? 'true' : 'false'}
                disabled={submitting}
                placeholder="Ex: Petit-déjeuner, Wi-Fi, Parking..."
              />
              <Form.Text id="nom-help" className="text-muted">
                Maximum 80 caractères ({formData.nom.length}/80)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label htmlFor="prixService">
                Prix du service (€) <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Control
                id="prixService"
                type="number"
                value={formData.prixService}
                onChange={(e) => handleInputChange('prixService', e.target.value)}
                min="0.01"
                max="999999.99"
                step="0.01"
                required
                aria-describedby="prix-help"
                aria-invalid={error && !formData.prixService ? 'true' : 'false'}
                disabled={submitting}
                placeholder="Ex: 15.50"
              />
              <Form.Text id="prix-help" className="text-muted">
                Prix en euros avec deux décimales maximum
                {formData.prixService && (
                  <span className="d-block">
                    Aperçu : <strong>{formatPrice(formData.prixService)} €</strong>
                  </span>
                )}
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={handleCancel}
                disabled={submitting}
                aria-label="Annuler et retourner à la liste des services"
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting}
                aria-label={isEditMode ? "Mettre à jour le service" : "Créer le service"}
              >
                {submitting ? (
                  <>
                    <span 
                      className="spinner-border spinner-border-sm me-2" 
                      role="status" 
                      aria-hidden="true"
                    ></span>
                    <span aria-live="polite">
                      {isEditMode ? 'Mise à jour...' : 'Création...'}
                    </span>
                  </>
                ) : (
                  isEditMode ? 'Mettre à jour' : 'Créer'
                )}
              </Button>
            </div>
          </Form>

          {/* Aide contextuelle */}
          <div className="mt-4 p-3 bg-light rounded">
            <h3 className="h6 mb-2">Conseils</h3>
            <ul className="small text-muted mb-0">
              <li>Choisissez un nom descriptif pour votre service</li>
              <li>Le prix peut inclure jusqu'à 2 décimales (ex: 15.50)</li>
              <li>Les services peuvent être associés aux réservations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceForm;