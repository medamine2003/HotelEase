<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Reservation;
use App\Entity\Chambre;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Psr\Log\LoggerInterface;

class ReservationStateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        private LoggerInterface $logger
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Reservation) {
            return $data;
        }

        // Log de sécurité pour traçabilité RGPD
        $user = $this->security->getUser();
        $this->logger->info('Opération sur Réservation', [
            'operation' => $operation::class,
            'user_id' => $user?->getId(),
            'user_email' => $user?->getEmail(),
            'reservation_id' => $data->getId(),
            'client_id' => $data->getClient()?->getId(),
            'chambre_id' => $data->getChambre()?->getId(),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'timestamp' => new \DateTime()
        ]);

        return match (true) {
            $operation instanceof \ApiPlatform\Metadata\Post => $this->handleCreate($data, $operation, $uriVariables, $context),
            $operation instanceof \ApiPlatform\Metadata\Put => $this->handleUpdate($data, $operation, $uriVariables, $context),
            $operation instanceof \ApiPlatform\Metadata\Patch => $this->handlePatch($data, $operation, $uriVariables, $context),
            $operation instanceof \ApiPlatform\Metadata\Delete => $this->handleDelete($data, $operation, $uriVariables, $context),
            default => $data
        };
    }

    private function handleCreate(Reservation $reservation, Operation $operation, array $uriVariables, array $context): Reservation
    {
        // Validation de sécurité supplémentaire
        $this->validateReservationData($reservation);
        
        // Vérification disponibilité de la chambre
        if ($this->isChambreOccupied($reservation->getChambre(), $reservation->getDateDebut(), $reservation->getDateFin())) {
            $this->logger->warning('Tentative de réservation sur chambre occupée', [
                'chambre_id' => $reservation->getChambre()->getId(),
                'date_debut' => $reservation->getDateDebut()->format('Y-m-d H:i:s'),
                'date_fin' => $reservation->getDateFin()->format('Y-m-d H:i:s'),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Cette chambre n\'est pas disponible pour les dates sélectionnées');
        }

        // Assainissement final des données
        $this->sanitizeReservationData($reservation);

        // Définir le créateur automatiquement
        if (!$reservation->getCreateur()) {
            $reservation->setCreateur($this->security->getUser());
        }
        $reservation->setMontantTotal($reservation->getMontantBase());
        // Persistance
        $this->entityManager->persist($reservation);
        $this->entityManager->flush();

        // Log de succès avec données RGPD
        $this->logger->info('Réservation créée avec succès', [
            'reservation_id' => $reservation->getId(),
            'client_id' => $reservation->getClient()->getId(),
            'chambre_numero' => $reservation->getChambre()->getNumero(),
            'date_debut' => $reservation->getDateDebut()->format('Y-m-d H:i:s'),
            'date_fin' => $reservation->getDateFin()->format('Y-m-d H:i:s'),
            'montant_total' => $reservation->getMontantTotal(),
            'montant_base' => $reservation->getMontantBase(),
            'user_id' => $this->security->getUser()?->getId()
        ]);

        return $reservation;
    }

    private function handleUpdate(Reservation $reservation, Operation $operation, array $uriVariables, array $context): Reservation
    {
        // Récupération de l'entité originale pour audit
        $originalReservation = $this->entityManager->find(Reservation::class, $reservation->getId());
        
        if (!$originalReservation) {
            throw new BadRequestException('Réservation introuvable');
        }

        // Vérification du changement de chambre ou dates
        $chambreChanged = $originalReservation->getChambre()->getId() !== $reservation->getChambre()->getId();
        $datesChanged = $originalReservation->getDateDebut() != $reservation->getDateDebut() || 
                       $originalReservation->getDateFin() != $reservation->getDateFin();
        
        if ($chambreChanged || $datesChanged) {
            if ($this->isChambreOccupied($reservation->getChambre(), $reservation->getDateDebut(), $reservation->getDateFin(), $reservation->getId())) {
                $this->logger->warning('Tentative de modification vers période occupée', [
                    'reservation_id' => $reservation->getId(),
                    'old_chambre_id' => $originalReservation->getChambre()->getId(),
                    'new_chambre_id' => $reservation->getChambre()->getId(),
                    'new_date_debut' => $reservation->getDateDebut()->format('Y-m-d H:i:s'),
                    'new_date_fin' => $reservation->getDateFin()->format('Y-m-d H:i:s'),
                    'user_id' => $this->security->getUser()?->getId()
                ]);
                throw new BadRequestException('Cette chambre n\'est pas disponible pour les nouvelles dates');
            }
        }

        // Validation et assainissement
        $this->validateReservationData($reservation);
        $this->sanitizeReservationData($reservation);

        // Persistance
        $this->entityManager->persist($reservation);
        $this->entityManager->flush();

        // Log des changements pour audit RGPD
        $this->logReservationChanges($originalReservation, $reservation);

        return $reservation;
    }

    private function handlePatch(Reservation $reservation, Operation $operation, array $uriVariables, array $context): Reservation
    {
        // Similaire à handleUpdate mais pour modifications partielles
        return $this->handleUpdate($reservation, $operation, $uriVariables, $context);
    }

    private function handleDelete(Reservation $reservation, Operation $operation, array $uriVariables, array $context): void
    {
        // Vérification avant suppression - si la réservation a des paiements
        if ($this->hasPayments($reservation)) {
            $this->logger->warning('Tentative de suppression de réservation avec paiements', [
                'reservation_id' => $reservation->getId(),
                'client_id' => $reservation->getClient()->getId(),
                'montant_paye' => $reservation->getMontantPaye(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Impossible de supprimer une réservation avec des paiements');
        }

        // Log avant suppression pour audit RGPD
        $this->logger->info('Suppression de réservation', [
            'reservation_id' => $reservation->getId(),
            'client_id' => $reservation->getClient()->getId(),
            'chambre_numero' => $reservation->getChambre()->getNumero(),
            'date_debut' => $reservation->getDateDebut()->format('Y-m-d H:i:s'),
            'date_fin' => $reservation->getDateFin()->format('Y-m-d H:i:s'),
            'statut' => $reservation->getStatut(),
            'user_id' => $this->security->getUser()?->getId()
        ]);

        // Suppression
        $this->entityManager->remove($reservation);
        $this->entityManager->flush();
    }

    private function validateReservationData(Reservation $reservation): void
    {
        // Validations de sécurité supplémentaires
        
        // Vérification des dates
        if ($reservation->getDateDebut() && $reservation->getDateFin()) {
            $now = new \DateTime();
            $dateDebut = $reservation->getDateDebut();
            $dateFin = $reservation->getDateFin();
            
            // Date de début ne peut pas être dans le passé (sauf pour les admins)
            if (!$this->security->isGranted('ROLE_ADMIN') && $dateDebut < $now->setTime(0, 0, 0)) {
                throw new BadRequestException('La date de début ne peut pas être dans le passé');
            }
            
            // Date de fin doit être après la date de début
            if ($dateFin <= $dateDebut) {
                throw new BadRequestException('La date de fin doit être postérieure à la date de début');
            }
            
            // Durée maximale de 365 jours
            $duree = $dateDebut->diff($dateFin)->days;
            if ($duree > 365) {
                throw new BadRequestException('La durée de réservation ne peut pas dépasser 365 jours');
            }
        }

        // Vérification montant base
        

        // Vérification statut
        $statutsValides = ['confirmee', 'en_attente', 'annulee', 'terminee', 'en_cours'];
        if ($reservation->getStatut() && !in_array($reservation->getStatut(), $statutsValides, true)) {
            throw new BadRequestException('Statut de réservation non valide');
        }

        // Vérification que la chambre existe et est disponible
        if ($reservation->getChambre() && $reservation->getChambre()->getEtat() === 'hors_service') {
            throw new BadRequestException('Cette chambre est hors service');
        }
    }

    private function sanitizeReservationData(Reservation $reservation): void
    {
        // Assainissement supplémentaire au niveau métier
        
        // Normalisation du statut
        if ($reservation->getStatut()) {
            $statut = strtolower(trim($reservation->getStatut()));
            $reservation->setStatut($statut);
        }

        // Normalisation du montant base - s'assurer du format avec 2 décimales
        
    }

    private function isChambreOccupied(Chambre $chambre, \DateTimeInterface $dateDebut, \DateTimeInterface $dateFin, ?int $excludeReservationId = null): bool
    {
        $qb = $this->entityManager->getRepository(Reservation::class)
            ->createQueryBuilder('r')
            ->where('r.chambre = :chambre')
            ->andWhere('r.statut != :statut_annulee')
            ->andWhere('(
                (r.dateDebut <= :date_debut AND r.dateFin > :date_debut) OR
                (r.dateDebut < :date_fin AND r.dateFin >= :date_fin) OR
                (r.dateDebut >= :date_debut AND r.dateFin <= :date_fin)
            )')
            ->setParameter('chambre', $chambre)
            ->setParameter('statut_annulee', 'annulee')
            ->setParameter('date_debut', $dateDebut)
            ->setParameter('date_fin', $dateFin);

        if ($excludeReservationId) {
            $qb->andWhere('r.id != :exclude_id')
               ->setParameter('exclude_id', $excludeReservationId);
        }

        return $qb->getQuery()->getOneOrNullResult() !== null;
    }

    private function hasPayments(Reservation $reservation): bool
    {
        return $reservation->getPaiements()->count() > 0;
    }

    private function logReservationChanges(Reservation $original, Reservation $updated): void
    {
        $changes = [];
        
        if ($original->getDateDebut() != $updated->getDateDebut()) {
            $changes['date_debut'] = [
                'old' => $original->getDateDebut()->format('Y-m-d H:i:s'), 
                'new' => $updated->getDateDebut()->format('Y-m-d H:i:s')
            ];
        }
        
        if ($original->getDateFin() != $updated->getDateFin()) {
            $changes['date_fin'] = [
                'old' => $original->getDateFin()->format('Y-m-d H:i:s'), 
                'new' => $updated->getDateFin()->format('Y-m-d H:i:s')
            ];
        }
        
        if ($original->getStatut() !== $updated->getStatut()) {
            $changes['statut'] = ['old' => $original->getStatut(), 'new' => $updated->getStatut()];
        }

        if ($original->getMontantBase() !== $updated->getMontantBase()) {
            $changes['montant_base'] = ['old' => $original->getMontantBase(), 'new' => $updated->getMontantBase()];
        }

        if ($original->getChambre()->getId() !== $updated->getChambre()->getId()) {
            $changes['chambre'] = [
                'old' => $original->getChambre()->getNumero(), 
                'new' => $updated->getChambre()->getNumero()
            ];
        }

        if (!empty($changes)) {
            $this->logger->info('Réservation modifiée', [
                'reservation_id' => $updated->getId(),
                'client_id' => $updated->getClient()->getId(),
                'changes' => $changes,
                'montant_total_calcule' => $updated->getMontantTotal(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
        }
    }
}