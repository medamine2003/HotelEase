// Composant de création et modification des réservations - Version responsive
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {
  createReservation,
  updateReservation,
  getReservationById
} from '../../services/reservationServices';
import { getCustomers } from '../../services/customerServices';
import { getRooms } from '../../services/roomServices';
import { getUsers } from '../../services/userServices';
import { getCurrentUser } from '../../services/authServices';
import ErrorDisplay from '../CommonComponents/ErrorDisplay';

function ReservationForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  // État initial avec des valeurs par défaut pour éviter undefined
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    statut: '',
    montantBase: '',
    client: '',
    chambre: '',
    createur: ''
  });

  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [currentUserName, setCurrentUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Charger les données de base
        const [clientsData, chambresData, utilisateursData] = await Promise.all([
          getCustomers(),
          getRooms(), 
          getUsers()
        ]);
        
        setClients(clientsData || []);
        setChambres(chambresData || []);
        setUtilisateurs(utilisateursData || []);

        // Charger l'utilisateur courant
        const currentUser = await getCurrentUser();
        const userDisplayName = `${currentUser.nom || ''} ${currentUser.prenom || ''} (${currentUser.email || ''})`;
        const userApiPath = `/api/utilisateurs/${currentUser.id}`;
        
        setCurrentUserName(userDisplayName);

        // Si mode édition, charger la réservation
        if (id) {
          const reservationData = await getReservationById(id);
          
          // Fonction helper pour formater les dates
          const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) return '';
              // Format pour datetime-local: YYYY-MM-DDTHH:MM
              return date.toISOString().slice(0, 16);
            } catch {
              return '';
            }
          };

          // Fonction helper pour formater le montant
          const formatMontantForInput = (montant) => {
            if (montant === null || montant === undefined) {
              console.warn('Montant null ou undefined:', montant);
              return '';
            }
            if (typeof montant === 'string' && montant.trim() === '') {
              console.warn('Montant string vide:', montant);
              return '';
            }
            const numericValue = Number(montant);
            if (isNaN(numericValue)) {
              console.warn('Montant non numérique:', montant);
              return '';
            }
            return String(numericValue);
          };

          const formattedData = {
            dateDebut: formatDateForInput(reservationData.dateDebut),
            dateFin: formatDateForInput(reservationData.dateFin),
            statut: reservationData.statut || '',
            montantBase: formatMontantForInput(reservationData.montantBase),
            client: (reservationData.client && reservationData.client['@id']) || '',
            chambre: (reservationData.chambre && reservationData.chambre['@id']) || '',
            createur: (reservationData.createur && reservationData.createur['@id']) || userApiPath
          };

          setFormData(formattedData);
        } else {
          // Mode création : définir seulement le créateur
          setFormData(prev => ({
            ...prev,
            createur: userApiPath
          }));
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des données.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const validateForm = () => {
    const { dateDebut, dateFin, statut, montantBase, client, chambre, createur } = formData;

    // Vérification des champs obligatoires
    if (!dateDebut || !dateFin || !statut || !montantBase || !client || !chambre || !createur) {
      setError("Tous les champs sont obligatoires.");
      return false;
    }

    // Validation du montant
    const montant = parseFloat(montantBase);
    if (isNaN(montant)) {
      setError("Le montant de base de la réservation doit être un nombre valide.");
      return false;
    }
    if (montant < 0) {
      setError("Le montant de base de la réservation ne peut pas être négatif.");
      return false;
    }
    if (montant === 0) {
      setError("Le montant de base de la réservation doit être supérieur à 0.");
      return false;
    }

    // Validation des dates
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const maintenant = new Date();

    if (debut >= fin) {
      setError("La date de départ doit être postérieure à la date d'arrivée.");
      return false;
    }

    // Vérifier que les dates ne sont pas dans le passé (sauf en modification)
    if (!id && debut < maintenant) {
      setError("La date d'arrivée ne peut pas être dans le passé.");
      return false;
    }

    // Vérifier que la réservation n'est pas trop courte (minimum 1 jour)
    const dureeMs = fin - debut;
    const dureeJours = dureeMs / (1000 * 60 * 60 * 24);
    if (dureeJours < 1) {
      setError("La durée de la réservation doit être d'au moins 1 jour.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        statut: formData.statut,
        montantBase: parseFloat(formData.montantBase).toFixed(2),
        client: formData.client,
        chambre: formData.chambre,    
        createur: formData.createur   
      };

      if (id) {
        await updateReservation(id, payload);
      } else {
        await createReservation(payload);
      }
      navigate('/reservations');
    } catch (error) {
      console.error('Erreur complète:', error.response);
      setError(`Erreur lors de l'enregistrement: ${error.response?.data?.message || error.message}`);
    }
  };

  // Fonction helper pour mettre à jour le formData de manière sûre
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || ''
    }));
  };

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="container-fluid px-3 mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 mt-4">
      <Row>
        <Col xs={12} lg={8} xl={6} className="mx-auto">
          <h1 className="h2 mb-4">{id ? 'Modifier une réservation' : 'Créer une réservation'}</h1>
          
          <ErrorDisplay 
            error={error}
            onDismiss={() => setError(null)}
            title={id? "Erreur lors de la modification de la réservation" : "Erreur lors de la création de la réservation"}
          />
          
          <Link 
            to='/reservations'
            className="btn btn-outline-secondary mb-3 btn-sm"
          >
            ← Retour à la liste
          </Link>

          <Form onSubmit={handleSubmit}>
            {/* Dates sur une ligne sur desktop, séparées sur mobile */}
            <Row className="mb-3">
              <Col xs={12} md={6} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label htmlFor="dateDebut">Date de début *</Form.Label>
                  <Form.Control
                    id="dateDebut"
                    type="datetime-local"
                    value={formData.dateDebut || ''}
                    onChange={(e) => updateFormData('dateDebut', e.target.value)}
                    required
                    className="w-100"
                    style={{ minWidth: '0' }} // Important pour éviter les débordements
                  />
                  <Form.Text className="text-muted small">
                    Date et heure d'arrivée
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label htmlFor="dateFin">Date de fin *</Form.Label>
                  <Form.Control
                    id="dateFin"
                    type="datetime-local"
                    value={formData.dateFin || ''}
                    onChange={(e) => updateFormData('dateFin', e.target.value)}
                    required
                    className="w-100"
                    style={{ minWidth: '0' }}
                  />
                  <Form.Text className="text-muted small">
                    Date et heure de départ
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Statut et Montant sur une ligne sur desktop */}
            <Row className="mb-3">
              <Col xs={12} md={6} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label htmlFor="statut">Statut *</Form.Label>
                  <Form.Select
                    id="statut"
                    value={formData.statut || ''}
                    onChange={(e) => updateFormData('statut', e.target.value)}
                    required
                    className="w-100"
                    style={{ minWidth: '0' }}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="en_attente">En attente</option>
                    <option value="confirmee">Confirmée</option>
                    <option value="en_cours">En cours</option>
                    <option value="terminee">Terminée</option>
                    <option value="annulee">Annulée</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label htmlFor="montantBase">Montant (€) *</Form.Label>
                  <Form.Control
                    id="montantBase"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.montantBase || ''}
                    onChange={(e) => updateFormData('montantBase', e.target.value)}
                    onInvalid={(e) => e.target.setCustomValidity('Le montant doit être supérieur ou égal à 0,01 €')}
                    onInput={(e) => e.target.setCustomValidity('')}
                    required
                    className="w-100"
                    style={{ minWidth: '0' }}
                  />
                  <Form.Text className="text-muted small">
                    Minimum : 0,01 €
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Client et Chambre */}
            <Form.Group className="mb-3">
              <Form.Label htmlFor="client">Client *</Form.Label>
              <Form.Select
                id="client"
                value={formData.client || ''}
                onChange={(e) => updateFormData('client', e.target.value)}
                required
                className="w-100"
                style={{ minWidth: '0' }}
              >
                <option value="">-- Sélectionner un client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={`/api/clients/${c.id}`}>
                    {c.nom} {c.prenom}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="chambre">Chambre *</Form.Label>
              <Form.Select
                id="chambre"
                value={formData.chambre || ''}
                onChange={(e) => updateFormData('chambre', e.target.value)}
                required
                className="w-100"
                style={{ minWidth: '0' }}
              >
                <option value="">-- Sélectionner une chambre --</option>
                {chambres.filter(c => c.etat === 'disponible')
                .map((c) => (
                  <option key={c.id} value={`/api/chambres/${c.id}`}>
                    #{c.numero} - {c.type} ({c.capacite}p)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="createur">Créateur</Form.Label>
              <Form.Control
                id="createur"
                type="text"
                value={currentUserName || 'Chargement...'}
                disabled
                className="bg-light w-100"
                style={{ 
                  minWidth: '0',
                  fontSize: '0.9rem' // Texte plus petit pour éviter les débordements
                }}
              />
              <Form.Text className="text-muted small">
                Utilisateur connecté (automatique)
              </Form.Text>
              <input type="hidden" name="createur" value={formData.createur || ''} />
            </Form.Group>

            <div className="mb-4">
              <Form.Text className="text-muted small">
                <strong>* Champs obligatoires</strong> • Durée minimum : 1 jour
              </Form.Text>
            </div>

            {/* Boutons responsive */}
            <div className="d-flex flex-column flex-sm-row gap-2 mb-4">
              <Button variant="primary" type="submit" className="flex-grow-1">
                {id ? 'Mettre à jour' : 'Créer'}
              </Button>
              
              {id && (
                <Link 
                  to={`/payments/nouveau?reservation=${id}`}
                  className="btn btn-success flex-grow-1 text-center"
                  aria-label="Ajouter un paiement pour cette réservation"
                >
                  💳 Ajouter paiement
                </Link>
              )}
            </div>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default ReservationForm;