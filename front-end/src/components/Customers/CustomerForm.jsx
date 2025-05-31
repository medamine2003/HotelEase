import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { createCustomer, updateCustomer, getCustomerById } from '../../services/customerServices';

function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    numeroTelephone: '',
    adresseFacturation: ''
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      getCustomerById(id)
        .then((data) => setFormData(data))
        .catch(() => setError("Impossible de charger les données du client"));
    }
  }, [id]);

  const validateForm = () => {
    if (!formData.nom || !formData.prenom || !formData.numeroTelephone) {
      setError("Les champs Nom, Prénom et Téléphone sont obligatoires.");
      return false;
    }

    if (formData.nom.length > 120) {
      setError("Le nom ne doit pas dépasser 120 caractères.");
      return false;
    }

    if (formData.prenom.length > 120) {
      setError("Le prénom ne doit pas dépasser 120 caractères.");
      return false;
    }

    
    if (!/^\d{1,20}$/.test(formData.numeroTelephone)) {
      setError("Le numéro de téléphone doit contenir uniquement des chiffres et ne pas dépasser 20 caractères.");
      return false;
    }

    if (formData.adresseFacturation && formData.adresseFacturation.length > 255) {
      setError("L'adresse de facturation ne doit pas dépasser 255 caractères.");
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

  console.log('Données envoyées:', formData);

  try {
    if (id) {
      await updateCustomer(id, formData);
    } else {
      await createCustomer(formData);
    }
    navigate('/customers');
  } catch (err) {
    console.error(err);
    setError("Erreur lors de l'enregistrement du client.");
  }
};


  return (
    <div className="container mt-4">
      <h2>{id ? 'Modifier un client' : 'Créer un client'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nom</Form.Label>
          <Form.Control
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            maxLength={120}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Prénom</Form.Label>
          <Form.Control
            type="text"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            maxLength={120}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Numéro de téléphone</Form.Label>
          <Form.Control
            type="text"
            value={formData.numeroTelephone}
            onChange={(e) => setFormData({ ...formData, numeroTelephone: e.target.value })}
            maxLength={20}
            pattern="\d{1,20}"
            title="Le numéro de téléphone doit contenir uniquement des chiffres et ne pas dépasser 20 caractères."
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Adresse de facturation (facultatif)</Form.Label>
          <Form.Control
            type="text"
            value={formData.adresseFacturation}
            onChange={(e) => setFormData({ ...formData, adresseFacturation: e.target.value })}
            maxLength={255}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          {id ? 'Mettre à jour' : 'Créer'}
        </Button>
      </Form>
    </div>
  );
}

export default CustomerForm;
