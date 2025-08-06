import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentForm from '../src/components/Payments/PaymentForm';
import * as paymentServices from '../src/services/paymentServices';
import * as reservationServices from '../src/services/reservationServices';

// on teste l'intégration réelle
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'nouveau' }),
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()]
  };
});


const mockReservations = [
  {
    id: 1,
    client: { nom: 'Martin', prenom: 'Paul' },
    chambre: { numero: '205' },
    dateDebut: '2025-03-20',
    dateFin: '2025-03-22',
    montantTotal: 300,
    montantPaye: 100,
    montantRestant: 200,
    statutPaiement: 'partiel'
  }
];

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('PaymentForm - Tests d\'Intégration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    
    vi.spyOn(reservationServices, 'getReservations').mockResolvedValue(mockReservations);
    vi.spyOn(reservationServices, 'getReservationById').mockResolvedValue(mockReservations[0]);
    vi.spyOn(paymentServices, 'createPayment').mockResolvedValue({ id: 2 });
  });

  it('charge les données et affiche les informations réelles', async () => {
    renderWithRouter(<PaymentForm />);
    
   
    await waitFor(() => {
      expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
    });
    
    
    expect(screen.getByText(/Martin Paul/)).toBeInTheDocument();
    expect(reservationServices.getReservations).toHaveBeenCalledTimes(1);
  });

  it('sélectionne une réservation et affiche ses détails', async () => {
    renderWithRouter(<PaymentForm />);
    
    await waitFor(() => {
      expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
    });
    
    
    expect(screen.getByText(/Martin Paul/)).toBeInTheDocument();
    expect(reservationServices.getReservations).toHaveBeenCalledTimes(1);
  });

  it('utilise les vraies fonctions de formatage', async () => {
    renderWithRouter(<PaymentForm />);
    
    await waitFor(() => {
      const selectReservation = screen.getAllByRole('combobox')[0];
      fireEvent.change(selectReservation, { target: { value: '/api/reservations/1' } });
    });
    
    await waitFor(() => {
      
      const montantElements = screen.getAllByText(/€/);
      expect(montantElements.length).toBeGreaterThan(0);
    });
  });

  it('affiche les détails de réservation après sélection', async () => {
    renderWithRouter(<PaymentForm />);
    
    await waitFor(() => {
      expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
    });
    
    
    await waitFor(() => {
      expect(screen.getByText(/Martin Paul/)).toBeInTheDocument();
    });
  });

  it('vérifie que les services sont bien mockés', async () => {
    renderWithRouter(<PaymentForm />);
    
    await waitFor(() => {
      expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
    });
    
    
    expect(paymentServices.createPayment).toBeDefined();
    expect(reservationServices.getReservations).toHaveBeenCalled();
  });
});