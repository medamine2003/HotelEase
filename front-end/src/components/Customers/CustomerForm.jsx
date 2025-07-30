// un composant de création et de modification des clients
// a component that is used in the creation and modification of a new customer
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import { createCustomer, updateCustomer, getCustomerById } from '../../services/customerServices';
import ErrorDisplay from '../CommonComponents/ErrorDisplay'; 

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getCustomerById(id)
        .then((data) => setFormData(data))
        .catch((err) => {
          console.error('Erreur chargement client:', err);
          setError(err);
        });
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

    if (formData.numeroTelephone.length < 6 || formData.numeroTelephone.length > 17) {
      setError(`Le numéro de téléphone doit contenir entre 6 et 17 caractères.`);
      return false;
    }

    if (!/^\+?[1-9]\d{1,14}$/.test(formData.numeroTelephone)) {
      setError("Le numéro de téléphone n'est pas valide (format international attendu).");
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
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (id) {
        await updateCustomer(id, formData);
      } else {
        await createCustomer(formData);
      }
      navigate('/customers');
    } catch (err) {
       
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="container mt-4">
      <h2>{id ? 'Modifier un client' : 'Créer un client'}</h2>
      
      
      <ErrorDisplay 
        error={error}
        onDismiss={() => setError(null)}
        title={id ? "Erreur lors de la modification" : "Erreur lors de la création"}
      />
      <Link 
        to='/customers'
        className="btn btn-outline-secondary mb-3"
      >
        ← Retour à la liste des clients
      </Link>
      <Form onSubmit={handleSubmit} aria-label="Formulaire client">
        <Form.Group className="mb-3" controlId="formNom">
          <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            maxLength={120}
            required
            aria-required="true"
            aria-describedby="nomHelp"
          />
          <Form.Text id="nomHelp" muted>
            Maximum 120 caractères.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPrenom">
          <Form.Label>Prénom <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            value={formData.prenom}
            onChange={(e) => handleChange('prenom', e.target.value)}
            maxLength={120}
            required
            aria-required="true"
            aria-describedby="prenomHelp"
          />
          <Form.Text id="prenomHelp" muted>
            Maximum 120 caractères.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formTelephone">
          <Form.Label>Numéro de téléphone <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="tel"
            inputMode="numeric"
            pattern="\+?[1-9]\d{1,14}"
            title="Le numéro de téléphone doit être au format international (6-17 caractères)."
            value={formData.numeroTelephone}
            onChange={(e) => handleChange('numeroTelephone', e.target.value)}
            minLength={6}
            maxLength={17}
            required
            aria-required="true"
            aria-describedby="telephoneHelp"
          />
          <Form.Text id="telephoneHelp" muted>
            Format international, 6 à 17 caractères (ex: +33123456789).
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formAdresse">
          <Form.Label>Adresse de facturation (facultatif)</Form.Label>
          <Form.Control
            type="text"
            value={formData.adresseFacturation}
            onChange={(e) => handleChange('adresseFacturation', e.target.value)}
            maxLength={255}
            aria-describedby="adresseHelp"
          />
          <Form.Text id="adresseHelp" muted>
            Maximum 255 caractères.
          </Form.Text>
        </Form.Group>

        <Button 
          variant="primary" 
          type="submit" 
          disabled={loading}
          aria-label={id ? "Mettre à jour le client" : "Créer un nouveau client"}
        >
          {loading ? (
            <>
              <span 
                className="spinner-border spinner-border-sm me-2" 
                role="status" 
                aria-hidden="true"
              ></span>
              {id ? 'Mise à jour...' : 'Création...'}
            </>
          ) : (
            id ? 'Mettre à jour' : 'Créer'
          )}
        </Button>
      </Form>
    </div>
  );
}

export default CustomerForm;