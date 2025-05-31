import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { createService, updateService, getServiceById } from '../../services/serviceServices';

function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    prixService: ''
  });

  const [error, setError] = useState(null);
    console.log('ID:', id);
    console.log('FormData:', formData);
  useEffect(() => {
    if (id) {
      getServiceById(id)
        .then((data) => {
          setFormData({
            nom: data.nom || '',
            prixService: data.prixService?.toString() || ''
          });
        })
        .catch(() => setError("Impossible de charger les données du service"));
    }
  }, [id]);

  const validateForm = () => {
    if (!formData.nom || !formData.prixService) {
      setError("Le nom et le prix du service sont obligatoires.");
      return false;
    }

    if (formData.nom.length > 80) {
      setError("Le nom ne doit pas dépasser 80 caractères.");
      return false;
    }

    const prix = parseFloat(formData.prixService);
    if (isNaN(prix) || prix <= 0) {
      setError("Le prix du service doit être un nombre positif.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      ...formData,
       prixService: parseFloat(formData.prixService).toFixed(2)
    };

    try {
      if (id) {
        await updateService(id, payload);
      } else {
        await createService(payload);
      }
      navigate('/services');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement du service.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>{id ? 'Modifier un service' : 'Créer un service'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nom du service</Form.Label>
          <Form.Control
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            maxLength={80}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Prix du service (€)</Form.Label>
          <Form.Control
            type="number"
            min={0.01}
            step="0.01"
            value={formData.prixService}
            onChange={(e) => setFormData({ ...formData, prixService: e.target.value })}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          {id ? 'Mettre à jour' : 'Créer'}
        </Button>
      </Form>
    </div>
  );
}

export default ServiceForm;
