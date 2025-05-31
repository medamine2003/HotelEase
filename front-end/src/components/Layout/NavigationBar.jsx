import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';


function NavigationBar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm mb-4">
      <Container>
        <Navbar.Brand href="/" className="fw-bold text-uppercase">
          HôtelManager
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto">
            <Nav.Link href="/">🏠 Tableau de Bord</Nav.Link>
            <Nav.Link href="/rooms">🛏 Chambres</Nav.Link>
            <Nav.Link href="/customers">👥 Clients</Nav.Link>
            <Nav.Link href="/services">🛎 Services</Nav.Link>
            <Nav.Link href="/payments">💳 Paiements</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
