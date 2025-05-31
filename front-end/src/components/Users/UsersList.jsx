import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser } from '../../services/userServices';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      console.log("Réponse brute de l'API :", data);

      // API Platform peut utiliser "hydra:member" ou "member" selon la config.
      // Ici tu as mentionné "member" donc on prend data.member
      const usersData = data.member || data['hydra:member'] || [];
      console.log("Données utilisées dans setUsers :", usersData);

      setUsers(usersData);
    } catch (err) {
      setError("Erreur lors de la récupération des utilisateurs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert('Une erreur est survenue pendant la suppression.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/users/${id}`); // adapte la route selon ton routing
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
            <th>Email</th>
            <th>Rôle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.nom}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEdit(user.id)}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
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

export default UserList;
