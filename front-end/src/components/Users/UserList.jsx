import { useEffect, useState, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Pagination from 'react-bootstrap/Pagination';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser } from '../../services/userServices';
import SearchBar from '../CommonComponents/SearchBar'; // Ajustez le chemin selon votre structure
import ErrorDisplay from '../CommonComponents/ErrorDisplay';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Configuration des filtres pour le SearchBar
  const userFilters = useMemo(() => [
    {
      key: 'role',
      type: 'select',
      label: 'Rôle',
      defaultOption: 'Tous les rôles',
      options: [
        { value: 'ROLE_ADMIN', label: 'Administrateur' },
        { value: 'ROLE_RECEPTIONNISTE', label: 'Réceptionniste' }
      ]
    }
  ], []);

  // Fonction pour charger les utilisateurs
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await getUsers();
      
      // Validation des données reçues
      if (!data || (!Array.isArray(data) && !data.member && !data['hydra:member'])) {
        throw new Error('Format de données invalide reçu du serveur');
      }
      
      const usersData = data.member || data['hydra:member'] || data || [];
      
      // Validation de chaque utilisateur
      const validatedUsers = usersData.filter(user => {
        return user && 
               typeof user === 'object' && 
               user.id && 
               user.nom && 
               user.email;
      });
      
      setUsers(validatedUsers);
    } catch {
      setError("Erreur lors de la récupération des utilisateurs. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtrage des utilisateurs avec useMemo pour optimiser les performances
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filtre par recherche (nom, email)
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par rôle
    if (filterValues.role) {
      filtered = filtered.filter(user => user.role === filterValues.role);
    }

    return filtered;
  }, [users, searchTerm, filterValues]);

  // Calcul de la pagination
  const paginationData = useMemo(() => {
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredUsers.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Statistiques des utilisateurs
  const stats = useMemo(() => {
    return {
      total: filteredUsers.length,
      admins: filteredUsers.filter(u => u.role === 'ROLE_ADMIN').length,
      users: filteredUsers.filter(u => u.role === 'ROLE_RECEPTIONNISTE').length
    };
  }, [filteredUsers]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterValues]);

  const handleDeleteClick = (user) => {
    // Validation avant suppression
    if (!user || !user.id) {
      setDeleteError("Impossible de supprimer cet utilisateur : données invalides.");
      return;
    }
    
    setDeleteError(null);
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete?.id) {
      setDeleteError("Impossible de supprimer cet utilisateur : ID manquant.");
      return;
    }
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      await deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setShowConfirmModal(false);
      setUserToDelete(null);
      
      // Ajuster la page si nécessaire après suppression
      const newTotalPages = Math.ceil((filteredUsers.length - 1) / itemsPerPage);
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
    setUserToDelete(null);
    setDeleteError(null);
  };

  const handleEdit = (id) => {
    if (!id) {
      setError("Impossible de modifier cet utilisateur : ID manquant.");
      return;
    }
    navigate(`/users/${id}`);
  };

  

  const getRoleBadge = (role) => {
    const variants = {
      'ROLE_ADMIN': 'danger',
      'ROLE_RECEPTIONNISTE': 'primary'
    };
    
    const labels = {
      'ROLE_ADMIN': 'Administrateur',
      'ROLE_RECEPTIONNISTE': 'Réceptionniste'
    };

    return (
      <Badge 
        bg={variants[role] || 'secondary'} 
        aria-label={`Rôle: ${labels[role] || role}`}
      >
        {labels[role] || role}
      </Badge>
    );
  };

  const formatEmail = (email) => {
    if (!email) return '';
    return email.toLowerCase();
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status" aria-hidden="true">
            <span className="visually-hidden">Chargement des utilisateurs...</span>
          </div>
          <p className="mt-2">Chargement des utilisateurs...</p>
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
            <Button variant="outline-danger" onClick={fetchUsers}>
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
        <h1 id="page-title">Gestion des Utilisateurs</h1>
        
      </div>
      <ErrorDisplay 
        error={error}
        onDismiss={() => setError(null)}
        title="Erreur de chargement"
      />
      {/* Statistiques */}
      <section aria-labelledby="stats-title" className="mb-4">
        <h2 id="stats-title" className="visually-hidden">Statistiques des utilisateurs</h2>
        <div className="row">
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-primary">{stats.total}</h3>
                <p className="card-text">Total Utilisateurs</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-danger">{stats.admins}</h3>
                <p className="card-text">Administrateurs</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="card-title text-info">{stats.users}</h3>
                <p className="card-text">Réceptionniste</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SearchBar réutilisable */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Rechercher par nom ou email..."
        filters={userFilters}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues(prev => ({ ...prev, [key]: value }))}
        onReset={() => { setSearchTerm(''); setFilterValues({}); setCurrentPage(1); }}
      />

      {/* Informations sur les résultats */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div aria-live="polite" role="status">
          {paginationData.totalItems === 0 ? (
            <span className="text-muted">Aucun utilisateur trouvé</span>
          ) : (
            <span className="text-muted">
              Affichage de {paginationData.startIndex + 1} à {paginationData.endIndex} sur {paginationData.totalItems} utilisateurs
            </span>
          )}
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <section aria-labelledby="users-table-title">
        <h2 id="users-table-title" className="visually-hidden">Liste des utilisateurs</h2>
        <div className="table-responsive">
          {paginationData.totalItems === 0 ? (
            <Alert variant="info" className="text-center my-4" role="status">
              {users.length === 0 
                ? 'Aucun utilisateur enregistré.' 
                : 'Aucun utilisateur trouvé avec ces filtres.'
              }
            </Alert>
          ) : (
            <table className="table table-striped table-hover" role="table" aria-labelledby="users-table-title">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Nom</th>
                  <th scope="col">Email</th>
                  <th scope="col">Rôle</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginationData.currentItems.map(user => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.nom}</strong>
                    </td>
                    <td>
                      <a 
                        href={`mailto:${user.email}`}
                        className="text-decoration-none"
                        aria-label={`Envoyer un email à ${user.nom}`}
                      >
                        {formatEmail(user.email)}
                      </a>
                    </td>
                    <td>
                      {getRoleBadge(user.role)}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group" aria-label={`Actions pour l'utilisateur ${user.nom}`}>
                        <Button
                          variant="outline-primary"
                          onClick={() => handleEdit(user.id)}
                          aria-label={`Modifier l'utilisateur ${user.nom}`}
                          disabled={!user.id}
                          title="Modifier l'utilisateur"
                        >
                          <FiEdit/>
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDeleteClick(user)}
                          aria-label={`Supprimer l'utilisateur ${user.nom}`}
                          disabled={!user.id}
                          title="Supprimer l'utilisateur"
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
          
          {userToDelete && (
            <div>
              <p>Voulez-vous vraiment supprimer cet utilisateur ?</p>
              <div className="bg-light p-3 rounded" role="region" aria-label="Détails de l'utilisateur à supprimer">
                <strong>Détails de l'utilisateur :</strong>
                <ul className="list-unstyled mt-2 mb-0">
                  <li><strong>Nom :</strong> {userToDelete.nom}</li>
                  <li><strong>Email :</strong> {formatEmail(userToDelete.email)}</li>
                  <li><strong>Rôle :</strong> {getRoleBadge(userToDelete.role)}</li>
                </ul>
              </div>
              <small className="text-muted d-block mt-2">
                <strong>Attention :</strong> Cette action est irréversible.
              </small>
              {userToDelete.role === 'ROLE_ADMIN' && (
                <div className="alert alert-warning mt-2" role="alert">
                  <strong>Attention :</strong> Vous supprimez un administrateur. Assurez-vous qu'il y ait d'autres administrateurs.
                </div>
              )}
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
            disabled={deleting || !userToDelete?.id}
            aria-label="Confirmer la suppression de l'utilisateur"
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

export default UserList;