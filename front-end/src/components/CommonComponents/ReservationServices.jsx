import { useEffect, useState, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import { 
  addServiceToReservation, 
  removeServiceFromReservation, 
  getAvailableServices,
  getReservationWithServices 
} from '../../services/ServicesResaServices';

/**
 * Composant pour gérer les services d'une réservation
 * @param {number} reservationId - ID de la réservation
 * @param {function} onTotalChange - Callback appelé quand le total des services change
 */
function ReservationServices({ reservationId, onTotalChange,onServicesUpdated }) {
  const [reservationServices, setReservationServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  // Charger les services disponibles
  const fetchAvailableServices = useCallback(async () => {
    try {
      const services = await getAvailableServices();
      setAvailableServices(services);
    } catch (err) {
      setError('Impossible de charger les services disponibles');
      console.error('Erreur fetchAvailableServices:', err);
    }
  }, []);

  // Charger les services de la réservation
  const fetchReservationServices = useCallback(async () => {
    if (!reservationId) return;
    
    try {
      setLoading(true);
      const reservation = await getReservationWithServices(reservationId);
      const services = reservation.reservationServices || [];
      
      // Mapper les services avec leurs détails
      const servicesWithDetails = services.map(rs => ({
        id: rs.id,
        service: rs.service,
        reservationServiceId: rs.id,
        quantite: rs.quantite || 1,
        prixUnitaire: rs.prixUnitaire || rs.service.prixService,
        sousTotal: rs.sousTotal || (rs.quantite || 1) * (rs.prixUnitaire || rs.service.prixService)
      }));
      
      setReservationServices(servicesWithDetails);
      
      // Calculer le total et notifier le parent
      const total = servicesWithDetails.reduce((sum, rs) => 
        sum + (parseFloat(rs.sousTotal) || 0), 0
      );
      
      if (onTotalChange) {
        onTotalChange(total);
      }
      
    } catch (err) {
      setError('Impossible de charger les services de la réservation');
      console.error('Erreur fetchReservationServices:', err);
    } finally {
      setLoading(false);
    }
  }, [reservationId, onTotalChange]);

  // Charger les données au montage
  useEffect(() => {
    fetchAvailableServices();
    fetchReservationServices();
  }, [fetchAvailableServices, fetchReservationServices]);

  // Fonction pour obtenir le service sélectionné
  const getSelectedService = () => {
    return availableServices.find(s => s.id === parseInt(selectedServiceId));
  };

  // Fonction pour calculer le prix du service sélectionné
  const getSelectedServicePrice = () => {
    const service = getSelectedService();
    return service?.prixService || 0;
  };

  // Fonction pour calculer le sous-total de l'ajout
  const getAddSubTotal = () => {
    return getSelectedServicePrice() * quantity;
  };

  // Ajouter un service à la réservation
  const handleAddService = async () => {
    if (!selectedServiceId || adding) return;

    // Vérifier si le service n'est pas déjà ajouté
    const serviceAlreadyAdded = reservationServices.some(rs => 
      rs.service.id === parseInt(selectedServiceId)
    );
    
    if (serviceAlreadyAdded) {
      setError('Ce service est déjà ajouté à la réservation');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const result = await addServiceToReservation(
        reservationId, 
        parseInt(selectedServiceId), 
        quantity
      );

      if (result.success) {
        // Recharger les services de la réservation
        await fetchReservationServices();
        setSelectedServiceId('');
        setQuantity(1);
        onServicesUpdated?.();
      } else {
        throw new Error(result.error || 'Erreur lors de l\'ajout du service');
      }
      
    } catch (err) {
      setError(err.message || 'Impossible d\'ajouter le service');
      console.error('Erreur handleAddService:', err);
    } finally {
      setAdding(false);
    }
  };

  // Supprimer un service de la réservation
  // Supprimer un service de la réservation
const handleRemoveService = async (reservationServiceId) => {
  if (!confirm('Voulez-vous vraiment supprimer ce service ?')) return;

  try {
    //  Suppression directe sans vérifier result.success
    await removeServiceFromReservation(reservationId, reservationServiceId);
    
    
    
    // 🎯 RECHARGER les services après suppression
    await fetchReservationServices();
    onServicesUpdated?.();
    
  } catch (err) {
    setError('Impossible de supprimer le service');
    console.error('Erreur handleRemoveService:', err);
  }
};

  // Calculer le total des services
  const totalServices = reservationServices.reduce((sum, rs) => 
    sum + (parseFloat(rs.sousTotal) || parseFloat(rs.service.prixService) || 0), 0
  );

  // Filtrer les services disponibles (exclure ceux déjà ajoutés)
  const availableServicesFiltered = availableServices.filter(service => 
    !reservationServices.some(rs => rs.service.id === service.id)
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="text-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            Chargement des services...
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Services additionnels</h5>
        {totalServices > 0 && (
          <Badge bg="primary" className="fs-6">
            Total: {formatPrice(totalServices)}
          </Badge>
        )}
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Services ajoutés */}
        {reservationServices.length > 0 ? (
          <div className="mb-4">
            <h6 className="text-primary mb-3">
              <span className="me-2">🛎️</span>
              Services inclus ({reservationServices.length}) :
            </h6>
            {reservationServices.map((rs) => (
              <div 
                key={rs.reservationServiceId} 
                className="d-flex justify-content-between align-items-center p-3 border rounded mb-2 bg-light shadow-sm"
              >
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center">
                    <strong className="text-primary fs-6">{rs.service.nom}</strong>
                    <Badge bg="secondary" className="ms-2">
                      Qté: {rs.quantite}
                    </Badge>
                  </div>
                  <div className="text-muted small mt-1">
                    <span className="me-3">
                      Prix unitaire: <strong>{formatPrice(rs.prixUnitaire)}</strong>
                    </span>
                    <span className="me-3">×</span>
                    <span className="me-3">
                      Quantité: <strong>{rs.quantite}</strong>
                    </span>
                    <span className="me-3">=</span>
                    <span className="text-success">
                      Sous-total: <strong>{formatPrice(rs.sousTotal)}</strong>
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleRemoveService(rs.reservationServiceId)}
                  title={`Supprimer ${rs.service.nom}`}
                  className="ms-3"
                >
                  <span aria-hidden="true">🗑️</span>
                  <span className="visually-hidden">Supprimer</span>
                </Button>
              </div>
            ))}
            
            {/* Récapitulatif total */}
            <div className="border-top pt-3 mt-3">
              <div className="d-flex justify-content-between align-items-center">
                <strong className="text-dark">Total des services :</strong>
                <Badge bg="success" className="fs-6 px-3 py-2">
                  {formatPrice(totalServices)}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted mb-4 py-4">
            <div className="mb-2" style={{ fontSize: '2rem' }}>🛎️</div>
            <em>Aucun service additionnel pour cette réservation.</em>
          </div>
        )}

        {/* Ajouter un service */}
        {availableServicesFiltered.length > 0 ? (
          <div className="border-top pt-4">
            <h6 className="text-success mb-3">
              <span className="me-2">➕</span>
              Ajouter un service :
            </h6>
            <Row className="align-items-end">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small text-muted">Service :</Form.Label>
                  <Form.Select 
                    value={selectedServiceId} 
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    disabled={adding}
                    className="form-select-sm"
                  >
                    <option value="">Choisir un service...</option>
                    {availableServicesFiltered.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.nom} - {formatPrice(service.prixService)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small text-muted">Quantité :</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    disabled={adding || !selectedServiceId}
                    className="form-control-sm text-center"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Button 
                  onClick={handleAddService} 
                  disabled={!selectedServiceId || adding}
                  className="w-100"
                  variant="success"
                  size="sm"
                >
                  {adding ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Ajout...</span>
                      </span>
                      Ajout...
                    </>
                  ) : (
                    selectedServiceId ? (
                      <>
                        ➕ Ajouter
                        <div className="small">
                          {getSelectedService()?.nom}
                        </div>
                        <div className="small text-warning">
                          {formatPrice(getAddSubTotal())}
                        </div>
                      </>
                    ) : (
                      '➕ Ajouter'
                    )
                  )}
                </Button>
              </Col>
            </Row>
            
            {/* Aperçu du service à ajouter */}
            {selectedServiceId && (
              <div className="mt-3 p-3 bg-info bg-opacity-10 border border-info rounded">
                <div className="small text-info">
                  <strong>Aperçu :</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{getSelectedService()?.nom}</strong>
                    <span className="text-muted ms-2">
                      × {quantity}
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="small text-muted">
                      {formatPrice(getSelectedServicePrice())} × {quantity}
                    </div>
                    <strong className="text-success">
                      = {formatPrice(getAddSubTotal())}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          reservationServices.length > 0 && (
            <div className="text-center text-muted pt-4 border-top">
              <div className="mb-2" style={{ fontSize: '1.5rem' }}>✅</div>
              <em>Tous les services disponibles ont été ajoutés.</em>
            </div>
          )
        )}
      </Card.Body>
    </Card>
  );
}

export default ReservationServices;