import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from '../../services/customerServices';

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data.member || []);
    } catch (err) {
      setError("Erreur lors de la récupération des clients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce client ?')) return;
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert('Une erreur est survenue pendant la suppression.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/customers/${id}`);
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
    <div class="table">
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Téléphone</th>
            <th>Adresse de facturation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.id}>
              <td>{customer.nom}</td>
              <td>{customer.prenom}</td>
              <td>{customer.numeroTelephone}</td>
              <td>{customer.adresseFacturation || '—'}</td>
              <td>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEdit(customer.id)}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(customer.id)}
                >
                  Supprimer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerList;
