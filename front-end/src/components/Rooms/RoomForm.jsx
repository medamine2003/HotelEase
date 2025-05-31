import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { createRoom, updateRoom, getRoomById } from '../../services/roomServices';

function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    numero: '',
    type: '',
    etat: '',
    capacite: '',
    description: ''
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      getRoomById(id)
        .then((data) => {
          setFormData({
            numero: data.numero || '',
            type: data.type || '',
            etat: data.etat || '',
            capacite: data.capacite ? String(data.capacite) : '',
            description: data.description || ''
          });
        })
        .catch(() => setError("Impossible de charger les données de la chambre"));
    }
  }, [id]);

  const validateForm = () => {
    // Vérification des champs obligatoires
    if (!formData.numero || !formData.type || !formData.etat || !formData.capacite) {
      setError("Les champs Numéro, Type, État et Capacité sont obligatoires.");
      return false;
    }

    // numero : max 10 caractères, uniquement chiffres
    if (formData.numero.length > 6) {
      setError("Le numéro ne doit pas dépasser 6 caractères.");
      return false;
    }
    if (!/^\d+$/.test(formData.numero)) {
      setError("Le numéro doit contenir uniquement des chiffres.");
      return false;
    }

    // type max 50 caractères
    if (formData.type.length > 50) {
      setError("Le type ne doit pas dépasser 50 caractères.");
      return false;
    }

    // etat max 50 caractères
    if (formData.etat.length > 50) {
      setError("L'état ne doit pas dépasser 50 caractères.");
      return false;
    }

    // capacite entier positif
    const capaciteNum = Number(formData.capacite);
    if (
      isNaN(capaciteNum) ||
      !Number.isInteger(capaciteNum) ||
      capaciteNum <= 0
    ) {
      setError("La capacité doit être un nombre entier positif.");
      return false;
    }

    // description facultative max 1000 caractères
    if (formData.description && formData.description.length > 1000) {
      setError("La description ne doit pas dépasser 1000 caractères.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Préparation des données à envoyer (capacite en nombre)
    const submitData = {
      numero: formData.numero,
      type: formData.type,
      etat: formData.etat,
      capacite: Number(formData.capacite),
      description: formData.description || null
    };

    try {
      if (id) {
        await updateRoom(id, submitData);
      } else {
        await createRoom(submitData);
      }
      navigate('/rooms');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement de la chambre.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>{id ? 'Modifier une chambre' : 'Créer une chambre'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Numéro</Form.Label>
          <Form.Control
            type="text"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            maxLength={6}
            required
            
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Type</Form.Label>
          <Form.Control
            type="text"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            maxLength={50}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>État</Form.Label>
          <Form.Control
            type="text"
            value={formData.etat}
            onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
            maxLength={50}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Capacité</Form.Label>
          <Form.Control
            type="number"
            value={formData.capacite}
            onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
            min={1}
            required
          />
          <Form.Text>personnes</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description (facultatif)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={2}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          {id ? 'Mettre à jour' : 'Créer'}
        </Button>
      </Form>
    </div>
  );
}

export default RoomForm;
