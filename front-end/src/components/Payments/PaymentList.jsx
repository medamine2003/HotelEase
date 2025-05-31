import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { getPayments, deletePayment } from '../../services/paymentService';

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await getPayments();
      setPayments(data.member || []);
    } catch (err) {
      setError("Erreur lors de la récupération des paiements");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce paiement ?')) return;
    try {
      await deletePayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert('Une erreur est survenue pendant la suppression.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/payments/${id}`);
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="table-responsive">
      {payments.length === 0 ? (
        <div className="alert alert-info text-center my-4">
          Aucun paiement enregistré.
        </div>
      ) : (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Montant (€)</th>
              <th>Méthode de paiement</th>
              <th>Date de paiement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.montant}</td>
                <td>{payment.methodePaiement}</td>
                <td>{new Date(payment.datePaiement).toLocaleString()}</td>
                <td>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(payment.id)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(payment.id)}
                  >
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PaymentList;
