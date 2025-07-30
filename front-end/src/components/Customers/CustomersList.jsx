// un composant d'un affichage des clients dans une table
// a component that is used in the display of clients in a table 
import { useEffect, useState, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Pagination from 'react-bootstrap/Pagination';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from '../../services/customerServices';
import SearchBar from '../CommonComponents/SearchBar'; 
import ErrorDisplay from '../CommonComponents/ErrorDisplay'; 

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Fonction pour charger les clients
  const fetchCustomers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getCustomers();
      
      // Validation des données reçues
      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide reçu du serveur');
      }
      
      // Validation de chaque client
      const validatedCustomers = data.filter(customer => {
        return customer && 
               typeof customer === 'object' && 
               customer.id && 
               customer.nom && 
               customer.prenom;
      });
      
      setCustomers(validatedCustomers);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filtrage des clients avec useMemo pour optimiser les performances
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Filtre par recherche (nom, prénom, téléphone, adresse)
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.numeroTelephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.adresseFacturation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${customer.nom} ${customer.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [customers, searchTerm]);

  // Calcul de la pagination
  const paginationData = useMemo(() => {
    const totalItems = filteredCustomers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredCustomers.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Statistiques des clients
  const stats = useMemo(() => {
    return {
      total: filteredCustomers.length,
      withPhone: filteredCustomers.filter(c => c.numeroTelephone).length,
      withAddress: filteredCustomers.filter(c => c.adresseFacturation).length
    };
  }, [filteredCustomers]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteClick = (customer) => {
    if (!customer || !customer.id) {
      setDeleteError("Impossible de supprimer ce client : données invalides.");
      return;
    }
    
    setDeleteError(null);
    setCustomerToDelete(customer);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete?.id) {
      setDeleteError("Impossible de supprimer ce client : ID manquant.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    
    try {
      await deleteCustomer(customerToDelete.id);
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      setShowConfirmModal(false);
      setCustomerToDelete(null);
      
      // Ajuster la page si nécessaire après suppression
      const newTotalPages = Math.ceil((filteredCustomers.length - 1) / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error('Erreur suppression client:', error);
      
      setDeleteError(error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setCustomerToDelete(null);
    setDeleteError(null);
  };

  const handleEdit = (id) => {
    if (!id) {
      setError("Impossible de modifier ce client : ID manquant.");
      return;
    }
    navigate(`/customers/${id}`);
  };

  

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status" aria-hidden="true">
            <span className="visually-hidden">Chargement des clients...</span>
          </div>
          <p className="mt-2">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 id="page-title">Gestion des Clients</h1>
        
          
       
      </div>

      
      <ErrorDisplay 
        error={error}
        onDismiss={() => setError(null)}
        title="Erreur de chargement"
      />

      {/* Statistiques */}
      <section aria-labelledby="stats-title" className="mb-4">
        <h2 id="stats-title" className="visually-hidden">Statistiques des clients</h2>
        <div className="row">
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-primary">{stats.total}</h3>
                <p className="card-text">Total Clients</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-success">{stats.withPhone}</h3>
                <p className="card-text">Avec Téléphone</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-info">{stats.withAddress}</h3>
                <p className="card-text">Avec Adresse</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SearchBar réutilisable */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Rechercher par nom, prénom, téléphone ou adresse..."
        onReset={() => { setSearchTerm(''); setCurrentPage(1); }}
        showReset={!!searchTerm}
      />

      {/* Informations sur les résultats */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div aria-live="polite" role="status">
          {paginationData.totalItems === 0 ? (
            <span className="text-muted">Aucun client trouvé</span>
          ) : (
            <span className="text-muted">
              Affichage de {paginationData.startIndex + 1} à {paginationData.endIndex} sur {paginationData.totalItems} clients
            </span>
          )}
        </div>
      </div>

      {/* Tableau des clients */}
      <section aria-labelledby="customers-table-title">
        <h2 id="customers-table-title" className="visually-hidden">Liste des clients</h2>
        <div className="table-responsive">
          {paginationData.totalItems === 0 ? (
            <Alert variant="info" className="text-center my-4" role="status">
              {customers.length === 0 
                ? 'Aucun client enregistré.' 
                : 'Aucun client trouvé avec cette recherche.'
              }
            </Alert>
          ) : (
            <table className="table table-striped table-hover" role="table" aria-labelledby="customers-table-title">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Nom</th>
                  <th scope="col">Prénom</th>
                  <th scope="col">Téléphone</th>
                  <th scope="col">Adresse de facturation</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginationData.currentItems.map(customer => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.nom}</strong>
                    </td>
                    <td>{customer.prenom}</td>
                    <td>
                      {customer.numeroTelephone ? (
                        <a 
                          href={`tel:${customer.numeroTelephone}`}
                          className="text-decoration-none"
                          aria-label={`Appeler ${customer.nom} ${customer.prenom} au ${customer.numeroTelephone}`}
                        >
                          {customer.numeroTelephone}
                        </a>
                      ) : (
                        <span className="text-muted" aria-label="Pas de téléphone renseigné">—</span>
                      )}
                    </td>
                    <td>
                      {customer.adresseFacturation ? (
                        <span title={customer.adresseFacturation}>
                          {customer.adresseFacturation.length > 50 
                            ? `${customer.adresseFacturation.substring(0, 50)}...` 
                            : customer.adresseFacturation
                          }
                        </span>
                      ) : (
                        <span className="text-muted" aria-label="Pas d'adresse renseignée">—</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group" aria-label={`Actions pour le client ${customer.nom} ${customer.prenom}`}>
                        <Button
  variant="outline-primary"
  onClick={() => handleEdit(customer.id)}
  aria-label={`Modifier le client ${customer.nom} ${customer.prenom}`}
  disabled={!customer.id}
  title="Modifier le client"
>
  <FiEdit /> {/* ou <FiEdit /> ou <MdEdit /> selon votre préférence */}
</Button>
<Button
  variant="outline-danger"
  onClick={() => handleDeleteClick(customer)}
  aria-label={`Supprimer le client ${customer.nom} ${customer.prenom}`}
  disabled={!customer.id}
  title="Supprimer le client"
>
  <FiTrash2 /> {/* ou <FiTrash2 /> ou <MdDelete /> */}
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
          
          <ErrorDisplay 
            error={deleteError}
            onDismiss={() => setDeleteError(null)}
            title="Erreur de suppression"
          />
          
          {customerToDelete && (
            <div>
              <p>Voulez-vous vraiment supprimer ce client ?</p>
              <div className="bg-light p-3 rounded" role="region" aria-label="Détails du client à supprimer">
                <strong>Détails du client :</strong>
                <ul className="list-unstyled mt-2 mb-0">
                  <li><strong>Nom :</strong> {customerToDelete.nom}</li>
                  <li><strong>Prénom :</strong> {customerToDelete.prenom}</li>
                  {customerToDelete.numeroTelephone && (
                    <li><strong>Téléphone :</strong> {customerToDelete.numeroTelephone}</li>
                  )}
                  {customerToDelete.adresseFacturation && (
                    <li><strong>Adresse :</strong> {customerToDelete.adresseFacturation}</li>
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
            disabled={deleting || !customerToDelete?.id}
            aria-label="Confirmer la suppression du client"
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

export default CustomerList;