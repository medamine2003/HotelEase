import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Button } from 'react-bootstrap';
import { 
  FaHome, 
  FaBed, 
  FaUsers, 
  FaBell, 
  FaCreditCard, 
  FaCalendarAlt, 
  FaCog, 
  FaSignOutAlt 
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

function NavigationBar() {
  const { logout, user } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm mb-4">
      <Container>
        <Navbar.Brand href="/" className="fw-bold text-uppercase">
          HôtelEase
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto">
            <Nav.Link href="/"><FaHome className="me-2" />Tableau de Bord</Nav.Link>
            <Nav.Link href="/rooms"><FaBed className="me-2" />Chambres</Nav.Link>
            <Nav.Link href="/customers"><FaUsers className="me-2" />Clients</Nav.Link>
            <Nav.Link href="/services"><FaBell className="me-2" />Services</Nav.Link>
            <Nav.Link href="/payments"><FaCreditCard className="me-2" />Paiements</Nav.Link>
            <Nav.Link href="/reservations"><FaCalendarAlt className="me-2" />Réservations</Nav.Link>
            
            {user?.role === 'ROLE_ADMIN' && (
              <Nav.Link href="/users"><FaCog className="me-2" />Utilisateurs</Nav.Link>
            )}
            
            <Button
              variant="outline-light"
              size="sm"
              className="ms-3"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" />Déconnexion
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;