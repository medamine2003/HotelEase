import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { getRooms, deleteRoom } from '../../services/roomServices';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      console.log("Réponse API rooms :", data);
      setRooms(data.member || []);
    } catch (err) {
      setError("Erreur lors de la récupération des chambres");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette chambre ?')) return;
    try {
      await deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert('Une erreur est survenue pendant la suppression.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/rooms/${id}`);
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
            <th>Numéro</th>
            <th>Type</th>
            <th>État</th>
            <th>Capacité</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => (
            <tr key={room.id}>
              <td>{room.numero}</td>
              <td>{room.type}</td>
              <td>{room.etat}</td>
              <td>{room.capacite}</td>
              <td>{room.description || '—'}</td>
              <td>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEdit(room.id)}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(room.id)}
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

export default RoomList;
