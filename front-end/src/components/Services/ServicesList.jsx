import { useEffect, useState, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Pagination from 'react-bootstrap/Pagination';
import { useNavigate } from 'react-router-dom';
import { getServices, deleteService } from '../../services/serviceServices';
import SearchBar from '../CommonComponents/SearchBar'; // Ajustez le chemin selon votre structure
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import ErrorDisplay from '../CommonComponents/ErrorDisplay';

function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Fonction pour charger les services
  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const data = await getServices();
      
      // Validation des données reçues
      if (!data || (!Array.isArray(data) && !data.member)) {
        throw new Error('Format de données invalide reçu du serveur');
      }
      
      const servicesData = data.member || data || [];
      
      // Validation de chaque service
      const validatedServices = servicesData.filter(service => {
        return service && 
               typeof service === 'object' && 
               service.id && 
               service.nom && 
               service.prixService !== undefined;
      });
      
      setServices(validatedServices);
    } catch {
      setError("Erreur lors de la récupération des services. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filtrage des services avec useMemo pour optimiser les performances
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filtre par recherche (nom)
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [services, searchTerm]);

  // Calcul de la pagination
  const paginationData = useMemo(() => {
    const totalItems = filteredServices.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredServices.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [filteredServices, currentPage, itemsPerPage]);

  // Statistiques des services
  const stats = useMemo(() => {
    const totalRevenu = filteredServices.reduce((sum, service) => {
      const prix = parseFloat(service.prixService) || 0;
      return sum + prix;
    }, 0);

    const prixMoyen = filteredServices.length > 0 
      ? totalRevenu / filteredServices.length 
      : 0;

    return {
      total: filteredServices.length,
      prixMoyen: prixMoyen,
      prixMin: filteredServices.length > 0 
        ? Math.min(...filteredServices.map(s => parseFloat(s.prixService) || 0)) 
        : 0,
      prixMax: filteredServices.length > 0 
        ? Math.max(...filteredServices.map(s => parseFloat(s.prixService) || 0)) 
        : 0
    };
  }, [filteredServices]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteClick = (service) => {
    // Validation avant suppression
    if (!service || !service.id) {
      setDeleteError("Impossible de supprimer ce service : données invalides.");
      return;
    }
    
    setDeleteError(null);
    setServiceToDelete(service);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete?.id) {
      setDeleteError("Impossible de supprimer ce service : ID manquant.");
      return;
    }
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      await deleteService(serviceToDelete.id);
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      setShowConfirmModal(false);
      setServiceToDelete(null);
      
      // Ajuster la page si nécessaire après suppression
      const newTotalPages = Math.ceil((filteredServices.length - 1) / itemsPerPage);
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
    setServiceToDelete(null);
    setDeleteError(null);
  };

  const handleEdit = (id) => {
    if (!id) {
      setError("Impossible de modifier ce service : ID manquant.");
      return;
    }
    navigate(`/services/${id}`);
  };

  
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0,00 €';
    const num = parseFloat(price);
    return isNaN(num) ? '0,00 €' : new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status" aria-hidden="true">
            <span className="visually-hidden">Chargement des services...</span>
          </div>
          <p className="mt-2">Chargement des services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger" role="alert" aria-live="assertive">
          <Alert.Heading>Erreur</Alert.Heading>
          {error}
          <div className="mt-3">
            <Button variant="outline-danger" onClick={fetchServices}>
              Réessayer
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 id="page-title">Gestion des Services</h1>
        
        
      </div>
      <ErrorDisplay 
        error={error}
        onDismiss={() => setError(null)}
        title="Erreur de chargement"
      />
      {/* Statistiques */}
      <section aria-labelledby="stats-title" className="mb-4">
        <h2 id="stats-title" className="visually-hidden">Statistiques des services</h2>
        <div className="row">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-primary">{stats.total}</h3>
                <p className="card-text">Total Services</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-success">{formatPrice(stats.prixMoyen)}</h3>
                <p className="card-text">Prix Moyen</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-info">{formatPrice(stats.prixMin)}</h3>
                <p className="card-text">Prix Minimum</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-warning">{formatPrice(stats.prixMax)}</h3>
                <p className="card-text">Prix Maximum</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SearchBar réutilisable */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Rechercher par nom de service..."
        onReset={() => { setSearchTerm(''); setCurrentPage(1); }}
        showReset={!!searchTerm}
      />

      {/* Informations sur les résultats */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div aria-live="polite" role="status">
          {paginationData.totalItems === 0 ? (
            <span className="text-muted">Aucun service trouvé</span>
          ) : (
            <span className="text-muted">
              Affichage de {paginationData.startIndex + 1} à {paginationData.endIndex} sur {paginationData.totalItems} services
            </span>
          )}
        </div>
      </div>

      {/* Tableau des services */}
      <section aria-labelledby="services-table-title">
        <h2 id="services-table-title" className="visually-hidden">Liste des services</h2>
        <div className="table-responsive">
          {paginationData.totalItems === 0 ? (
            <Alert variant="info" className="text-center my-4" role="status">
              {services.length === 0 
                ? 'Aucun service enregistré.' 
                : 'Aucun service trouvé avec cette recherche.'
              }
            </Alert>
          ) : (
            <table className="table table-striped table-hover" role="table" aria-labelledby="services-table-title">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Nom du service</th>
                  <th scope="col">Prix</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginationData.currentItems.map(service => (
                  <tr key={service.id}>
                    <td>
                      <strong>{service.nom}</strong>
                    </td>
                    <td className="text-end">
                      <strong>{formatPrice(service.prixService)}</strong>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group" aria-label={`Actions pour le service ${service.nom}`}>
                        <Button
                          variant="outline-primary"
                          onClick={() => handleEdit(service.id)}
                          aria-label={`Modifier le service ${service.nom}`}
                          disabled={!service.id}
                          title="Modifier le service"
                        >
                          <FiEdit/>
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDeleteClick(service)}
                          aria-label={`Supprimer le service ${service.nom}`}
                          disabled={!service.id}
                          title="Supprimer le service"
                        >
                          <FiTrash2/>
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
          {deleteError && (
            <Alert variant="danger" role="alert" aria-live="assertive">
              {deleteError}
            </Alert>
          )}
          
          {serviceToDelete && (
            <div>
              <p>Voulez-vous vraiment supprimer ce service ?</p>
              <div className="bg-light p-3 rounded" role="region" aria-label="Détails du service à supprimer">
                <strong>Détails du service :</strong>
                <ul className="list-unstyled mt-2 mb-0">
                  <li><strong>Nom :</strong> {serviceToDelete.nom}</li>
                  <li><strong>Prix :</strong> {formatPrice(serviceToDelete.prixService)}</li>
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
            disabled={deleting || !serviceToDelete?.id}
            aria-label="Confirmer la suppression du service"
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

export default ServiceList;