// un composant d'un affichage des chambres dans une table
// a component that is used in the display of rooms in a table 
import { useEffect, useState, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Pagination from 'react-bootstrap/Pagination';
import { useNavigate } from 'react-router-dom';
import { getRooms, deleteRoom } from '../../services/roomServices';
import SearchBar from '../CommonComponents/SearchBar'; 
import ErrorDisplay from '../CommonComponents/ErrorDisplay';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Configuration des filtres pour le SearchBar
  const roomFilters = useMemo(() => [
    {
      key: 'etat',
      type: 'select',
      label: 'État',
      defaultOption: 'Tous les états',
      options: [
        { value: 'disponible', label: 'Disponible' },
        { value: 'occupee', label: 'Occupée' },
        { value: 'maintenance', label: 'En maintenance' }
      ]
    },
    {
      key: 'type',
      type: 'text',
      label: 'Type',
      placeholder: 'Filtrer par type...'
    }
  ], []);

  // Fonction pour charger les chambres
  const fetchRooms = useCallback(async () => {
    try {
      setError(null);
      const data = await getRooms();
      
      // Validation des données reçues
      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide reçu du serveur');
      }
      
      // Validation de chaque chambre
      const validatedRooms = data.filter(room => {
        return room && 
               typeof room === 'object' && 
               room.id && 
               room.numero && 
               room.type && 
               room.etat;
      });
      
      setRooms(validatedRooms);
    } catch {
      setError("Erreur lors de la récupération des chambres. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Filtrage des chambres avec useMemo pour optimiser les performances
  const filteredRooms = useMemo(() => {
    let filtered = rooms;

    // Filtre par recherche (numéro, type, description)
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par état
    if (filterValues.etat) {
      filtered = filtered.filter(room => room.etat === filterValues.etat);
    }

    // Filtre par type
    if (filterValues.type) {
      filtered = filtered.filter(room => 
        room.type?.toLowerCase().includes(filterValues.type.toLowerCase())
      );
    }

    return filtered;
  }, [rooms, searchTerm, filterValues]);

  // Calcul de la pagination
  const paginationData = useMemo(() => {
    const totalItems = filteredRooms.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredRooms.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [filteredRooms, currentPage, itemsPerPage]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterValues]);

  const handleDeleteClick = (room) => {
    // Validation avant suppression
    if (!room || !room.id) {
      setDeleteError("Impossible de supprimer cette chambre : données invalides.");
      return;
    }
    
    setDeleteError(null);
    setRoomToDelete(room);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete?.id) {
      setDeleteError("Impossible de supprimer cette chambre : ID manquant.");
      return;
    }
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      await deleteRoom(roomToDelete.id);
      setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
      setShowConfirmModal(false);
      setRoomToDelete(null);
      
      // Ajuster la page si nécessaire après suppression
      const newTotalPages = Math.ceil((filteredRooms.length - 1) / itemsPerPage);
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
    setRoomToDelete(null);
    setDeleteError(null);
  };

  const handleEdit = (id) => {
    if (!id) {
      setError("Impossible de modifier cette chambre : ID manquant.");
      return;
    }
    navigate(`/rooms/${id}`);
  };

  

  const getEtatBadge = (etat) => {
    const variants = {
      'disponible': 'success',
      'occupee': 'danger',
      'maintenance': 'warning'
    };
    return (
      <Badge 
        bg={variants[etat] || 'secondary'} 
        aria-label={`État: ${etat}`}
      >
        {etat}
      </Badge>
    );
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status" aria-hidden="true">
            <span className="visually-hidden">Chargement des chambres...</span>
          </div>
          <p className="mt-2">Chargement des chambres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <ErrorDisplay 
        error={error}
        onDismiss={() => setError(null)}
        title="Erreur de chargement"
      />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 id="page-title">Gestion des Chambres</h1>
        
      </div>

     
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Rechercher par numéro, type ou description..."
        filters={roomFilters}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues(prev => ({ ...prev, [key]: value }))}
        onReset={() => { setSearchTerm(''); setFilterValues({}); setCurrentPage(1); }}
      />

      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div aria-live="polite" role="status">
          {paginationData.totalItems === 0 ? (
            <span className="text-muted">Aucune chambre trouvée</span>
          ) : (
            <span className="text-muted">
              Affichage de {paginationData.startIndex + 1} à {paginationData.endIndex} sur {paginationData.totalItems} chambres
            </span>
          )}
        </div>
      </div>

      
      <section aria-labelledby="rooms-table-title">
        <h2 id="rooms-table-title" className="visually-hidden">Liste des chambres</h2>
        <div className="table-responsive">
          {paginationData.totalItems === 0 ? (
            <Alert variant="info" className="text-center my-4" role="status">
              {rooms.length === 0 
                ? 'Aucune chambre enregistrée.' 
                : 'Aucune chambre trouvée avec ces filtres.'
              }
            </Alert>
          ) : (
            <table className="table table-striped table-hover" role="table" aria-labelledby="rooms-table-title">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Numéro</th>
                  <th scope="col">Type</th>
                  <th scope="col">État</th>
                  <th scope="col">Capacité</th>
                  <th scope="col">Prix/nuit</th>
                  <th scope="col">Description</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginationData.currentItems.map(room => (
                  <tr key={room.id}>
                    <td>
                      <strong>{room.numero}</strong>
                    </td>
                    <td>{room.type}</td>
                    <td>{getEtatBadge(room.etat)}</td>
                    <td>
                      {room.capacite} 
                      <span className="text-muted small"> pers.</span>
                    </td>
                    <td className="text-end">
                      <strong>{formatPrice(room.prixChambre)}</strong>
                    </td>
                    <td>
                      {room.description ? (
                        <span title={room.description}>
                          {room.description.length > 50 
                            ? `${room.description.substring(0, 50)}...` 
                            : room.description
                          }
                        </span>
                      ) : (
                        <span className="text-muted" aria-label="Pas de description">—</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group" aria-label={`Actions pour la chambre ${room.numero}`}>
                        <Button
                          variant="outline-primary"
                          onClick={() => handleEdit(room.id)}
                          aria-label={`Modifier la chambre ${room.numero}`}
                          disabled={!room.id}
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDeleteClick(room)}
                          aria-label={`Supprimer la chambre ${room.numero}`}
                          disabled={!room.id}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

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

      
      <Modal 
        show={showConfirmModal} 
        onHide={handleCancelDelete} 
        centered
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
      >
        <Modal.Header closeButton>
          <Modal.Title id="delete-modal-title">Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body id="delete-modal-description">
          <ErrorDisplay 
            error={deleteError}
            onDismiss={() => setError(null)}
            title="Erreur de suppression"
          />
          
          {roomToDelete && (
            <div>
              <p>Voulez-vous vraiment supprimer cette chambre ?</p>
              <div className="bg-light p-3 rounded" role="region" aria-label="Détails de la chambre à supprimer">
                <strong>Détails de la chambre :</strong>
                <ul className="list-unstyled mt-2 mb-0">
                  <li><strong>Numéro :</strong> {roomToDelete.numero}</li>
                  <li><strong>Type :</strong> {roomToDelete.type}</li>
                  <li><strong>État :</strong> {roomToDelete.etat}</li>
                  <li><strong>Capacité :</strong> {roomToDelete.capacite} personnes</li>
                  {roomToDelete.prixChambre && (
                    <li><strong>Prix :</strong> {formatPrice(roomToDelete.prixChambre)}</li>
                  )}
                </ul>
              </div>
              <small className="text-muted d-block mt-2">
                <strong>Attention :</strong> Cette action est irréversible.
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
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
            disabled={deleting || !roomToDelete?.id}
            aria-label="Confirmer la suppression de la chambre"
          >
            {deleting ? (
              <>
                <span 
                  className="spinner-border spinner-border-sm me-2" 
                  role="status" 
                  aria-hidden="true"
                ></span>
                <span aria-live="polite">Suppression en cours...</span>
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default RoomList;