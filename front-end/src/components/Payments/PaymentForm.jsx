// un composant de création et de modification des paiments
// a component that is used in the creation and modification of a new payment
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Form,  Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { createPayment, updatePayment, getPaymentById, validatePaymentAmount, formatAmount } from '../../services/paymentServices';
import { getReservations, getReservationById } from '../../services/reservationServices';
import ErrorDisplay from '../CommonComponents/ErrorDisplay';

function PaymentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation');

  const isNewPayment = id === 'nouveau';
  const paymentId = isNewPayment ? null : id;

  const [formData, setFormData] = useState({
    montant: '',
    methodePaiement: '',
    datePaiement: (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  })(),
    typePaiement: 'solde',
    numeroTransaction: '',
    commentaire: '',
    reservation: reservationId ? `/api/reservations/${reservationId}` : ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        
        const reservationsData = await getReservations();
        
        
        setReservations(reservationsData || []);

        
        if (paymentId) {
          
          const paymentData = await getPaymentById(paymentId);
          
          
          setFormData({
            montant: paymentData.montant || '',
            methodePaiement: paymentData.methodePaiement || '',
            datePaiement: paymentData.datePaiement ? paymentData.datePaiement.slice(0, 16) : '',
            typePaiement: paymentData.typePaiement || 'solde',
            numeroTransaction: paymentData.numeroTransaction || '',
            commentaire: paymentData.commentaire || '',
            reservation: paymentData.reservation?.['@id'] || ''
          });

         
          const resId = paymentData.reservation?.['@id']?.split('/').pop() || paymentData.reservation?.id;
          if (resId) {
            
            const reservationData = await getReservationById(resId);
            setSelectedReservation(reservationData);
          }
        } 
       
        else if (reservationId) {
          
          const reservationData = await getReservationById(reservationId);
          setSelectedReservation(reservationData);
        }

      } catch (err) {
        console.error(' Erreur lors du chargement:', err);
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [paymentId, reservationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (error) setError(null);
  };

  const handleReservationChange = (e) => {
    const reservationUri = e.target.value;
    setFormData((prev) => ({ ...prev, reservation: reservationUri }));

    if (reservationUri) {
      const resId = reservationUri.split('/').pop();
      const reservation = reservations.find((r) => r.id == resId);
      setSelectedReservation(reservation);

      
      if (reservation && !formData.montant) {
        const montantSuggere = reservation.montantRestant || reservation.montantTotal || 0;
        setFormData((prev) => ({
          ...prev,
          montant: montantSuggere.toString()
        }));
      }
    } else {
      setSelectedReservation(null);
    }
  };

  const validateForm = () => {
  const { montant, methodePaiement, datePaiement, reservation } = formData;

  if (!montant || !methodePaiement?.trim() || !datePaiement || !reservation) {
    setError("Veuillez remplir tous les champs obligatoires.");
    return false;
  }

  const montantFloat = parseFloat(montant);
  if (isNaN(montantFloat) || montantFloat <= 0) {
    setError("Le montant doit être un nombre positif.");
    return false;
  }

  
  const datePayment = new Date(datePaiement);
  if (isNaN(datePayment.getTime())) {
    setError("La date de paiement n'est pas valide.");
    return false;
  }

  if (selectedReservation) {
    const montantRestant = selectedReservation.montantRestant || 0;
    
    if (formData.typePaiement === 'remboursement') {
      const montantPaye = selectedReservation.montantPaye || 0;
      if (montantFloat > montantPaye) {
        setError(`Le remboursement ne peut pas dépasser le montant payé (${formatAmount(montantPaye)}).`);
        return false;
      }
    } else {
      if (montantRestant > 0) {
        const validationError = validatePaymentAmount(montant, montantRestant);
        if (validationError) {
          setError(validationError);
          return false;
        }
      } else if (montantRestant === 0) {
        setError("Cette réservation est déjà entièrement payée. Utilisez 'Remboursement' si nécessaire.");
        return false;
      }
    }
  }

  setError(null);
  return true;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  
  const payload = {
    montant: Math.round(parseFloat(formData.montant) * 100) / 100,
    methodePaiement: formData.methodePaiement.trim(),
    
    datePaiement: formData.datePaiement ? formData.datePaiement + ':00' : null,
    typePaiement: formData.typePaiement || 'solde',
    reservation: formData.reservation
  };

  
  if (formData.numeroTransaction && formData.numeroTransaction.trim()) {
    payload.numeroTransaction = formData.numeroTransaction.trim();
  }
  
  if (formData.commentaire && formData.commentaire.trim()) {
    payload.commentaire = formData.commentaire.trim();
  }

  

  try {
    if (paymentId) {
      await updatePayment(paymentId, payload);
    } else {
      await createPayment(payload);
    }
    navigate('/payments');
  } catch (error) {
    console.error(' Erreur lors de la sauvegarde:', error);
    
    if (error.response) {
      console.error(' Status:', error.response.status);
      console.error(' Headers:', error.response.headers);
      console.error(' Data:', error.response.data);
      
      if (error.response.data && error.response.data.violations) {
        console.error(' Erreurs de validation:', error.response.data.violations);
        
        const errorMessages = error.response.data.violations.map(violation => 
          `${violation.propertyPath}: ${violation.message}`
        ).join('\n');
        
        setError(`Erreurs de validation:\n${errorMessages}`);
      } else if (error.response.data && error.response.data.message) {
        setError(`Erreur serveur: ${error.response.data.message}`);
      } else if (error.response.data && typeof error.response.data === 'string') {
        setError(`Erreur serveur: ${error.response.data}`);
      } else {
        setError(`Erreur HTTP ${error.response.status}: ${error.response.statusText}`);
      }
    } else if (error.request) {
      console.error(' Pas de réponse du serveur:', error.request);
      setError("Aucune réponse du serveur. Vérifiez votre connexion.");
    } else {
      console.error(' Erreur de configuration:', error.message);
      setError(`Erreur de configuration: ${error.message}`);
    }
  }
};

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>{paymentId ? 'Modifier un paiement' : 'Créer un paiement'}</h2>
      
      <ErrorDisplay 
        error={error}
        onDismiss={() => setError(null)}
        title={paymentId ? "Erreur lors de la modification du paiement" : "Erreur lors de la création du paiement"}
      />


      {selectedReservation && (
        <Card className="mb-4 bg-light">
          <Card.Body>
            <h5>Réservation #{selectedReservation.id}</h5>
            <div className="row">
              <div className="col-md-6">
                <strong>Client :</strong> {selectedReservation.client?.nom} {selectedReservation.client?.prenom}<br />
                <strong>Chambre :</strong> #{selectedReservation.chambre?.numero}<br />
                <strong>Dates :</strong> {new Date(selectedReservation.dateDebut).toLocaleDateString()} au {new Date(selectedReservation.dateFin).toLocaleDateString()}
              </div>
              <div className="col-md-6">
                <strong>Montant total :</strong> {formatAmount(selectedReservation.montantTotal)}<br />
                <strong>Montant payé :</strong> {formatAmount(selectedReservation.montantPaye || 0)}<br />
                <strong>Restant dû :</strong> <span className="text-danger fw-bold">
                  {formatAmount(selectedReservation.montantRestant || selectedReservation.montantTotal)}
                </span><br />
                <strong>Statut :</strong>{' '}
                <span className={`badge bg-${
                  selectedReservation.statutPaiement === 'complet' ? 'success' :
                  selectedReservation.statutPaiement === 'partiel' ? 'warning' : 'danger'
                }`}>
                  {selectedReservation.statutPaiement || 'impaye'}
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
      <Link 
        to='/payments'
        className="btn btn-outline-secondary mb-3"
      >
        ← Retour à la liste des paiements
      </Link>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Réservation <span className="text-danger">*</span></Form.Label>
          <div className="col-sm-8">
            <Form.Select 
              name="reservation" 
              value={formData.reservation} 
              onChange={handleReservationChange} 
              required
            >
              <option value="">-- Sélectionner une réservation --</option>
              {reservations.map(r => (
                <option key={r.id} value={`/api/reservations/${r.id}`}>
                  Résa #{r.id} - {r.client?.nom} {r.client?.prenom} 
                  
                  
                </option>
              ))}
            </Form.Select>
            {reservations.length === 0 && (
              <Form.Text className="text-muted">
                Aucune réservation disponible.
              </Form.Text>
            )}
            
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Type de paiement</Form.Label>
          <div className="col-sm-8">
            <Form.Select name="typePaiement" value={formData.typePaiement} onChange={handleChange}>
              <option value="acompte">Acompte</option>
              <option value="solde">Solde</option>
              <option value="remboursement">Remboursement</option>
            </Form.Select>
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Montant (€) <span className="text-danger">*</span></Form.Label>
          <div className="col-sm-8">
            <Form.Control 
              type="text" 
               
              name="montant" 
              value={formData.montant} 
              onChange={handleChange} 
              required 
              min="0"
            />
            {selectedReservation && (
              <Form.Text className="text-muted">
                Montant restant à payer : {formatAmount(selectedReservation.montantRestant || selectedReservation.montantTotal)}
              </Form.Text>
            )}
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Méthode de paiement <span className="text-danger">*</span></Form.Label>
          <div className="col-sm-8">
            <Form.Select name="methodePaiement" value={formData.methodePaiement} onChange={handleChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="especes">Espèces</option>
              <option value="carte_bancaire">Carte bancaire</option>
              <option value="virement ">Virement bancaire</option>
              <option value="cheque">Chèque</option>
              <option value="stripe">Paiement en ligne</option>
              <option value="payPal">PayPal</option>
            </Form.Select>
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Date de paiement <span className="text-danger">*</span></Form.Label>
          <div className="col-sm-8">
            <Form.Control 
              type="datetime-local" 
              name="datePaiement" 
              value={formData.datePaiement} 
              onChange={handleChange} 
              required 
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Numéro de transaction</Form.Label>
          <div className="col-sm-8">
            <Form.Control 
              type="text" 
              name="numeroTransaction" 
              value={formData.numeroTransaction} 
              onChange={handleChange} 
              placeholder="Référence bancaire, numéro de chèque..." 
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label className="col-sm-4 col-form-label">Commentaire</Form.Label>
          <div className="col-sm-8">
            <Form.Control 
              as="textarea" 
              name="commentaire" 
              rows={3} 
              value={formData.commentaire} 
              onChange={handleChange} 
              placeholder="Notes sur ce paiement..." 
            />
          </div>
        </Form.Group>

        <div className="text-end">
          <Button variant="secondary" className="me-2" onClick={() => navigate('/payments')}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {paymentId ? 'Mettre à jour' : 'Enregistrer le paiement'}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default PaymentForm;