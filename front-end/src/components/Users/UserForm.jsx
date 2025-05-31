import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { createUser, updateUser, getUserById } from '../../services/userServices';

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    plainPassword: '',
    role: '', // Chaîne simple, pas tableau
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      getUserById(id)
        .then((data) => {
          setFormData({
            nom: data.nom || '',
            email: data.email || '',
            plainPassword: '',
            role: data.role || '', // Directement la chaîne
          });
        })
        .catch(() => setError("Impossible de charger les données de l'utilisateur"));
    }
  }, [id]);

  const validateForm = () => {
  if (
    !formData.nom ||
    !formData.email ||
    (!id && !formData.plainPassword) ||
    !formData.role
  ) {
    setError("Tous les champs sont obligatoires sauf le mot de passe en modification.");
    return false;
  }

  if (formData.nom.length > 120) {
    setError("Le nom ne doit pas dépasser 120 caractères.");
    return false;
  }

  // Validation email avec ton regex précis
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (formData.email.length > 180 || !emailRegex.test(formData.email.toLowerCase())) {
    setError("Email invalide.");
    return false;
  }

  if (!id && formData.plainPassword.length < 6) {
    setError("Le mot de passe doit contenir au moins 6 caractères.");
    return false;
  }

  if (formData.role.length > 50) {
    setError("Le rôle ne doit pas dépasser 50 caractères.");
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

    // Préparer les données à envoyer
    const dataToSend = {
      nom: formData.nom,
      email: formData.email,
      role: formData.role, // Directement la chaîne
    };

    // Ajouter plainPassword seulement si nécessaire
    if (!id || formData.plainPassword) {
      dataToSend.plainPassword = formData.plainPassword;
    }

    console.log('Données envoyées à l\'API :', dataToSend);

    try {
      if (id) {
        await updateUser(id, dataToSend);
      } else {
        await createUser(dataToSend);
      }
      navigate('/users');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement de l'utilisateur.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>{id ? "Modifier un utilisateur" : "Créer un utilisateur"}</h2>
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
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            maxLength={180}
            required
          />
        </Form.Group>

        {!id && (
          <Form.Group className="mb-3">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control
              type="password"
              value={formData.plainPassword}
              onChange={(e) => setFormData({ ...formData, plainPassword: e.target.value })}
              minLength={6}
              required
            />
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Rôle</Form.Label>
          <Form.Select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
          >
            <option value="">-- Sélectionner un rôle --</option>
            <option value="ROLE_ADMIN">Admin</option>
            <option value="ROLE_USER">User</option>
          </Form.Select>
        </Form.Group>

        <Button variant="primary" type="submit">
          {id ? 'Mettre à jour' : 'Créer'}
        </Button>
      </Form>
    </div>
  );
}

export default UserForm;