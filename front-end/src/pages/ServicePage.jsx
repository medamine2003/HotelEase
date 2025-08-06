import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import ServiceList from '../components/Services/ServicesList'
import NavigationBar from "../components/CommonComponents/NavigationBar"
import Footer from '../components/CommonComponents/Footer';
function Services() {
  return (
    
    <div className="container-fluid "> 
      <NavigationBar/>
      
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>Services</h1>
            <Link to="/services/create">
                <Button variant="primary">Ajouter un service</Button>
            </Link>
        </div>

        <ServiceList />
        <Footer/>
      </div> 
   
  );
}

export default Services;
