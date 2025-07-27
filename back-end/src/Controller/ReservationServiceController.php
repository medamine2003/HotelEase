<?php

namespace App\Controller;

use App\Entity\Reservation;
use App\Entity\Service;
use App\Entity\ReservationService;
use App\Repository\ReservationRepository;
use App\Repository\ServiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/reservations')]
class ReservationServiceController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private ReservationRepository $reservationRepository,
        private ServiceRepository $serviceRepository
    ) {}

    /**
     * Ajouter un service à une réservation
     */
    #[Route('/{id}/add-service', name: 'add_service_to_reservation', methods: ['POST'])]
    public function addService(
        int $id,
        Request $request
    ): JsonResponse {
        try {
            // Récupérer la réservation
            $reservation = $this->reservationRepository->find($id);
            if (!$reservation) {
                return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
            }

            // Décoder les données JSON
            $data = json_decode($request->getContent(), true);
            if (!$data || !isset($data['serviceId'])) {
                return $this->json(['error' => 'serviceId requis'], Response::HTTP_BAD_REQUEST);
            }

            // Récupérer le service
            $service = $this->serviceRepository->find($data['serviceId']);
            if (!$service) {
                return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier si le service n'est pas déjà ajouté
            if ($reservation->hasService($service)) {
                return $this->json(['error' => 'Ce service est déjà ajouté à la réservation'], Response::HTTP_CONFLICT);
            }

            // Créer la relation ReservationService
            $reservationService = new ReservationService();
            $reservationService->setReservation($reservation);
            $reservationService->setService($service);
            
            // Récupérer quantité depuis la requête (défaut: 1)
            $quantite = $data['quantite'] ?? 1;
            $reservationService->setQuantite((int) $quantite);
            
            // Figer le prix au moment de l'ajout
            $reservationService->setPrixUnitaire($service->getPrixService());

            // Persister
            $this->entityManager->persist($reservationService);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Service ajouté avec succès',
                'data' => [
                    'id' => $reservationService->getId(),
                    'service' => [
                        'id' => $service->getId(),
                        'nom' => $service->getNom(),
                        'prix' => $service->getPrixService()
                    ],
                    'quantite' => $reservationService->getQuantite(),
                    'prixUnitaire' => $reservationService->getPrixUnitaire(),
                    'sousTotal' => $reservationService->getSousTotal(),
                    'dateAjout' => $reservationService->getDateAjout()->format('Y-m-d H:i:s')
                ]
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Erreur lors de l\'ajout du service: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprimer un service d'une réservation
     */
    #[Route('/{reservationId}/remove-service/{serviceId}', name: 'remove_service_from_reservation', methods: ['DELETE'])]
    public function removeService(
        int $reservationId,
        int $serviceId
    ): JsonResponse {
        try {
            // Vérifier que la réservation existe
            $reservation = $this->reservationRepository->find($reservationId);
            if (!$reservation) {
                return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
            }

            // Chercher la relation ReservationService
            $reservationService = $this->entityManager->getRepository(ReservationService::class)
                ->findOneBy([
                    'reservation' => $reservationId,
                    'service' => $serviceId
                ]);

            if (!$reservationService) {
                return $this->json(['error' => 'Service non trouvé pour cette réservation'], Response::HTTP_NOT_FOUND);
            }

            // Supprimer la relation
            $this->entityManager->remove($reservationService);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Service supprimé avec succès'
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Erreur lors de la suppression du service: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Mettre à jour la quantité d'un service
     */
    #[Route('/{reservationId}/update-service/{serviceId}', name: 'update_service_quantity', methods: ['PATCH'])]
    public function updateServiceQuantity(
        int $reservationId,
        int $serviceId,
        Request $request
    ): JsonResponse {
        try {
            // Chercher la relation ReservationService
            $reservationService = $this->entityManager->getRepository(ReservationService::class)
                ->findOneBy([
                    'reservation' => $reservationId,
                    'service' => $serviceId
                ]);

            if (!$reservationService) {
                return $this->json(['error' => 'Service non trouvé pour cette réservation'], Response::HTTP_NOT_FOUND);
            }

            // Décoder les données
            $data = json_decode($request->getContent(), true);
            if (!$data || !isset($data['quantite'])) {
                return $this->json(['error' => 'quantite requise'], Response::HTTP_BAD_REQUEST);
            }

            $nouvelleQuantite = (int) $data['quantite'];
            if ($nouvelleQuantite < 1) {
                return $this->json(['error' => 'La quantité doit être supérieure à 0'], Response::HTTP_BAD_REQUEST);
            }

            // Mettre à jour la quantité
            $reservationService->setQuantite($nouvelleQuantite);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Quantité mise à jour',
                'data' => [
                    'quantite' => $reservationService->getQuantite(),
                    'sousTotal' => $reservationService->getSousTotal()
                ]
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lister les services d'une réservation
     */
    #[Route('/{id}/list-services', name: 'get_reservation_services', methods: ['GET'])]
    public function getReservationServices(int $id): JsonResponse
    {
        try {
            $reservation = $this->reservationRepository->find($id);
            if (!$reservation) {
                return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
            }

            return $this->json([
                'reservationId' => $reservation->getId(),
                'services' => $reservation->getServices(),
                'totalServices' => $reservation->getTotalServices(),
                'nombreServices' => $reservation->getNombreServices(),
                'montantTotalAvecServices' => $reservation->getMontantTotalAvecServices()
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Erreur lors de la récupération: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}