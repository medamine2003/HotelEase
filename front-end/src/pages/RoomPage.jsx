import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import RoomList from '../components/Rooms/RoomList';
import NavigationBar from "../components/CommonComponents/NavigationBar"

function Rooms() {
  return (
    <div className="container-fluid ">
      <NavigationBar/>  
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Chambres</h1>
        <Link to="/rooms/create">
          <Button variant="primary">Ajouter une chambre</Button>
        </Link>
      </div>

      <RoomList />
    </div>
  );
}

export default Rooms;
