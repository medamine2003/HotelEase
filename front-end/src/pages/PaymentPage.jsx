import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import PaymentList from '../components/Payments/PaymentList';
import NavigationBar from "../components/Layout/NavigationBar"

function Payments() {
  return (
    <div className="container mt-3">
      <NavigationBar/>  
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Paiements</h1>
        <Link to="/payments/create">
          <Button variant="primary">Ajouter un paiement</Button>
        </Link>
      </div>

      <PaymentList />
    </div>
  );
}

export default Payments;
