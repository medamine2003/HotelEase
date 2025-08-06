import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentForm from '../src/components/Payments/PaymentForm';
import * as paymentServices from '../src/services/paymentServices';
import * as reservationServices from '../src/services/reservationServices';

// Mock des services
vi.mock('../../services/paymentServices');
vi.mock('../../services/reservationServices');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'nouveau' }),
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()]
  };
});

// Données de test simples
const mockReservations = [
  {
    id: 1,
    client: { nom: 'Dupont', prenom: 'Jean' },
    montantTotal: 200,
    montantRestant: 150
  }
];

// Wrapper pour le routeur
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('PaymentForm ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock des services
    vi.mocked(reservationServices.getReservations).mockResolvedValue(mockReservations);
    vi.mocked(paymentServices.formatAmount).mockImplementation((amount) => `${amount}€`);
    vi.mocked(paymentServices.createPayment).mockResolvedValue({ id: 1 });
  });

  it('affiche le titre du formulaire', async () => {
    renderWithRouter(<PaymentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Créer un paiement')).toBeInTheDocument();
    });
  });

  it('affiche le bouton de soumission', async () => {
    renderWithRouter(<PaymentForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Enregistrer le paiement')).toBeInTheDocument();
    });
  });

  it('charge les réservations', async () => {
    renderWithRouter(<PaymentForm />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dupont Jean/)).toBeInTheDocument();
    });
    
    expect(reservationServices.getReservations).toHaveBeenCalled();
  });

  it('clique sur le bouton de soumission', async () => {
    renderWithRouter(<PaymentForm />);
    
    await waitFor(() => {
      const submitButton = screen.getByText('Enregistrer le paiement');
      fireEvent.click(submitButton);
      
      // Test que le bouton existe et est cliquable
      expect(submitButton).toBeInTheDocument();
    });
  });

  it('affiche le spinner pendant le chargement', () => {
    // Mock pour simuler le chargement
    vi.mocked(reservationServices.getReservations).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    renderWithRouter(<PaymentForm />);
    
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });
});