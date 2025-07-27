import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/CommonComponents/ProtectedRoute'; // ton composant à créer ou déjà créé

/* Customers */
import Customers from './pages/CustomerPage';
import CustomerForm from './components/Customers/CustomerForm';
/* Rooms */
import Rooms from './pages/RoomPage';
import RoomForm from './components/Rooms/RoomForm';
/* Payments */
import Payments from './pages/PaymentPage';
import PaymentForm from './components/Payments/PaymentForm';
/* Services */
import Services from './pages/ServicePage';
import ServiceForm from './components/Services/ServiceForm';
/* Dashboard */
import Dashboard from './pages/DashboardPage';
/* Users */
import Users from './pages/UserPage';
import UserForm from './components/Users/UserForm';
/* Reservations */
import Reservations from './pages/ReservationPage';
import ReservationForm from './components/Reservations/ResservationForm';
/* Login */
import LoginForm from './pages/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Routes Customers */}
        <Route 
          path="/customers" 
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customers/create" 
          element={
            <ProtectedRoute>
              <CustomerForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customers/:id" 
          element={
            <ProtectedRoute>
              <CustomerForm />
            </ProtectedRoute>
          } 
        />

        {/* Routes Rooms */}
        <Route 
          path="/rooms" 
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rooms/create" 
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
            <RoomForm />
          </ProtectedRoute>
          } 
        />
        <Route 
          path="/rooms/:id" 
          element={
            <ProtectedRoute>
              <RoomForm />
            </ProtectedRoute>
          } 
        />

        {/* Routes Payments */}
        <Route 
          path="/payments" 
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payments/create" 
          element={
            <ProtectedRoute>
              <PaymentForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payments/:id" 
          element={
            <ProtectedRoute>
              <PaymentForm />
            </ProtectedRoute>
          } 
        />

        {/* Routes Services */}
        <Route 
          path="/services" 
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/services/create" 
          element={
            <ProtectedRoute>
              <ServiceForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/services/:id" 
          element={
            <ProtectedRoute>
              <ServiceForm />
            </ProtectedRoute>
          } 
        />

        {/* Routes Users - 🚨 PROTECTION ADMIN UNIQUEMENT */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <Users />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users/create" 
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <UserForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users/:id" 
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <UserForm />
            </ProtectedRoute>
          } 
        />

        {/* Routes Reservations */}
        <Route 
          path="/reservations" 
          element={
            <ProtectedRoute>
              <Reservations />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reservations/create" 
          element={
            <ProtectedRoute>
              <ReservationForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reservations/:id" 
          element={
            <ProtectedRoute>
              <ReservationForm />
            </ProtectedRoute>
          } 
        />

        {/* Route Login non protégée */}
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </Router>
  );
}

export default App;