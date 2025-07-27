import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import ReservationList from '../components/Reservations/ReservationList';
import NavigationBar from '../components/CommonComponents/NavigationBar';

function Reservations() {
  return (
    <div className="container-fluid ">
      <NavigationBar />
      <ReservationList />
    </div>
  );
}

export default Reservations;
