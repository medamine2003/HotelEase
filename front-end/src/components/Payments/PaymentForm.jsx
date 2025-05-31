import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { createPayment, updatePayment, getPaymentById } from '../../services/paymentService';

function PaymentForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    montant: '',
    methodePaiement: '',
    datePaiement: ''
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      getPaymentById(id)
        .then((data) => {
          setFormData({
            montant: data.montant || '',
            methodePaiement: data.methodePaiement || '',
            datePaiement: data.datePaiement ? data.datePaiement.slice(0, 16) : ''
          });
        })
        .catch(() => setError("Impossible de charger les données du paiement"));
    }
  }, [id]);

  const validateForm = () => {
    if (!formData.montant || !formData.methodePaiement || !formData.datePaiement) {
      setError("Tous les champs sont obligatoires.");
      return false;
    }

    if (isNaN(formData.montant) || parseFloat(formData.montant) <= 0) {
      setError("Le montant doit être un nombre positif.");
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
      datePaiement: new Date(formData.datePaiement).toISOString()
    };
    if (isNaN(formData.montant) || parseFloat(formData.montant) <= 0) {
        setError("Le montant doit être un nombre positif.");
    return false;
}

    try {
      if (id) {
        await updatePayment(id, payload);
      } else {
        await createPayment(payload);
      }
      navigate('/payments');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement du paiement.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>{id ? 'Modifier un paiement' : 'Créer un paiement'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Montant (€)</Form.Label>
          <div className="col-sm-8">
            <Form.Control
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              required
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Méthode de paiement</Form.Label>
          <div className="col-sm-8">
            <Form.Select
              value={formData.methodePaiement}
              onChange={(e) => setFormData({ ...formData, methodePaiement: e.target.value })}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Espèces">Espèces</option>
              <option value="Carte bancaire">Carte bancaire</option>
              <option value="Virement bancaire">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Chèque vacances (ANCV)">Chèque vacances (ANCV)</option>
              <option value="Paiement en ligne">Paiement en ligne</option>
              <option value="PayPal">PayPal</option>
            </Form.Select>
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Date de paiement</Form.Label>
          <div className="col-sm-8">
            <Form.Control
              type="datetime-local"
              value={formData.datePaiement}
              onChange={(e) => setFormData({ ...formData, datePaiement: e.target.value })}
              required
            />
          </div>
        </Form.Group>

        <div className="text-end">
          <Button variant="primary" type="submit">
            {id ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default PaymentForm;
