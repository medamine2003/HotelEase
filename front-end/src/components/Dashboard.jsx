// la page principale de l'application elle contient les informations les plus pertinentes.
// this is the main page of the application where statistics and main infos are seen
import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Spinner, Badge } from 'react-bootstrap';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  FaChartPie, 
  FaCalendarWeek, 
  FaHotel, 
  FaClipboardList, 
  FaSearch, 
  FaCreditCard, 
  FaCalendarAlt, 
  FaUsers, 
  FaHome,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle 
} from 'react-icons/fa';
import NavigationBar from "./CommonComponents/NavigationBar";
import SearchBar from './CommonComponents/SearchBar';
import ErrorDisplay from './CommonComponents/ErrorDisplay';
import { getPayments, formatAmount } from '../services/paymentServices';
import { getReservations } from '../services/reservationServices';
import { getRooms } from '../services/roomServices';

function Dashboard() {
  const [payments, setPayments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    payments: null,
    reservations: null,
    rooms: null,
    global: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setErrors({ payments: null, reservations: null, rooms: null, global: null });
        
        let paymentsData = [];
        let reservationsData = [];
        let roomsData = [];
        
        // Chargement des paiements
        try {
          paymentsData = await getPayments();
        } catch (paymentError) {
          console.error('Erreur lors du chargement des paiements:', paymentError);
          setErrors(prev => ({ ...prev, payments: paymentError }));
          paymentsData = [];
        }
        
        // Chargement des réservations
        try {
          reservationsData = await getReservations();
        } catch (reservationError) {
          console.error('Erreur lors du chargement des réservations:', reservationError);
          setErrors(prev => ({ ...prev, reservations: reservationError }));
          reservationsData = [];
        }

        // Chargement des chambres
        try {
          roomsData = await getRooms();
        } catch (roomError) {
          console.error('Erreur lors du chargement des chambres:', roomError);
          setErrors(prev => ({ ...prev, rooms: roomError }));
          roomsData = [];
        }

        const validPayments = Array.isArray(paymentsData) ? paymentsData : [];
        const validReservations = Array.isArray(reservationsData) ? reservationsData : [];
        const validRooms = Array.isArray(roomsData) ? roomsData : [];
        
        setPayments(validPayments);
        setReservations(validReservations);
        setRooms(validRooms);
        
      } catch (err) {
        console.error('Erreur globale du dashboard:', err);
        setErrors(prev => ({ ...prev, global: err }));
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const dashboardFilters = [
    {
      key: 'domain',
      type: 'select',
      label: 'Domaine',
      defaultOption: 'Tous les domaines',
      options: [
       { value: 'paiements', label: 'Paiements' },
       { value: 'reservations', label: 'Réservations' },
       { value: 'clients', label: 'Clients' },
       { value: 'chambres', label: 'Chambres' }
      ]
    }
  ];

  const filteredData = useMemo(() => {
    const safePayments = Array.isArray(payments) ? payments : [];
    const safeReservations = Array.isArray(reservations) ? reservations : [];
    const term = searchTerm.toLowerCase().trim();
    const domain = filterValues.domain;

    if (!domain || domain === 'paiements') {
      let filtered = [...safePayments];
      if (term) {
        filtered = filtered.filter(payment =>
          payment?.reservation?.client?.nom?.toLowerCase().includes(term) ||
          payment?.reservation?.client?.prenom?.toLowerCase().includes(term) ||
          payment?.methodePaiement?.toLowerCase().includes(term) ||
          payment?.numeroTransaction?.toLowerCase().includes(term) ||
          payment?.commentaire?.toLowerCase().includes(term) ||
          payment?.montant?.toString().includes(term)
        );
      }
      return { type: 'paiements', data: filtered };
    }

    switch (domain) {
      case 'reservations': {
        let filtered = [...safeReservations];
        if (term) {
          filtered = filtered.filter(res =>
            res?.client?.nom?.toLowerCase().includes(term) ||
            res?.client?.prenom?.toLowerCase().includes(term) ||
            res?.chambre?.numero?.toString().includes(term) ||
            res?.id?.toString().includes(term)
          );
        }
        return { type: 'reservations', data: filtered };
      }

      case 'clients': {
        let filteredClients = [];
        if (safeReservations.length > 0) {
          const clientsMap = new Map();
          safeReservations.forEach(res => {
            if (res?.client) {
              clientsMap.set(res.client.id, res.client);
            }
          });
          filteredClients = Array.from(clientsMap.values());
          if (term) {
            filteredClients = filteredClients.filter(client =>
              client?.nom?.toLowerCase().includes(term) ||
              client?.prenom?.toLowerCase().includes(term) ||
              client?.email?.toLowerCase().includes(term) ||
              client?.telephone?.includes(term)
            );
          }
        }
        return { type: 'clients', data: filteredClients };
      }

      case 'chambres': {
        let filteredChambres = [];
        if (safeReservations.length > 0) {
          const chambresMap = new Map();
          safeReservations.forEach(res => {
            if (res?.chambre) {
              chambresMap.set(res.chambre.id, res.chambre);
            }
          });
          filteredChambres = Array.from(chambresMap.values());
          if (term) {
            filteredChambres = filteredChambres.filter(chambre =>
              chambre?.numero?.toString().includes(term) ||
              chambre?.type?.toLowerCase().includes(term) ||
              chambre?.prix?.toString().includes(term)
            );
          }
        }
        return { type: 'chambres', data: filteredChambres };
      }

      default:
        return { type: 'paiements', data: safePayments };
    }
  }, [payments, reservations, searchTerm, filterValues]);

  // Camembert des méthodes de paiement (existant)
  const pieData = useMemo(() => {
    const safePayments = Array.isArray(payments) ? payments : [];
    
    if (safePayments.length === 0) {
      return [];
    }

    const methodesCount = {};
    
    safePayments.forEach((payment) => {
      if (payment?.methodePaiement) {
        let methodeLabel;
        switch (payment.methodePaiement) {
          case 'carte_bancaire': methodeLabel = 'Carte bancaire'; break;
          case 'especes': methodeLabel = 'Espèces'; break;
          case 'stripe': methodeLabel = 'Paiement en ligne'; break;
          case 'virement':
          case 'cheque':
          case 'payPal': methodeLabel = 'Autres'; break;
          default: methodeLabel = 'Autres';
        }
        
        const montant = parseFloat(payment.montant) || 0;
        methodesCount[methodeLabel] = (methodesCount[methodeLabel] || 0) + montant;
      }
    });

    return Object.entries(methodesCount).map(([methode, montant]) => {
      const count = safePayments.filter(p => {
        let methodeLabel;
        switch (p?.methodePaiement) {
          case 'carte_bancaire': methodeLabel = 'Carte bancaire'; break;
          case 'especes': methodeLabel = 'Espèces'; break;
          case 'stripe': methodeLabel = 'Paiement en ligne'; break;
          default: methodeLabel = 'Autres';
        }
        return methodeLabel === methode;
      }).length;
      
      return {
        name: methode,
        value: montant,
        count
      };
    });
  }, [payments]);

  // Nouvelles données pour les fonctionnalités ajoutées
  
  // 1. Réservations de la semaine prochaine
  const nextWeekReservations = useMemo(() => {
    const safeReservations = Array.isArray(reservations) ? reservations : [];
    const today = new Date();
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + 1);
    const nextWeekEnd = new Date(today);
    nextWeekEnd.setDate(today.getDate() + 7);

    return safeReservations.filter(reservation => {
      if (!reservation?.dateDebut) return false;
      const arrivalDate = new Date(reservation.dateDebut);
      return arrivalDate >= nextWeekStart && arrivalDate <= nextWeekEnd;
    });
  }, [reservations]);

  // 2. État des chambres (camembert)
  const roomStatusData = useMemo(() => {
    const safeReservations = Array.isArray(reservations) ? reservations : [];
    const safeRooms = Array.isArray(rooms) ? rooms : [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (safeRooms.length === 0) {
      return [];
    }

    const statusCount = {
      'Disponible': 0,
      'Occupée': 0,
      'Maintenance': 0,
      'Hors service': 0
    };

    safeRooms.forEach(room => {
      // Vérifier si la chambre est réellement occupée aujourd'hui
      const todayReservation = safeReservations.find(res => {
        if (!res?.dateDebut || !res?.dateFin) return false;
        const arrival = new Date(res.dateDebut).toISOString().split('T')[0];
        const departure = new Date(res.dateFin).toISOString().split('T')[0];
        return res.chambre?.id === room.id && 
               arrival <= todayStr && 
               departure >= todayStr;
      });

      if (todayReservation) {
        // Chambre occupée par une réservation active
        statusCount['Occupée']++;
      } else {
        // Utiliser l'état de la chambre depuis le backend
        switch (room.etat) {
          case 'disponible':
            statusCount['Disponible']++;
            break;
          case 'occupee':
            statusCount['Occupée']++;
            break;
          case 'maintenance':
            statusCount['Maintenance']++;
            break;
          case 'hors_service':
            statusCount['Hors service']++;
            break;
          default:
            statusCount['Disponible']++; // Par défaut
        }
      }
    });

    return Object.entries(statusCount)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count,
        count
      }));
  }, [reservations, rooms]);

  // 3. Planning du jour (arrivées/départs)
  const todaySchedule = useMemo(() => {
    const safeReservations = Array.isArray(reservations) ? reservations : [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const arrivals = safeReservations.filter(res => {
      if (!res?.dateDebut) return false;
      const arrival = new Date(res.dateDebut).toISOString().split('T')[0];
      return arrival === todayStr;
    });

    const departures = safeReservations.filter(res => {
      if (!res?.dateFin) return false;
      const departure = new Date(res.dateFin).toISOString().split('T')[0];
      return departure === todayStr;
    });

    return { arrivals, departures };
  }, [reservations]);

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterValues({});
  };

  // Fonction pour supprimer une erreur spécifique
  const dismissError = (errorType) => {
    setErrors(prev => ({ ...prev, [errorType]: null }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const ROOM_COLORS = ['#059669', '#dc2626', '#d97706', '#64748b']; // Vert, Rouge, Orange, Gris

  if (loading) {
    return (
      <>
        <NavigationBar />
        <Container className="mt-4 text-center">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Chargement du dashboard...</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavigationBar />
      <Container fluid className="mt-4">
        <h1 className="mb-4" style={{color: '#1e293b'}}>
          <FaChartPie className="me-2" style={{color: '#3b82f6'}} />Tableau de bord
        </h1>

       
        <ErrorDisplay 
          error={errors.global} 
          title="Erreur générale du dashboard"
          onDismiss={() => dismissError('global')}
        />

        <ErrorDisplay 
          error={errors.payments} 
          title="Erreur lors du chargement des paiements"
          variant="warning"
          onDismiss={() => dismissError('payments')}
        />

        <ErrorDisplay 
          error={errors.reservations} 
          title="Erreur lors du chargement des réservations"
          variant="warning"
          onDismiss={() => dismissError('reservations')}
        />

        <ErrorDisplay 
          error={errors.rooms} 
          title="Erreur lors du chargement des chambres"
          variant="warning"
          onDismiss={() => dismissError('rooms')}
        />

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Recherche globale : clients, réservations, chambres, paiements..."
          filters={dashboardFilters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          ariaLabel="Recherche globale dans tous les domaines"
        />
      <Row>
       <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">
                  <FaSearch className="me-2" style={{color: '#06b6d4'}} />Résultats de recherche 
                  {filterValues.domain && ` - ${dashboardFilters[0].options.find(opt => opt.value === filterValues.domain)?.label || 'Tous'}`}
                </h5>
                <small className="text-muted">
                  {filteredData.data.length} résultat{filteredData.data.length > 1 ? 's' : ''} trouvé{filteredData.data.length > 1 ? 's' : ''}
                </small>
              </Card.Header>
              <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredData.data.length > 0 ? (
                  <div>
                    <table className="table table-sm table-bordered w-100 align-middle">
                      <thead>
                        <tr>
                          {filteredData.type === 'paiements' && (
                            <>
                              <th>Date</th>
                              <th>Client</th>
                              <th>Montant</th>
                              <th>Méthode</th>
                            </>
                          )}
                          {filteredData.type === 'reservations' && (
                            <>
                              <th>ID</th>
                              <th>Client</th>
                              <th>Chambre</th>
                              <th>Montant</th>
                            </>
                          )}
                          {filteredData.type === 'clients' && (
                            <>
                              <th>Nom</th>
                              <th>Prénom</th>
                              <th>Email</th>
                            </>
                          )}
                          {filteredData.type === 'chambres' && (
                            <>
                              <th>Numéro</th>
                              <th>Type</th>
                              <th>Prix</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.type === 'paiements' && filteredData.data.slice(0, 10).map(payment => (
                          <tr key={payment?.id}>
                            <td>{payment?.datePaiement ? new Date(payment.datePaiement).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="text-break">{payment?.reservation?.client?.nom} {payment?.reservation?.client?.prenom}</td>
                            <td className={payment?.typePaiement === 'remboursement' ? '' : ''} style={{color: payment?.typePaiement === 'remboursement' ? '#dc2626' : '#059669'}}>
                              {payment?.typePaiement === 'remboursement' ? '-' : '+'}
                              {payment?.montant ? formatAmount(payment.montant) : '0€'}
                            </td>
                            <td>
                              <span className="badge" style={{backgroundColor: '#64748b', color: 'white'}}>
                                {payment?.methodePaiement === 'carte_bancaire' ? 'CB' : 
                                 payment?.methodePaiement === 'especes' ? 'Espèces' :
                                 payment?.methodePaiement === 'stripe' ? 'En ligne' :
                                 payment?.methodePaiement || 'Autres'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {filteredData.type === 'reservations' && filteredData.data.slice(0, 10).map(reservation => (
                          <tr key={reservation?.id}>
                            <td>#{reservation?.id}</td>
                            <td className="text-break">{reservation?.client?.nom} {reservation?.client?.prenom}</td>
                            <td>#{reservation?.chambre?.numero}</td>
                            <td>{reservation?.montantTotal ? formatAmount(reservation.montantTotal) : '-'}</td>
                          </tr>
                        ))}
                        {filteredData.type === 'clients' && filteredData.data.slice(0, 10).map(client => (
                          <tr key={client?.id}>
                            <td className="text-break">{client?.nom || '-'}</td>
                            <td className="text-break">{client?.prenom || '-'}</td>
                            <td className="text-break">{client?.email || '-'}</td>
                          </tr>
                        ))}
                        {filteredData.type === 'chambres' && filteredData.data.slice(0, 10).map(chambre => (
                          <tr key={chambre?.id}>
                            <td>#{chambre?.numero}</td>
                            <td>{chambre?.type || '-'}</td>
                            <td>{chambre?.prix ? formatAmount(chambre.prix) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted">
                    <p>{searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Utilisez la recherche pour explorer vos données'}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0">
                  <FaClipboardList className="me-2" style={{color: '#8b5cf6'}} />Planning du jour
                </h6>
                <small className="text-muted">{new Date().toLocaleDateString('fr-FR')}</small>
              </Card.Header>
              <Card.Body>
                {errors.reservations ? (
                  <div className="text-center text-warning">
                    <p><FaExclamationTriangle className="me-2" style={{color: '#d97706'}} />Impossible de charger le planning</p>
                    <small>Erreur lors du chargement des réservations</small>
                  </div>
                ) : (
                  <Row>
                    <Col md={6}>
                      <h6 style={{color: '#059669'}}>
                        <FaCheckCircle className="me-2" />Arrivées ({todaySchedule.arrivals.length})
                      </h6>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {todaySchedule.arrivals.length > 0 ? (
                          todaySchedule.arrivals.map(arrival => (
                            <div key={arrival.id} className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                              <div>
                                <strong>{arrival.client?.nom} {arrival.client?.prenom}</strong>
                                <br />
                                <small>Ch. #{arrival.chambre?.numero}</small>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted small">Aucune arrivée prévue</p>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <h6 style={{color: '#dc2626'}}>
                        <FaTimesCircle className="me-2" />Départs ({todaySchedule.departures.length})
                      </h6>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {todaySchedule.departures.length > 0 ? (
                          todaySchedule.departures.map(departure => (
                            <div key={departure.id} className="d-flex justify-content-between mb-2 p-2 bg-light rounded">
                              <div>
                                <strong>{departure.client?.nom} {departure.client?.prenom}</strong>
                                <br />
                                <small>Ch. #{departure.chambre?.numero}</small>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted small">Aucun départ prévu</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
          </Row>
        <Row>
          <Col lg={3} md={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0">
                  <FaCalendarWeek className="me-2" style={{color: '#3b82f6'}} />Révisions
                </h6>
              </Card.Header>
              <Card.Body className="text-center">
                <div className="display-4 mb-2" style={{color: '#2563eb'}}>{nextWeekReservations.length}</div>
                <p className="mb-0">Réservations prévues</p>
                <small className="text-muted">Semaine prochaine</small>
                {errors.reservations && (
                  <div className="mt-2">
                    <Badge bg="warning">Données incomplètes</Badge>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0">
                  <FaHotel className="me-2" style={{color: '#10b981'}} />État des chambres
                </h6>
              </Card.Header>
              <Card.Body>
                {errors.rooms || errors.reservations ? (
                  <div className="text-center text-warning">
                    <p><FaExclamationTriangle className="me-2" style={{color: '#d97706'}} />Erreur de chargement</p>
                    <small>Les données des chambres ne sont pas disponibles</small>
                  </div>
                ) : roomStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={roomStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {roomStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} chambre${value > 1 ? 's' : ''}`, 'Nombre']} />
                      <Legend 
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, fontSize: '12px' }}>
                            {value} ({entry.payload.value})
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted">
                    <p>Aucune donnée de chambre</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">
                  <FaChartPie className="me-2" style={{color: '#f59e0b'}} />Répartition par méthode de paiement
                </h5>
                <small className="text-muted">{payments.length} paiement{payments.length > 1 ? 's' : ''} au total</small>
              </Card.Header>
              <Card.Body>
                {errors.payments ? (
                  <div className="text-center text-warning d-flex flex-column justify-content-center" style={{ height: '300px' }}>
                    <div className="mb-3">
                      <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                    </div>
                    <h6>Erreur de chargement des paiements</h6>
                    <p className="small">Impossible d'afficher les statistiques de paiement</p>
                  </div>
                ) : pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${formatAmount(value)} (${props.payload.count} paiement${props.payload.count > 1 ? 's' : ''})`,
                          'Montant total'
                        ]}
                        contentStyle={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                          color: '#1e293b'
                        }}
                      />
                      <Legend 
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color }}>
                            {value} ({formatAmount(entry.payload.value)})
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted d-flex flex-column justify-content-center" style={{ height: '300px' }}>
                    <div className="mb-3">
                      <i className="bi bi-pie-chart" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                    </div>
                    <h6>Aucun paiement trouvé</h6>
                    <p className="small">Aucune donnée à afficher pour le moment</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>     
          
        </Row>

        
        
          
          
          
        
      </Container>
    </>
  );
}

export default Dashboard;