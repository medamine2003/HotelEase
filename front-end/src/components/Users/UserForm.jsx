// un composant de création et de modification des utilisateurs
// a component that is used in the creation and modification of users
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import { createUser, updateUser, getUserById } from '../../services/userServices';
import ErrorDisplay from '../CommonComponents/ErrorDisplay';

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    plainPassword: '',
    role: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(id);

  // Fonction pour charger les données de l'utilisateur
  const loadUserData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getUserById(id);
      
      // Validation des données reçues
      if (!data || typeof data !== 'object') {
        throw new Error('Données invalides reçues du serveur');
      }

      setFormData({
        nom: data.nom || '',
        email: data.email || '',
        plainPassword: '',
        role: data.role || '',
      });
    } catch {
      setError("Impossible de charger les données de l'utilisateur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (error) setError(null);
  };

  const validateForm = () => {
    const errors = [];

    // Validation des champs obligatoires
    if (!formData.nom?.trim()) errors.push("Le nom est obligatoire");
    if (!formData.email?.trim()) errors.push("L'email est obligatoire");
    if (!formData.role) errors.push("Le rôle est obligatoire");
    
    // Mot de passe obligatoire seulement en création
    if (!isEditMode && !formData.plainPassword) {
      errors.push("Le mot de passe est obligatoire");
    }

    if (errors.length > 0) {
      setError(errors.join('. ') + '.');
      return false;
    }

    // Validation du nom : max 120 caractères
    const nomTrimmed = formData.nom.trim();
    if (nomTrimmed.length > 120) {
      setError("Le nom ne doit pas dépasser 120 caractères.");
      return false;
    }

    // Validation email stricte
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const emailTrimmed = formData.email.trim();
    
    if (emailTrimmed.length > 180) {
      setError("L'email ne doit pas dépasser 180 caractères.");
      return false;
    }
    
    if (!emailRegex.test(emailTrimmed.toLowerCase())) {
      setError("Format d'email invalide.");
      return false;
    }

    // Validation du mot de passe
    if (formData.plainPassword) {
      if (formData.plainPassword.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        return false;
      }
      if (formData.plainPassword.length > 255) {
        setError("Le mot de passe ne doit pas dépasser 255 caractères.");
        return false;
      }
      // Vérification de la complexité du mot de passe
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.plainPassword)) {
        setError("Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.");
        return false;
      }
    }

    // Validation du rôle
    const rolesValides = ['ROLE_ADMIN', 'ROLE_RECEPTIONNISTE'];
    if (!rolesValides.includes(formData.role)) {
      setError("Veuillez sélectionner un rôle valide.");
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

    // Préparation des données avec nettoyage
    const dataToSend = {
      nom: formData.nom.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
    };

    // Ajouter le mot de passe seulement si nécessaire
    if (!isEditMode || formData.plainPassword.trim()) {
      dataToSend.plainPassword = formData.plainPassword;
    }

    try {
      if (isEditMode) {
        await updateUser(id, dataToSend);
      } else {
        await createUser(dataToSend);
      }
      
      navigate('/users');
    } catch (err) {
      // Gestion des erreurs avec messages spécifiques
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || "Erreur de validation : vérifiez les champs saisis.";
        setError(errorMessage);
      } else if (err.response?.status === 409) {
        setError("Un utilisateur avec cet email existe déjà.");
      } else if (err.response?.status === 500) {
        setError("Erreur serveur : impossible d'enregistrer l'utilisateur. Veuillez réessayer.");
      } else {
        setError("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'ROLE_ADMIN': 'Administrateur',
      'ROLE_RECEPTIONNISTE': 'Utilisateur'
    };
    return roleLabels[role] || role;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status" aria-hidden="true">
            <span className="visually-hidden">Chargement des données de l'utilisateur...</span>
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
            {isEditMode ? `Modifier l'utilisateur "${formData.nom || `#${id}`}"` : 'Créer un utilisateur'}
          </h1>
          
          {error && (
            <Alert variant="danger" role="alert" aria-live="assertive">
              <Alert.Heading>Erreur</Alert.Heading>
              {error}
            </Alert>
          )}
          <Link 
            to='/users'
            className="btn btn-outline-secondary mb-3"
          >
            ← Retour à la liste des utilisateurs
          </Link>
          <Form onSubmit={handleSubmit} noValidate aria-labelledby="page-title">
            <Form.Group className="mb-3">
              <Form.Label htmlFor="nom">
                Nom complet <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Control
                id="nom"
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                maxLength={120}
                required
                aria-describedby="nom-help"
                aria-invalid={error && !formData.nom.trim() ? 'true' : 'false'}
                disabled={submitting}
                placeholder="Ex: Jean Dupont"
              />
              <Form.Text id="nom-help" className="text-muted">
                Nom et prénom de l'utilisateur (maximum 120 caractères)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="email">
                Adresse email <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Control
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                maxLength={180}
                required
                aria-describedby="email-help"
                aria-invalid={error && !formData.email.trim() ? 'true' : 'false'}
                disabled={submitting}
                placeholder="Ex: jean.dupont@exemple.com"
              />
              <Form.Text id="email-help" className="text-muted">
                Adresse email unique pour la connexion (maximum 180 caractères)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="plainPassword">
                Mot de passe 
                {!isEditMode && <span className="text-danger" aria-label="obligatoire"> *</span>}
                {isEditMode && <span className="text-muted"> (optionnel)</span>}
              </Form.Label>
              <Form.Control
                id="plainPassword"
                type="password"
                value={formData.plainPassword}
                onChange={(e) => handleInputChange('plainPassword', e.target.value)}
                minLength={6}
                maxLength={255}
                required={!isEditMode}
                aria-describedby="password-help"
                aria-invalid={error && !isEditMode && !formData.plainPassword ? 'true' : 'false'}
                disabled={submitting}
                placeholder={isEditMode ? "Laisser vide pour ne pas modifier" : "Minimum 6 caractères"}
              />
              <Form.Text id="password-help" className="text-muted">
                {isEditMode 
                  ? "Laissez vide pour conserver le mot de passe actuel"
                  : "Minimum 6 caractères avec au moins une minuscule, une majuscule et un chiffre"
                }
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label htmlFor="role">
                Rôle <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                required
                aria-describedby="role-help"
                aria-invalid={error && !formData.role ? 'true' : 'false'}
                disabled={submitting}
              >
                <option value="">-- Sélectionner un rôle --</option>
                <option value="ROLE_ADMIN">Administrateur</option>
                <option value="ROLE_RECEPTIONNISTE">Utilisateur</option>
              </Form.Select>
              <Form.Text id="role-help" className="text-muted">
                {formData.role ? (
                  <span>
                    Rôle sélectionné : <strong>{getRoleLabel(formData.role)}</strong>
                  </span>
                ) : (
                  "Définit les permissions de l'utilisateur dans l'application"
                )}
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={handleCancel}
                disabled={submitting}
                aria-label="Annuler et retourner à la liste des utilisateurs"
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting}
                aria-label={isEditMode ? "Mettre à jour l'utilisateur" : "Créer l'utilisateur"}
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
            <h3 className="h6 mb-2">Conseils de sécurité</h3>
            <ul className="small text-muted mb-0">
              <li>Utilisez un email unique pour chaque utilisateur</li>
              <li>Choisissez un mot de passe fort avec majuscules, minuscules et chiffres</li>
              <li>Attribuez le rôle approprié selon les besoins de l'utilisateur</li>
              <li>Les administrateurs ont accès à toutes les fonctionnalités</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserForm;