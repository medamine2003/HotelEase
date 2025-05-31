import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { getServices, deleteService } from '../../services/serviceServices';

function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await getServices();
      console.log("Données reçues du service:", data);
      setServices(data.member || []);
    } catch (err) {
      setError("Erreur lors de la récupération des services");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce service ?')) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert('Une erreur est survenue pendant la suppression.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/services/${id}`);
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
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prix (€)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  {services.length > 0 ? (
    services.map(service => (
      <tr key={service.id}>
        <td>{service.nom}</td>
        <td>{Number(service.prixService).toFixed(2)}</td>
        <td>
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => handleEdit(service.id)}
          >
            Modifier
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDelete(service.id)}
          >
            Supprimer
          </Button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="3" className="text-center">
        Aucun service trouvé.
      </td>
    </tr>
  )}
</tbody>

      </table>
    </div>
  );
}

export default ServiceList;
