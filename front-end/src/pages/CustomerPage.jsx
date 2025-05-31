import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import CustomerList from '../components/Customers/CustomersList';
import NavigationBar from "../components/Layout/NavigationBar"

function Customers() {
  return (
    <div className="container mt-3">
      <NavigationBar/>  
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Clients</h1>
        <Link to="/customers/create">
          <Button variant="primary">Ajouter un client</Button>
        </Link>
      </div>

      <CustomerList />
    </div>
  );
}

export default Customers;
