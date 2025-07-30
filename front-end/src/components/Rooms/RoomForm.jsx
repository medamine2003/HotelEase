// un composant de création et de modification des chambres
// a component that is used in the creation and modification of rooms
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import { createRoom, updateRoom, getRoomById } from '../../services/roomServices';
import ErrorDisplay from '../CommonComponents/ErrorDisplay';

function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    numero: '',
    type: '',
    etat: '',
    capacite: '',
    prixChambre: '',
    description: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(id);

  // Types de chambres disponibles
  const roomTypes = [
    'Standard',
    'Confort',
    'Suite',
    'Familiale',
    'Deluxe',
    'Junior Suite',
    'Suite Présidentielle'
  ];

  const loadRoomData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getRoomById(id);

      if (!data || typeof data !== 'object') {
        throw new Error('Données invalides reçues du serveur');
      }

      setFormData({
        numero: data.numero || '',
        type: data.type || '',
        etat: data.etat || '',
        capacite: data.capacite ? String(data.capacite) : '',
        prixChambre: data.prixChambre ? String(data.prixChambre) : '',
        description: data.description || ''
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  // Validation avec message clair et concaténé
  const validateForm = () => {
    const errors = [];

    if (!formData.numero?.trim()) errors.push("Le numéro de la chambre est obligatoire");
    if (!formData.type?.trim()) errors.push("Le type de chambre est obligatoire");
    if (!formData.etat?.trim()) errors.push("L'état de la chambre est obligatoire");
    if (!formData.capacite?.trim()) errors.push("La capacité est obligatoire");
    if (!formData.prixChambre?.trim()) errors.push("Le prix est obligatoire");

    // Vérification numéro : 1 à 6 chiffres uniquement
    const numeroTrimmed = formData.numero.trim();
    if (numeroTrimmed.length > 6) {
      errors.push("Le numéro doit contenir au maximum 6 caractères");
    }
    if (!/^\d+$/.test(numeroTrimmed)) {
      errors.push("Le numéro doit contenir uniquement des chiffres");
    }

    // Type valide
    if (!roomTypes.includes(formData.type)) {
      errors.push("Veuillez choisir un type valide parmi les options proposées");
    }

    // État valide
    const etatsValides = ['disponible', 'occupee', 'maintenance'];
    if (!etatsValides.includes(formData.etat)) {
      errors.push("Veuillez choisir un état valide parmi : Disponible, Occupée, Maintenance");
    }

    // Capacité : entier entre 1 et 50
    const capaciteNum = Number(formData.capacite);
    if (isNaN(capaciteNum) || !Number.isInteger(capaciteNum) || capaciteNum < 1 || capaciteNum > 50) {
      errors.push("La capacité doit être un nombre entier entre 1 et 50");
    }

    // Prix : nombre positif, max 999999.99, format valide
    const prixNum = parseFloat(formData.prixChambre);
    if (isNaN(prixNum) || prixNum < 0) {
      errors.push("Le prix doit être un nombre positif");
    }
    if (prixNum > 999999.99) {
      errors.push("Le prix ne peut pas dépasser 999 999,99 €");
    }
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(formData.prixChambre)) {
      errors.push("Le prix doit être un nombre avec au maximum deux décimales, par exemple 120.50");
    }

    // Description max 1000 caractères
    if (formData.description && formData.description.length > 1000) {
      errors.push("La description ne doit pas dépasser 1000 caractères");
    }

    if (errors.length > 0) {
      setError(errors.join('. ') + '.');
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

    const submitData = {
      numero: formData.numero.trim(),
      type: formData.type.trim(),
      etat: formData.etat,
      capacite: Number(formData.capacite),
      prixChambre: formData.prixChambre,
      description: formData.description?.trim() || null
    };

    try {
      if (isEditMode) {
        await updateRoom(id, submitData);
      } else {
        await createRoom(submitData);
      }

      navigate('/rooms');
    } catch (err) {
      
      
      // L'erreur est dans err.message (string JSON)
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
        // Si le parsing JSON échoue, utiliser le message tel quel
        setError(err.message || "Une erreur est survenue");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/rooms');
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status" aria-hidden="true">
            <span className="visually-hidden">Chargement des données de la chambre...</span>
          </div>
          <p className="mt-2">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="mt-4 px-2">
            <h1 id="page-title" className="mb-4 h3">
              {isEditMode ? `Modifier chambre #${formData.numero || id}` : 'Créer une chambre'}
            </h1>

            <ErrorDisplay 
              error={error}
              onDismiss={() => setError(null)}
              title={id ? "Erreur lors de la modification" : "Erreur lors de la création"}
            />
            <Link 
          to='/rooms'
          className="btn btn-outline-secondary mb-3"
        >
          ← Retour à la liste des chambres
        </Link>
            <Form onSubmit={handleSubmit} noValidate aria-labelledby="page-title">
            <Form.Group className="mb-3">
              <Form.Label htmlFor="numero">
                Numéro <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Control
                id="numero"
                type="text"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                maxLength={6}
                required
                aria-describedby="numero-help"
                aria-invalid={error && !formData.numero ? 'true' : 'false'}
                disabled={submitting}
              />
              <Form.Text id="numero-help" className="text-muted">
                Maximum 6 chiffres (ex: 101)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="type">
                Type <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                required
                aria-invalid={error && !formData.type ? 'true' : 'false'}
                disabled={submitting}
              >
                <option value="">-- Sélectionner un type --</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="etat">
                État <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Select
                id="etat"
                value={formData.etat}
                onChange={(e) => handleInputChange('etat', e.target.value)}
                required
                aria-invalid={error && !formData.etat ? 'true' : 'false'}
                disabled={submitting}
              >
                <option value="">-- Sélectionner un état --</option>
                <option value="disponible">Disponible</option>
                <option value="occupee">Occupée</option>
                <option value="maintenance">Maintenance</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="capacite">
                Capacité <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Control
                id="capacite"
                type="number"
                min="1"
                max="50"
                value={formData.capacite}
                onChange={(e) => handleInputChange('capacite', e.target.value)}
                required
                aria-invalid={error && !formData.capacite ? 'true' : 'false'}
                disabled={submitting}
              />
              <Form.Text className="text-muted">
                Nombre entier entre 1 et 50
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="prixChambre">
                Prix <span className="text-danger" aria-label="obligatoire">*</span>
              </Form.Label>
              <Form.Control
                id="prixChambre"
                type="text"
                value={formData.prixChambre}
                onChange={(e) => handleInputChange('prixChambre', e.target.value)}
                required
                placeholder="Ex: 120.50"
                aria-invalid={error && !formData.prixChambre ? 'true' : 'false'}
                disabled={submitting}
              />
              <Form.Text className="text-muted">
                Prix en euros, format numérique, max 2 décimales
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="description">Description</Form.Label>
              <Form.Control
                id="description"
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                maxLength={1000}
                disabled={submitting}
                aria-describedby="description-help"
              />
              <Form.Text id="description-help" className="text-muted">
                Optionnel, max 1000 caractères
              </Form.Text>
            </Form.Group>

            <div className="d-grid gap-2 d-md-flex justify-content-md-between">
              <Button variant="secondary" onClick={handleCancel} disabled={submitting} className="btn-sm">
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={submitting} className="btn-sm">
                {submitting ? (isEditMode ? 'Enregistrement...' : 'Création...') : (isEditMode ? 'Enregistrer' : 'Créer')}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
    </div>
  );
}

export default RoomForm;