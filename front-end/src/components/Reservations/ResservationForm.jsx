import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
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
  const [isLoading, setIsLoading] = useState(true); // Ajout d'un état de chargement

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
          
          // DEBUG: Afficher les données récupérées
        
          
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
  client: formData.client,      // Garder l'IRI tel quel : "/api/clients/1"
  chambre: formData.chambre,    // Garder l'IRI tel quel : "/api/chambres/1"
  createur: formData.createur   // Garder l'IRI tel quel : "/api/utilisateurs/1"
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
      [field]: value || '' // S'assurer qu'on ne passe jamais undefined
    }));
  };

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="h2">{id ? 'Modifier une réservation' : 'Créer une réservation'}</h1>
      
      <ErrorDisplay 
        error={error}
        onDismiss={() => setError(null)}
        title={id? "Erreur lors de la modification de la réservation" : "Erreur lors de la création de la réservation"}
      />
      
      <Link 
        to='/reservations'
        className="btn btn-outline-secondary mb-3"
      >
        ← Retour à la liste des réservations
      </Link>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="dateDebut">Date de début *</Form.Label>
          <Form.Control
            id="dateDebut"
            type="datetime-local"
            value={formData.dateDebut || ''} // Protection contre undefined
            onChange={(e) => updateFormData('dateDebut', e.target.value)}
            required
          />
          <Form.Text className="text-muted">
            Date et heure d'arrivée
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label htmlFor="dateFin">Date de fin *</Form.Label>
          <Form.Control
            id="dateFin"
            type="datetime-local"
            value={formData.dateFin || ''} // Protection contre undefined
            onChange={(e) => updateFormData('dateFin', e.target.value)}
            required
          />
          <Form.Text className="text-muted">
            Date et heure de départ (doit être après l'arrivée)
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label htmlFor="statut">Statut *</Form.Label>
          <Form.Select
            id="statut"
            value={formData.statut || ''} // Protection contre undefined
            onChange={(e) => updateFormData('statut', e.target.value)}
            required
          >
            <option value="">-- Sélectionner un statut --</option>
            <option value="en_attente">En attente de confirmation</option>
            <option value="confirmee">Confirmée</option>
            <option value="en_cours">En cours (client présent)</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </Form.Select> 
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label htmlFor="montantBase">Montant Chambre(€) *</Form.Label>
          <Form.Control
            id="montantBase"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.montantBase || ''} // Protection contre undefined
            onChange={(e) => updateFormData('montantBase', e.target.value)}
            onInvalid={(e) => e.target.setCustomValidity('Le montant doit être supérieur ou égal à 0,01 €')}
            onInput={(e) => e.target.setCustomValidity('')}
            required
          />
          <Form.Text className="text-muted">
            Montant minimum : 0,01 €
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label htmlFor="client">Client *</Form.Label>
          <Form.Select
            id="client"
            value={formData.client || ''} // Protection contre undefined
            onChange={(e) => updateFormData('client', e.target.value)}
            required
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
            value={formData.chambre || ''} // Protection contre undefined
            onChange={(e) => updateFormData('chambre', e.target.value)}
            required
          >
            <option value="">-- Sélectionner une chambre --</option>
            {chambres.filter(c => c.etat === 'disponible')
            .map((c) => (
              <option key={c.id} value={`/api/chambres/${c.id}`}>
                Chambre #{c.numero} - {c.type} ({c.capacite} pers)
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
            className="bg-light"
          />
          <Form.Text className="text-muted">
            Utilisateur connecté (automatique)
          </Form.Text>
          <input type="hidden" name="createur" value={formData.createur || ''} />
        </Form.Group>

        <div className="mb-3">
          <Form.Text className="text-muted">
            <strong>* Champs obligatoires</strong> • Durée minimum : 1 jour
          </Form.Text>
        </div>

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit">
            {id ? 'Mettre à jour' : 'Créer'}
          </Button>
          
          {id && (
            <Link 
              to={`/payments/nouveau?reservation=${id}`}
              className="btn btn-success"
              aria-label="Ajouter un paiement pour cette réservation"
            >
              💳 Ajouter un paiement
            </Link>
          )}
        </div>
      </Form>
    </div>
  );
}

export default ReservationForm;