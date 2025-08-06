// ce composant est utilisé pour la protection des routes 
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';

export function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  
  if (loading) 
    return <div>Chargement...</div>;

  if (!user) 
    return <Navigate to="/login" replace />;

  
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Accès refusé</Alert.Heading>
          <p>
            Cette page est réservée aux <strong>
              {requiredRole === 'ROLE_ADMIN' ? 'Administrateurs' : 'Réceptionnistes'}
            </strong>.
          </p>
          <p className="mb-0">
            Votre rôle actuel : <strong>
              {user.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Réceptionniste'}
            </strong>
          </p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger"
              onClick={() => window.history.back()}
            >
              Retour
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return children;
}