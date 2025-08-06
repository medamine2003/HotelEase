import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import UserList from '../components/Users/UserList';
import NavigationBar from "../components/CommonComponents/NavigationBar"
import Footer from '../components/CommonComponents/Footer';
function Users() {
  return (
    <div className="container-fluid ">
      <NavigationBar/>  
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Utilisateurs</h1>
        <Link to="/users/create">
          <Button variant="primary">Ajouter un utilisateur</Button>
        </Link>
      </div>

      <UserList />
      <Footer/>
    </div>
  );
}

export default Users;
