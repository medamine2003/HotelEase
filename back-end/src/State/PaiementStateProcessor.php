<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Paiement;
use App\Entity\Reservation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Psr\Log\LoggerInterface;

class PaiementStateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        private LoggerInterface $logger
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Paiement) {
            return $data;
        }

        // Log de sécurité CRITIQUE pour les paiements
        $user = $this->security->getUser();
        $this->logger->critical('Opération FINANCIERE sur Paiement', [
            'operation' => $operation::class,
            'user_id' => $user?->getId(),
            'user_email' => $user?->getEmail(),
            'paiement_id' => $data->getId(),
            'montant' => $data->getMontant(),
            'methode' => $data->getMethodePaiement(),
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

    private function handleCreate(Paiement $paiement, Operation $operation, array $uriVariables, array $context): Paiement
    {
        // Validation de sécurité CRITIQUE pour les finances
        $this->validatePaiementData($paiement);
        
        // Vérification de la réservation si associée
        if ($paiement->getReservation()) {
            $this->validateReservationExists($paiement->getReservation());
        }

        // Assainissement final des données financières
        $this->sanitizePaiementData($paiement);

        // Persistance
        $this->entityManager->persist($paiement);
        $this->entityManager->flush();

        // Log de succès CRITIQUE
        $this->logger->critical('PAIEMENT CREE avec succès', [
            'paiement_id' => $paiement->getId(),
            'montant' => $paiement->getMontant(),
            'methode' => $paiement->getMethodePaiement(),
            'type' => $paiement->getTypePaiement(),
            'reservation_id' => $paiement->getReservation()?->getId(),
            'user_id' => $this->security->getUser()?->getId(),
            'timestamp' => new \DateTime()
        ]);

        return $paiement;
    }

    private function handleUpdate(Paiement $paiement, Operation $operation, array $uriVariables, array $context): Paiement
    {
        // Récupération de l'entité originale pour audit FINANCIER
        $originalPaiement = $this->entityManager->find(Paiement::class, $paiement->getId());
        
        if (!$originalPaiement) {
            throw new BadRequestException('Paiement introuvable');
        }

        // Log des modifications FINANCIERES (CRITIQUE)
        $this->logFinancialChanges($originalPaiement, $paiement);

        // Validation et assainissement
        $this->validatePaiementData($paiement);
        $this->sanitizePaiementData($paiement);

        // Persistance
        $this->entityManager->persist($paiement);
        $this->entityManager->flush();

        return $paiement;
    }

    private function handlePatch(Paiement $paiement, Operation $operation, array $uriVariables, array $context): Paiement
    {
        // Même traitement que l'update pour les paiements
        return $this->handleUpdate($paiement, $operation, $uriVariables, $context);
    }

    private function handleDelete(Paiement $paiement, Operation $operation, array $uriVariables, array $context): void
    {
        // Log CRITIQUE avant suppression
        $this->logger->critical('SUPPRESSION PAIEMENT', [
            'paiement_id' => $paiement->getId(),
            'montant' => $paiement->getMontant(),
            'methode' => $paiement->getMethodePaiement(),
            'date_paiement' => $paiement->getDatePaiement()?->format('Y-m-d H:i:s'),
            'user_id' => $this->security->getUser()?->getId(),
            'timestamp' => new \DateTime()
        ]);

        // Suppression
        $this->entityManager->remove($paiement);
        $this->entityManager->flush();
    }

    private function validatePaiementData(Paiement $paiement): void
    {
        // Validations de sécurité FINANCIERE
        
        // Vérification montant
        if ($paiement->getMontant()) {
            $montant = (float)$paiement->getMontant();
            if ($montant <= 0 || $montant > 999999.99) {
                $this->logger->error('Tentative de paiement avec montant invalide', [
                    'montant' => $paiement->getMontant(),
                    'user_id' => $this->security->getUser()?->getId()
                ]);
                throw new BadRequestException('Montant de paiement non valide');
            }
        }

        // Vérification méthode de paiement
        $methodesValides = ['especes', 'carte_bancaire', 'cheque', 'virement', 'paypal', 'stripe'];
        if ($paiement->getMethodePaiement() && !in_array($paiement->getMethodePaiement(), $methodesValides, true)) {
            throw new BadRequestException('Méthode de paiement non valide');
        }

        // Vérification type de paiement
        $typesValides = ['acompte', 'solde', 'remboursement', 'frais'];
        if ($paiement->getTypePaiement() && !in_array($paiement->getTypePaiement(), $typesValides, true)) {
            throw new BadRequestException('Type de paiement non valide');
        }

        // Vérification date
        if ($paiement->getDatePaiement()) {
            $datePaiement = $paiement->getDatePaiement();
            $aujourdhui = new \DateTime();
            $aujourdhui->setTime(23, 59, 59);
            
            if ($datePaiement > $aujourdhui) {
                throw new BadRequestException('La date de paiement ne peut pas être dans le futur');
            }
        }
    }

    private function sanitizePaiementData(Paiement $paiement): void
    {
        // Assainissement des données financières
        
        // Normalisation du montant
        if ($paiement->getMontant()) {
            $montant = number_format((float)$paiement->getMontant(), 2, '.', '');
            $paiement->setMontant($montant);
        }

        // Normalisation des énumérations
        if ($paiement->getMethodePaiement()) {
            $paiement->setMethodePaiement(strtolower(trim($paiement->getMethodePaiement())));
        }

        if ($paiement->getTypePaiement()) {
            $paiement->setTypePaiement(strtolower(trim($paiement->getTypePaiement())));
        }

        // Assainissement du numéro de transaction
        if ($paiement->getNumeroTransaction()) {
            $numero = strtoupper(trim($paiement->getNumeroTransaction()));
            $numero = preg_replace('/[^A-Z0-9\-_]/', '', $numero);
            $numero = substr($numero, 0, 100);
            $paiement->setNumeroTransaction($numero ?: null);
        }

        // Assainissement du commentaire
        if ($paiement->getCommentaire()) {
            $commentaire = trim($paiement->getCommentaire());
            $commentaire = htmlspecialchars($commentaire, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $commentaire = strip_tags($commentaire);
            $commentaire = substr($commentaire, 0, 500);
            $paiement->setCommentaire($commentaire ?: null);
        }
    }

    private function validateReservationExists(Reservation $reservation): void
    {
        // Vérifier que la réservation existe bien en base
        $existingReservation = $this->entityManager->find(Reservation::class, $reservation->getId());
        
        if (!$existingReservation) {
            $this->logger->error('Tentative de paiement sur réservation inexistante', [
                'reservation_id' => $reservation->getId(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Réservation introuvable');
        }
    }

    private function logFinancialChanges(Paiement $original, Paiement $updated): void
    {
        $changes = [];
        
        if ($original->getMontant() !== $updated->getMontant()) {
            $changes['montant'] = ['old' => $original->getMontant(), 'new' => $updated->getMontant()];
        }
        
        if ($original->getMethodePaiement() !== $updated->getMethodePaiement()) {
            $changes['methode'] = ['old' => $original->getMethodePaiement(), 'new' => $updated->getMethodePaiement()];
        }
        
        if ($original->getTypePaiement() !== $updated->getTypePaiement()) {
            $changes['type'] = ['old' => $original->getTypePaiement(), 'new' => $updated->getTypePaiement()];
        }

        if ($original->getDatePaiement() !== $updated->getDatePaiement()) {
            $changes['date'] = [
                'old' => $original->getDatePaiement()?->format('Y-m-d H:i:s'), 
                'new' => $updated->getDatePaiement()?->format('Y-m-d H:i:s')
            ];
        }

        if (!empty($changes)) {
            $this->logger->critical('MODIFICATION PAIEMENT DETECTEE', [
                'paiement_id' => $updated->getId(),
                'changes' => $changes,
                'user_id' => $this->security->getUser()?->getId(),
                'timestamp' => new \DateTime()
            ]);
        }
    }
}