import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
/*Customers*/
import Customers from './pages/CustomerPage';
import CustomerForm from './components/Customers/CustomerForm';
/*Rooms */
import Rooms from './pages/RoomPage';
import RoomForm from './components/Rooms/RoomForm';
/*Payments */
import Payments from './pages/PaymentPage';
import PaymentForm from './components/Payments/PaymentForm';
/*Services */
import Services from './pages/ServicePage';
import ServiceForm from './components/Services/ServiceForm';
/*Dashboard */
import Dashboard from './pages/DashboardPage';
/*Utilisateurs */
import Users from './pages/UserPage'
import UserForm from './components/Users/UserForm';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* Routes Customers */}
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/create" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerForm />} />
        {/* Routes Rooms */}
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/create" element={<RoomForm />} />
        <Route path="/rooms/:id" element={<RoomForm />} />
        {/* Routes Payments */}
        <Route path="/payments" element={<Payments />} />
        <Route path="/payments/create" element={<PaymentForm />} />
        <Route path="/payments/:id" element={<PaymentForm />} />
        {/* Routes Payments */}
        <Route path="/services" element={<Services />} />
        <Route path="/services/create" element={<ServiceForm />} />
        <Route path="/services/:id" element={<ServiceForm />} />
        {/*Routes Users */}
        <Route path="/users" element={<Users />} />
        <Route path="/users/create" element={<UserForm />} />
        <Route path="/users/:id" element={<UserForm />} />
      </Routes>
    </Router>
  );
}

export default App;
