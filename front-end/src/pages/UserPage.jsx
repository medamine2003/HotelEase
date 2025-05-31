import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import UserList from '../components/Users/UsersList';
import NavigationBar from "../components/Layout/NavigationBar"

function Users() {
  return (
    <div className="container mt-3">
      <NavigationBar/>  
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Utilisateurs</h1>
        <Link to="/users/create">
          <Button variant="primary">Ajouter un utilisateur</Button>
        </Link>
      </div>

      <UserList />
    </div>
  );
}

export default Users;
