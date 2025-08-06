import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import CustomerList from '../components/Customers/CustomersList';
import NavigationBar from "../components/CommonComponents/NavigationBar"
import Footer from '../components/CommonComponents/Footer';
function Customers() {
  return (
    <div className="container-fluid  ">
      <NavigationBar/>  
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Paiements</h1>
        <Link to="/customers/create">
          <Button variant="primary">Ajouter un client</Button>
        </Link>
      </div>
        
     

      <CustomerList />
      <Footer/>
    </div>
  );
}

export default Customers;
