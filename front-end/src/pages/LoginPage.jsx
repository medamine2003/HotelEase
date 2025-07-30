import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container, Row, Col, Card, Spinner, Alert, ProgressBar } from "react-bootstrap";
import logo from "../../assets/logo.png";


import { useAuth } from "../hooks/useAuth";

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour le rate limiting
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [maxAttempts] = useState(7); 
  
  const navigate = useNavigate();

  // Timer pour le déblocage
  useEffect(() => {
    let interval;
    if (isBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setAttemptCount(0);
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockTimeRemaining]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return "00:00";
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAttemptsMessage = () => {
    const remaining = maxAttempts - attemptCount;
    if (remaining <= 0) return "";
    
    if (remaining <= 2) {
      return `Attention: Plus que ${remaining} tentative${remaining > 1 ? 's' : ''} avant blocage`;
    } else if (remaining <= 4) {
      return `${remaining} tentatives restantes`;
    }
    return "";
  };

  const getProgressVariant = () => {
    const remaining = maxAttempts - attemptCount;
    if (remaining <= 2) return "danger";
    if (remaining <= 4) return "warning";
    return "info";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSubmitting || isBlocked) return;

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer un email valide.");
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      await login({ email, password });
      setAttemptCount(0);
      navigate("/");
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 429) {
        setIsBlocked(true);
        setAttemptCount(maxAttempts);
        
        let retryAfter = data?.retry_after;
        
        // Gestion de l'objet DateTime de Symfony
        if (retryAfter && typeof retryAfter === 'object' && retryAfter.date) {
          const targetTime = new Date(retryAfter.date + 'Z');
          const currentTime = new Date();
          retryAfter = Math.ceil((targetTime - currentTime) / 1000);
        }
        
        if (typeof retryAfter === 'string') {
          retryAfter = parseInt(retryAfter);
        }
        
        if (!retryAfter || isNaN(retryAfter) || retryAfter <= 0) {
          retryAfter = 15 * 60; // 15 minutes par défaut
        }
        
        setBlockTimeRemaining(retryAfter);
        setError(`Trop de tentatives échouées. Veuillez patienter ${formatTime(retryAfter)} avant de réessayer.`);
      } else if (status === 401) {
        const newCount = attemptCount + 1;
        setAttemptCount(newCount);
        
        if (newCount >= maxAttempts - 2) {
          setError("Email ou mot de passe incorrect. " + getAttemptsMessage());
        } else {
          setError("Email ou mot de passe incorrect.");
        }
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const attemptsMessage = getAttemptsMessage();

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Row>
        <Col >
        <div className="text-center mb-4">
              <img src={logo} alt="Logo" className="w-100" style={{ maxWidth: "120px", height: "auto" }} />
            </div>
          <Card className="shadow p-4 rounded-4">
            
            <Card.Body>
              <h2 className="text-center mb-4">Connexion</h2>

              {/* Message de blocage */}
              {isBlocked && (
                <Alert variant="danger" className="text-center">
                  <h6>Compte verrouillé</h6>
                  <p className="mb-0">
                    <strong>Déblocage dans : {formatTime(blockTimeRemaining)}</strong>
                  </p>
                </Alert>
              )}

              {/* Avertissement progressif */}
              {!isBlocked && attemptsMessage && (
                <Alert variant={getProgressVariant().replace('info', 'warning')} className="text-center">
                  {attemptsMessage}
                </Alert>
              )}

              {/* Barre de progression des tentatives */}
              {attemptCount > 0 && !isBlocked && (
                <div className="mb-3">
                  <small className="text-muted">Tentatives : {attemptCount} / {maxAttempts}</small>
                  <ProgressBar
                    now={(attemptCount / maxAttempts) * 100}
                    variant={getProgressVariant()}
                    className="mb-2"
                    style={{ height: '8px' }}
                  />
                </div>
              )}

              {/* Erreur générale */}
              {error && !isBlocked && (
                <Alert variant="danger" className="text-center">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formBasicEmail" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Entrer votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isBlocked}
                  />
                </Form.Group>

                <Form.Group controlId="formBasicPassword" className="mb-4">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Entrer votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isBlocked}
                  />
                </Form.Group>

                <Button
                  variant={isBlocked ? "secondary" : "primary"}
                  type="submit"
                  className="w-100 rounded-3"
                  disabled={isLoading || isSubmitting || isBlocked}
                >
                  {isBlocked ? (
                    `Bloqué - ${formatTime(blockTimeRemaining)}`
                  ) : isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />{" "}
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>

                {/* Info de sécurité */}
                
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginForm;