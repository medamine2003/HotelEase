import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import ReservationList from '../components/Reservations/ReservationList';
import NavigationBar from '../components/CommonComponents/NavigationBar';
import Footer from '../components/CommonComponents/Footer';
function Reservations() {
  return (
    <div className="container-fluid ">
      <NavigationBar />
      <ReservationList />
      <Footer/>
    </div>
  );
}

export default Reservations;
