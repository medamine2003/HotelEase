// un composant d'un affichage des réservations dans une table
// a component that is used in the display of rservations in a table 
import { useEffect, useState, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Pagination from 'react-bootstrap/Pagination';
import { useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiBell, FiCreditCard } from 'react-icons/fi';
import { getReservations, deleteReservation } from '../../services/reservationServices';
import ReservationServices from '../../components/CommonComponents/ReservationServices';
import Modal from 'react-bootstrap/Modal';
import ErrorDisplay from '../CommonComponents/ErrorDisplay';
import { PageHeader, HotelTable, LoadingSpinner, HotelModal } from '../../layout';


function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState(null);

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [statutPaiementFilter, setStatutPaiementFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Fonction pour charger les réservations
  const fetchReservations = useCallback(async () => {
    try {
      setError(null);
      const data = await getReservations();
      
      // Validation des données reçues
      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide reçu du serveur');
      }
      
      // Validation de chaque réservation
      const validatedReservations = data.filter(reservation => {
        return reservation && 
               typeof reservation === 'object' && 
               reservation.id && 
               reservation.dateDebut && 
               reservation.dateFin;
      });
      
      setReservations(validatedReservations);
    } catch {
      setError("Erreur lors de la récupération des réservations. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Filtrage des réservations avec useMemo pour optimiser les performances
  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    // Filtre par recherche (ID, client, chambre)
    if (searchTerm) {
      filtered = filtered.filter(reservation => 
        reservation.id?.toString().includes(searchTerm) ||
        reservation.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.chambre?.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${reservation.client?.nom} ${reservation.client?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statutFilter) {
      filtered = filtered.filter(reservation => reservation.statut === statutFilter);
    }

    // Filtre par statut de paiement
    if (statutPaiementFilter) {
      filtered = filtered.filter(reservation => 
        (reservation.statutPaiement || 'impaye') === statutPaiementFilter
      );
    }

    // Filtre par date (réservations du mois sélectionné)
    if (dateFilter) {
      const [year, month] = dateFilter.split('-');
      filtered = filtered.filter(reservation => {
        const startDate = new Date(reservation.dateDebut);
        return startDate.getFullYear() === parseInt(year) && 
               startDate.getMonth() === parseInt(month) - 1;
      });
    }

    return filtered;
  }, [reservations, searchTerm, statutFilter, statutPaiementFilter, dateFilter]);

  // Calcul de la pagination
  const paginationData = useMemo(() => {
    const totalItems = filteredReservations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredReservations.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [filteredReservations, currentPage, itemsPerPage]);

  // Statistiques des réservations
  const stats = useMemo(() => {
    return {
      total: filteredReservations.length,
      confirmees: filteredReservations.filter(r => r.statut === 'confirmee').length,
      enCours: filteredReservations.filter(r => r.statut === 'en_cours').length,
      impayees: filteredReservations.filter(r => (r.statutPaiement || 'impaye') === 'impaye').length
    };
  }, [filteredReservations]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statutFilter, statutPaiementFilter, dateFilter]);

  const handleDeleteClick = (reservation) => {
    // Validation avant suppression
    if (!reservation || !reservation.id) {
      setDeleteError("Impossible de supprimer cette réservation : données invalides.");
      return;
    }
    
    setDeleteError(null);
    setReservationToDelete(reservation);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!reservationToDelete?.id) {
      setDeleteError("Impossible de supprimer cette réservation : ID manquant.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    
    try {
      await deleteReservation(reservationToDelete.id);
      setReservations((prev) => prev.filter((r) => r.id !== reservationToDelete.id));
      setShowConfirmModal(false);
      setReservationToDelete(null);
      
      // Ajuster la page si nécessaire après suppression
      const newTotalPages = Math.ceil((filteredReservations.length - 1) / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch {
      setDeleteError('Une erreur est survenue pendant la suppression. Veuillez réessayer.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setReservationToDelete(null);
    setDeleteError(null);
  };

  const handleEdit = (id) => {
    if (!id) {
      setError("Impossible de modifier cette réservation : ID manquant.");
      return;
    }
    navigate(`/reservations/${id}`);
  };

  const handleAddPayment = (reservationId) => {
    if (!reservationId) {
      setError("Impossible d'ajouter un paiement : ID de réservation manquant.");
      return;
    }
    navigate(`/payments/nouveau?reservation=${reservationId}`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatutFilter('');
    setStatutPaiementFilter('');
    setDateFilter('');
    setCurrentPage(1);
  };
  const handleServicesClick = (reservationId) => {
  setSelectedReservationId(reservationId);
  setShowServicesModal(true);
};
  const formatAmount = (amount) => {
    if (!amount) return '0€';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatutBadge = (statut) => {
    const variants = {
      'en_attente': 'warning',
      'confirmee': 'success',
      'en_cours': 'primary',
      'terminee': 'secondary',
      'annulee': 'danger'
    };
    
    const labels = {
      'en_attente': 'En attente',
      'confirmee': 'Confirmée',
      'en_cours': 'En cours',
      'terminee': 'Terminée',
      'annulee': 'Annulée'
    };

    return (
      <Badge bg={variants[statut] || 'secondary'} aria-label={`Statut: ${labels[statut] || statut}`}>
        {labels[statut] || statut}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (statutPaiement) => {
    const variants = {
      'impaye': 'danger',
      'partiel': 'warning',
      'complet': 'success'
    };

    const labels = {
      'impaye': 'Impayé',
      'partiel': 'Partiel',
      'complet': 'Complet'
    };

    return (
      <Badge bg={variants[statutPaiement] || 'secondary'} aria-label={`Paiement: ${labels[statutPaiement] || statutPaiement}`}>
        {labels[statutPaiement] || statutPaiement}
      </Badge>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des réservations" />;
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert" aria-live="assertive">
          <ErrorDisplay 
            error={deleteError}
            onDismiss={() => setError(null)}
            title="Erreur de chargement"
          />
          <div className="mt-3">
            <Button variant="outline-danger" onClick={fetchReservations}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <PageHeader title="Gestion des Réservations">
        <Button 
          className="btn-hotel-primary"
          onClick={() => navigate('/reservations/create')}
          aria-label="Créer une nouvelle réservation"
        >
          + Nouvelle réservation
        </Button>
      </PageHeader>

      {/* Statistiques */}
      <section aria-labelledby="stats-title" className="mb-4">
        <h2 id="stats-title" className="visually-hidden">Statistiques des réservations</h2>
        <div className="row">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-primary">{stats.total}</h3>
                <p className="card-text">Total</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-success">{stats.confirmees}</h3>
                <p className="card-text">Confirmées</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-info">{stats.enCours}</h3>
                <p className="card-text">En cours</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-warning">{stats.impayees}</h3>
                <p className="card-text">Impayées</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section des filtres */}
      <section aria-labelledby="filters-title">
        <h2 id="filters-title" className="visually-hidden">Filtres de recherche</h2>
        <div className="row mb-4">
          <div className="col-md-3">
            <InputGroup>
              <InputGroup.Text aria-hidden="true">🔍</InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Rechercher par ID, client, chambre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Rechercher des réservations par ID, nom de client ou numéro de chambre"
              />
            </InputGroup>
          </div>
          <div className="col-md-2">
            <Form.Select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              aria-label="Filtrer par statut de réservation"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirmee">Confirmée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Form.Select
              value={statutPaiementFilter}
              onChange={(e) => setStatutPaiementFilter(e.target.value)}
              aria-label="Filtrer par statut de paiement"
            >
              <option value="">Tous les paiements</option>
              <option value="impaye">Impayé</option>
              <option value="partiel">Partiel</option>
              <option value="complet">Complet</option>
            </Form.Select>
          </div>
          <div className="col-md-3">
            <Form.Control
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filtrer par mois de réservation"
            />
          </div>
          <div className="col-md-2">
            <Button 
              variant="outline-secondary" 
              onClick={resetFilters}
              aria-label="Réinitialiser tous les filtres"
            >
              🔄 Reset
            </Button>
          </div>
        </div>
      </section>

      {/* Informations sur les résultats */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div aria-live="polite" role="status">
          {paginationData.totalItems === 0 ? (
            <span className="text-muted">Aucune réservation trouvée</span>
          ) : (
            <span className="text-muted">
              Affichage de {paginationData.startIndex + 1} à {paginationData.endIndex} sur {paginationData.totalItems} réservations
            </span>
          )}
        </div>
      </div>

      {paginationData.totalItems === 0 ? (
        <div className="alert alert-info" role="status">
          {reservations.length === 0 
            ? 'Aucune réservation enregistrée.' 
            : 'Aucune réservation trouvée avec ces filtres.'
          }
        </div>
      ) : (
        <HotelTable aria-label="Liste des réservations">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Date de début</th>
              <th scope="col">Date de fin</th>
              <th scope="col">Client</th>
              <th scope="col">Chambre</th>
              <th scope="col">Montant</th>
              <th scope="col">Payé</th>
              <th scope="col">Statut</th>
              <th scope="col">Paiement</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginationData.currentItems.map((reservation) => (
              <tr key={reservation.id}>
                <td><span className="text-hotel-primary fw-bold">#{reservation.id}</span></td>
                <td>{new Date(reservation.dateDebut).toLocaleDateString('fr-FR')}</td>
                <td>{new Date(reservation.dateFin).toLocaleDateString('fr-FR')}</td>
                <td className="fw-medium">
                  {reservation.client?.nom} {reservation.client?.prenom || ''}
                </td>
                <td><span className="text-hotel-primary">#{reservation.chambre?.numero || '—'}</span></td>
                <td className="text-end fw-bold">{formatAmount(reservation.montantTotal)}</td>
                <td className="text-end">
                  <span className="fw-bold">{formatAmount(reservation.montantPaye || 0)}</span>
                  {(reservation.montantRestant || 0) > 0 && (
                    <small className="text-hotel-secondary d-block">
                      Restant: {formatAmount(reservation.montantRestant)}
                    </small>
                  )}
                </td>
                <td>{getStatutBadge(reservation.statut)}</td>
                <td>{getPaymentStatusBadge(reservation.statutPaiement || 'impaye')}</td>
                <td>
                  <div className="btn-group btn-group-sm" role="group" aria-label={`Actions pour la réservation ${reservation.id}`}>
                    <Button
                      variant="outline-primary"
                      onClick={() => handleEdit(reservation.id)}
                      aria-label={`Modifier la réservation ${reservation.id}`}
                      title="Modifier réservation"
                      disabled={!reservation.id}
                    >
                      <span aria-hidden="true"><FiEdit /></span>
                      <span className="visually-hidden">Modifier</span>
                    </Button>
                    
                    {(reservation.statutPaiement || 'impaye') !== 'complet' && (
                      <Button
                        variant="outline-success"
                        onClick={() => handleAddPayment(reservation.id)}
                        aria-label={`Enregistrer un paiement pour la réservation ${reservation.id}`}
                        title="Enregistrer un paiement"
                        disabled={!reservation.id}
                      >
                        <span aria-hidden="true"><FiCreditCard /></span>
                        <span className="visually-hidden">Paiement</span>
                      </Button>
                    )}
                    
                      <Button
                        variant="outline-info"
                        onClick={() => handleServicesClick(reservation.id)}
                        aria-label={`Gérer les services pour la réservation ${reservation.id}`}
                        title="Gérer les services"
                        disabled={!reservation.id}
                      >
                        <span aria-hidden="true"><FiBell /></span>
                        <span className="visually-hidden">Services</span>
                      </Button>

                    <Button
                      variant="outline-danger"
                      onClick={() => handleDeleteClick(reservation)}
                      aria-label={`Supprimer la réservation ${reservation.id}`}
                      title="Supprimer réservation"
                      disabled={!reservation.id}
                    >
                      <span aria-hidden="true"><FiTrash2 /></span>
                      <span className="visually-hidden">Supprimer</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </HotelTable>
      )}

      {/* Pagination */}
      {paginationData.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination aria-label="Navigation des pages">
            <Pagination.First 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label="Aller à la première page"
            />
            <Pagination.Prev 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              aria-label="Page précédente"
            />
            
            {/* Pages numérotées */}
            {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, index) => {
              let pageNumber;
              if (paginationData.totalPages <= 5) {
                pageNumber = index + 1;
              } else if (currentPage <= 3) {
                pageNumber = index + 1;
              } else if (currentPage >= paginationData.totalPages - 2) {
                pageNumber = paginationData.totalPages - 4 + index;
              } else {
                pageNumber = currentPage - 2 + index;
              }
              
              return (
                <Pagination.Item
                  key={pageNumber}
                  active={pageNumber === currentPage}
                  onClick={() => setCurrentPage(pageNumber)}
                  aria-label={`Aller à la page ${pageNumber}`}
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                >
                  {pageNumber}
                </Pagination.Item>
              );
            })}
            
            <Pagination.Next 
              onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
              disabled={currentPage === paginationData.totalPages}
              aria-label="Page suivante"
            />
            <Pagination.Last 
              onClick={() => setCurrentPage(paginationData.totalPages)}
              disabled={currentPage === paginationData.totalPages}
              aria-label="Aller à la dernière page"
            />
          </Pagination>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <HotelModal 
        show={showConfirmModal} 
        onHide={handleCancelDelete} 
        centered
        title="Confirmer la suppression"
        aria-describedby="delete-modal-description"
      >
        <HotelModal.Body>
          <ErrorDisplay 
            error={deleteError}
            onDismiss={() => setError(null)}
            title="Erreur de suprresion"
          />
          
          {reservationToDelete && (
            <div id="delete-modal-description">
              <p>Voulez-vous vraiment supprimer cette réservation ?</p>
              <div className="card-hotel p-3">
                <strong className="text-hotel-primary">Détails :</strong>
                <dl className="row mt-2 mb-0">
                  <dt className="col-sm-3">ID :</dt>
                  <dd className="col-sm-9 text-hotel-primary fw-bold">#{reservationToDelete.id}</dd>
                  
                  <dt className="col-sm-3">Client :</dt>
                  <dd className="col-sm-9">{reservationToDelete.client?.nom} {reservationToDelete.client?.prenom}</dd>
                  
                  <dt className="col-sm-3">Dates :</dt>
                  <dd className="col-sm-9">
                    {new Date(reservationToDelete.dateDebut).toLocaleDateString('fr-FR')} au {' '}
                    {new Date(reservationToDelete.dateFin).toLocaleDateString('fr-FR')}
                  </dd>
                  
                  <dt className="col-sm-3">Montant :</dt>
                  <dd className="col-sm-9 fw-bold">{formatAmount(reservationToDelete.montantTotal)}</dd>
                  
                  {(reservationToDelete.montantPaye || 0) > 0 && (
                    <>
                      <dt className="col-sm-3">
                        <span className="text-warning" aria-label="Attention">⚠️</span> Paiements :
                      </dt>
                      <dd className="col-sm-9 fw-bold text-success">{formatAmount(reservationToDelete.montantPaye)}</dd>
                    </>
                  )}
                </dl>
              </div>
              <small className="text-hotel-secondary d-block mt-2">
                <strong>Attention :</strong> Cette action est irréversible.
              </small>
            </div>
          )}
        </HotelModal.Body>
        <HotelModal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleCancelDelete}
            disabled={deleting}
            aria-label="Annuler la suppression"
          >
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            disabled={deleting || !reservationToDelete?.id}
            aria-label="Confirmer la suppression de la réservation"
          >
            {deleting ? (
              <>
                <span 
                  className="spinner-border spinner-border-sm me-2" 
                  role="status" 
                  aria-label="Suppression en cours"
                  aria-hidden="true"
                ></span>
                <span aria-live="polite">Suppression...</span>
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </HotelModal.Footer>
      </HotelModal>
      {/* Modal pour les services */}
<Modal show={showServicesModal} onHide={() => setShowServicesModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Services - Réservation #{selectedReservationId}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedReservationId && (
      <ReservationServices reservationId={selectedReservationId}
       onServicesUpdated={fetchReservations}  />
    )}
  </Modal.Body>
</Modal>
    </div>
  );
}

export default ReservationList;