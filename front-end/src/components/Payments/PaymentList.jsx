// un composant d'un affichage des paiments dans une table
// a component that is used in the display of payments in a table 
import { useEffect, useState, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Pagination from 'react-bootstrap/Pagination';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { getPayments, deletePayment, formatAmount, roundToTwoDecimals } from '../../services/paymentServices';
import SearchBar from '../CommonComponents/SearchBar'; 
import ErrorDisplay from '../CommonComponents/ErrorDisplay';

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  
  const paymentFilters = useMemo(() => [
    {
      key: 'type',
      type: 'select',
      label: 'Type',
      defaultOption: 'Tous les types',
      options: [
        { value: 'acompte', label: 'Acompte' },
        { value: 'solde', label: 'Solde' },
        { value: 'remboursement', label: 'Remboursement' }
      ]
    },
    {
      key: 'method',
      type: 'select',
      label: 'Méthode',
      defaultOption: 'Toutes les méthodes',
      options: [
        { value: 'Espèces', label: 'Espèces' },
        { value: 'Carte bancaire', label: 'Carte bancaire' },
        { value: 'Virement bancaire', label: 'Virement bancaire' },
        { value: 'Chèque', label: 'Chèque' },
        { value: 'PayPal', label: 'PayPal' }
      ]
    }
  ], []);

  
  const fixPrecisionIssues = useCallback((payments) => {
    return payments.map(payment => {
      if (payment.reservation) {
        // condition pour corriger le montant restant s'il y a une erreur de précision
        if (payment.reservation.montantRestant && Math.abs(payment.reservation.montantRestant) < 0.01) {
          payment.reservation.montantRestant = 0;
        }
        
        // conction pour corriger le statut si le montant restant est pratiquement zéro
        if (payment.reservation.montantRestant === 0 || Math.abs(payment.reservation.montantRestant) < 0.01) {
          payment.reservation.statutPaiement = 'complet';
        }
      }
      return payment;
    });
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      
      setError(null);
      const data = await getPayments();
      
      
      const paymentsData = data || [];
    
      
      // Validation frontend des données
      const validatedPayments = paymentsData.filter(payment => {
        return payment.id && payment.montant && payment.methodePaiement && payment.datePaiement;
      });
      
      
      
      // Corriger les erreurs de précision
      const correctedPayments = fixPrecisionIssues(validatedPayments);
      
      
      setPayments(correctedPayments);
      
    } catch (error) {
      console.error(' Erreur fetchPayments:', error);
      setError("Erreur lors de la récupération des paiements. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [fixPrecisionIssues]);

  
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  
  const filteredPayments = useMemo(() => {
   
    let filtered = payments;

    
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.reservation?.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reservation?.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.numeroTransaction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.commentaire?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    
    if (filterValues.type) {
      filtered = filtered.filter(payment => payment.typePaiement === filterValues.type);
    }

    
    if (filterValues.method) {
      filtered = filtered.filter(payment => payment.methodePaiement === filterValues.method);
    }

    
    return filtered;
  }, [payments, searchTerm, filterValues]);

 
  const paginationData = useMemo(() => {
    const totalItems = filteredPayments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredPayments.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [filteredPayments, currentPage, itemsPerPage]);

  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterValues]);

  
  const stats = useMemo(() => {
    const calculatedStats = {
      totalAmount: roundToTwoDecimals(
        paginationData.currentItems.reduce((sum, p) => {
          const amount = parseFloat(p.montant);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0)
      ),
      totalCount: paginationData.totalItems,
      acomptes: filteredPayments.filter(p => p.typePaiement === 'acompte'),
      soldes: filteredPayments.filter(p => p.typePaiement === 'solde'),
      remboursements: filteredPayments.filter(p => p.typePaiement === 'remboursement')
    };
    
    
    return calculatedStats;
  }, [paginationData.currentItems, paginationData.totalItems, filteredPayments]);

  const handleDeleteClick = (payment) => {
    
    if (!payment || !payment.id) {
      setDeleteError("Impossible de supprimer ce paiement : données invalides.");
      return;
    }
    
    setDeleteError(null);
    setPaymentToDelete(payment);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete?.id) {
      setDeleteError("Impossible de supprimer ce paiement : ID manquant.");
      return;
    }
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      await deletePayment(paymentToDelete.id);
      setPayments((prev) => prev.filter((p) => p.id !== paymentToDelete.id));
      setShowConfirmModal(false);
      setPaymentToDelete(null);
      
      
      const newTotalPages = Math.ceil((filteredPayments.length - 1) / itemsPerPage);
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
    setPaymentToDelete(null);
    setDeleteError(null);
  };

  const handleEdit = (id) => {
    if (!id) {
      setError("Impossible de modifier ce paiement : ID manquant.");
      return;
    }
    navigate(`/payments/${id}`);
  };

  const getTypeBadge = (type) => {
    const variants = {
      'acompte': 'info',
      'solde': 'primary',
      'remboursement': 'warning'
    };
    return (
      <Badge 
        bg={variants[type] || 'secondary'} 
        aria-label={`Type de paiement: ${type}`}
      >
        {type}
      </Badge>
    );
  };

  
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  
  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4" role="status" aria-live="polite">
        <div className="spinner-border text-primary" role="status" aria-hidden="true">
          <span className="visually-hidden">Chargement des paiements...</span>
        </div>
        <p className="mt-2">Chargement des paiements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" role="alert" aria-live="assertive">
        <ErrorDisplay 
                error={error}
                onDismiss={() => setError(null)}
                title="Erreur de chargement"
              />
        <div className="mt-3">
          <Button variant="outline-danger" onClick={fetchPayments}>
            Réessayer
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 id="page-title">Gestion des Paiements</h1>
      </div>

      
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Rechercher par client ou transaction..."
        filters={paymentFilters}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues(prev => ({ ...prev, [key]: value }))}
        onReset={() => { setSearchTerm(''); setFilterValues({}); setCurrentPage(1); }}
      />

      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div aria-live="polite" role="status">
          {paginationData.totalItems === 0 ? (
            <span className="text-muted">Aucun paiement trouvé</span>
          ) : (
            <span className="text-muted">
              Affichage de {paginationData.startIndex + 1} à {paginationData.endIndex} sur {paginationData.totalItems} paiements
            </span>
          )}
        </div>
      </div>

      
      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="visually-hidden">Statistiques des paiements</h2>
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center" role="region" aria-labelledby="total-amount">
              <div className="card-body">
                <h3 id="total-amount" className="card-title text-success">
                  {formatAmount(stats.totalAmount)}
                </h3>
                <p className="card-text">Total Encaissé</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center" role="region" aria-labelledby="acomptes-count">
              <div className="card-body">
                <h3 id="acomptes-count" className="card-title text-info">
                  {stats.acomptes.length}
                </h3>
                <p className="card-text">Acomptes</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center" role="region" aria-labelledby="soldes-count">
              <div className="card-body">
                <h3 id="soldes-count" className="card-title text-primary">
                  {stats.soldes.length}
                </h3>
                <p className="card-text">Soldes</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center" role="region" aria-labelledby="total-count">
              <div className="card-body">
                <h3 id="total-count" className="card-title text-secondary">
                  {stats.totalCount}
                </h3>
                <p className="card-text">Total Paiements</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section aria-labelledby="payments-table-title">
        <h2 id="payments-table-title" className="visually-hidden">Liste des paiements</h2>
        <div className="table-responsive">
          {paginationData.totalItems === 0 ? (
            <Alert variant="info" className="text-center my-4" role="status">
              {payments.length === 0 
                ? 'Aucun paiement enregistré.' 
                : 'Aucun paiement trouvé avec ces filtres.'
              }
            </Alert>
          ) : (
            <table className="table table-striped table-hover" role="table" aria-labelledby="payments-table-title">
              <thead className="table-dark">
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Date</th>
                  <th scope="col">Réservation</th>
                  <th scope="col">Client</th>
                  <th scope="col">Montant</th>
                  <th scope="col">Type</th>
                  <th scope="col">Méthode</th>
                  <th scope="col">Transaction</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginationData.currentItems.map(payment => (
                  <tr key={payment.id}>
                    <td>#{payment.id}</td>
                    <td>{formatDate(payment.datePaiement)}</td>
                    <td>
                      {payment.reservation ? (
                        <Link 
                          to={`/reservations/${payment.reservation.id}`}
                          aria-label={`Voir la réservation numéro ${payment.reservation.id}`}
                        >
                          Résa #{payment.reservation.id}
                        </Link>
                      ) : (
                        <span aria-label="Aucune réservation associée">-</span>
                      )}
                    </td>
                    <td>
                      {payment.reservation?.client ? 
                        `${payment.reservation.client.nom} ${payment.reservation.client.prenom}` 
                        : <span aria-label="Client non renseigné">-</span>
                      }
                    </td>
                    <td className="text-end">
                      <strong>{formatAmount(payment.montant)}</strong>
                    </td>
                    <td>{getTypeBadge(payment.typePaiement || 'solde')}</td>
                    <td>{payment.methodePaiement}</td>
                    <td className="text-muted small">
                      {payment.numeroTransaction || <span aria-label="Pas de numéro de transaction">-</span>}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group" aria-label={`Actions pour le paiement ${payment.id}`}>
                        <Button
                          variant="outline-primary"
                          onClick={() => handleEdit(payment.id)}
                          aria-label={`Modifier le paiement ${payment.id}`}
                          disabled={!payment.id}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDeleteClick(payment)}
                          aria-label={`Supprimer le paiement ${payment.id}`}
                          disabled={!payment.id}
                        >
                           <FiTrash2 />
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
          
          {paymentToDelete && (
            <div>
              <p>Voulez-vous vraiment supprimer ce paiement ?</p>
              <div className="bg-light p-3 rounded" role="region" aria-label="Détails du paiement à supprimer">
                <strong>Détails du paiement :</strong>
                <ul className="list-unstyled mt-2 mb-0">
                  <li><strong>ID :</strong> #{paymentToDelete.id}</li>
                  <li><strong>Montant :</strong> {formatAmount(paymentToDelete.montant)}</li>
                  <li><strong>Type :</strong> {paymentToDelete.typePaiement || 'solde'}</li>
                  <li><strong>Méthode :</strong> {paymentToDelete.methodePaiement}</li>
                  <li><strong>Date :</strong> {formatDateTime(paymentToDelete.datePaiement)}</li>
                  {paymentToDelete.numeroTransaction && (
                    <li><strong>Transaction :</strong> {paymentToDelete.numeroTransaction}</li>
                  )}
                  {paymentToDelete.reservation && (
                    <li><strong>Réservation :</strong> #{paymentToDelete.reservation.id}</li>
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
            disabled={deleting || !paymentToDelete?.id}
            aria-label="Confirmer la suppression du paiement"
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

export default PaymentList;