<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Chambre;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Psr\Log\LoggerInterface;

class ChambreStateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        private LoggerInterface $logger
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Chambre) {
            return $data; // Retourner les données telles quelles si ce n'est pas une Chambre
        }

        // Log de sécurité pour traçabilité
        $user = $this->security->getUser();
        $this->logger->info('Opération sur Chambre', [
            'operation' => $operation::class,
            'user_id' => $user?->getId(),
            'user_email' => $user?->getEmail(),
            'chambre_id' => $data->getId(),
            'chambre_numero' => $data->getNumero(),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'timestamp' => new \DateTime()
        ]);

        return match (true) {
            $operation instanceof \ApiPlatform\Metadata\Post => $this->handleCreate($data, $operation, $uriVariables, $context),
            $operation instanceof \ApiPlatform\Metadata\Put => $this->handleUpdate($data, $operation, $uriVariables, $context),
            $operation instanceof \ApiPlatform\Metadata\Patch => $this->handlePatch($data, $operation, $uriVariables, $context),
            $operation instanceof \ApiPlatform\Metadata\Delete => $this->handleDelete($data, $operation, $uriVariables, $context),
            default => $data // Retourner l'entité telle quelle pour les autres opérations
        };
    }

    private function handleCreate(Chambre $chambre, Operation $operation, array $uriVariables, array $context): Chambre
    {
        // Validation de sécurité supplémentaire
        $this->validateChambreData($chambre);
        
        // Vérification d'unicité stricte (protection race condition)
        if ($this->numeroExists($chambre->getNumero())) {
            $this->logger->warning('Tentative de création de chambre avec numéro existant', [
                'numero' => $chambre->getNumero(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Ce numéro de chambre existe déjà');
        }

        // Assainissement final des données
        $this->sanitizeChambreData($chambre);

        // Persistance directe avec Doctrine
        $this->entityManager->persist($chambre);
        $this->entityManager->flush();

        // Log de succès
        $this->logger->info('Chambre créée avec succès', [
            'chambre_id' => $chambre->getId(),
            'numero' => $chambre->getNumero(),
            'type' => $chambre->getType(),
            'user_id' => $this->security->getUser()?->getId()
        ]);

        return $chambre;
    }

    private function handleUpdate(Chambre $chambre, Operation $operation, array $uriVariables, array $context): Chambre
    {
        // Récupération de l'entité originale pour audit
        $originalChambre = $this->entityManager->find(Chambre::class, $chambre->getId());
        
        if (!$originalChambre) {
            throw new BadRequestException('Chambre introuvable');
        }

        // Vérification du changement de numéro
        $numeroChanged = $originalChambre->getNumero() !== $chambre->getNumero();
        
        if ($numeroChanged && $this->numeroExists($chambre->getNumero(), $chambre->getId())) {
            $this->logger->warning('Tentative de modification vers numéro existant', [
                'chambre_id' => $chambre->getId(),
                'old_numero' => $originalChambre->getNumero(),
                'new_numero' => $chambre->getNumero(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Ce numéro de chambre existe déjà');
        }

        // Validation et assainissement
        $this->validateChambreData($chambre);
        $this->sanitizeChambreData($chambre);

        // Persistance directe
        $this->entityManager->persist($chambre);
        $this->entityManager->flush();

        // Log des changements pour audit
        $this->logChambreChanges($originalChambre, $chambre);

        return $chambre;
    }

    private function handlePatch(Chambre $chambre, Operation $operation, array $uriVariables, array $context): Chambre
    {
        // Similaire à handleUpdate mais pour modifications partielles
        return $this->handleUpdate($chambre, $operation, $uriVariables, $context);
    }

    private function handleDelete(Chambre $chambre, Operation $operation, array $uriVariables, array $context): void
    {
        // Log avant suppression
        $this->logger->info('Suppression de chambre', [
            'chambre_id' => $chambre->getId(),
            'numero' => $chambre->getNumero(),
            'type' => $chambre->getType(),
            'user_id' => $this->security->getUser()?->getId()
        ]);

        // Suppression directe sans vérification
        $this->entityManager->remove($chambre);
        $this->entityManager->flush();
    }

    private function validateChambreData(Chambre $chambre): void
    {
        // Validations de sécurité supplémentaires
        
        // Vérification numéro
        if ($chambre->getNumero()) {
            $numero = $chambre->getNumero();
            if (strlen($numero) > 10 || !preg_match('/^[A-Z0-9]+$/i', $numero)) {
                throw new BadRequestException('Format de numéro de chambre invalide');
            }
        }

        // Vérification prix
        if ($chambre->getPrixChambre()) {
            $prix = (float)$chambre->getPrixChambre();
            if ($prix < 0 || $prix > 999999.99) {
                throw new BadRequestException('Prix de chambre non valide');
            }
        }

        // Vérification capacité
        if ($chambre->getCapacite()) {
            $capacite = $chambre->getCapacite();
            if ($capacite < 1 || $capacite > 10) {
                throw new BadRequestException('Capacité de chambre non valide');
            }
        }

        // Vérification type
        $typesValides = ['Standard', 'Confort', 'Suite', 'Familiale', 'Deluxe', 'Junior Suite', 'Suite Présidentielle'];
        if ($chambre->getType() && !in_array($chambre->getType(), $typesValides, true)) {
            throw new BadRequestException('Type de chambre non valide');
        }

        // Vérification état
        $etatsValides = ['disponible', 'occupee', 'maintenance', 'hors_service'];
        if ($chambre->getEtat() && !in_array($chambre->getEtat(), $etatsValides, true)) {
            throw new BadRequestException('État de chambre non valide');
        }
    }

    private function sanitizeChambreData(Chambre $chambre): void
    {
        // Assainissement supplémentaire au niveau métier
        
        // Normalisation du numéro
        if ($chambre->getNumero()) {
            $numero = strtoupper(preg_replace('/[^A-Z0-9]/', '', $chambre->getNumero()));
            $chambre->setNumero($numero);
        }

        // Normalisation du type
        if ($chambre->getType()) {
            $type = ucwords(strtolower(trim($chambre->getType())));
            $chambre->setType($type);
        }

        // Normalisation de l'état
        if ($chambre->getEtat()) {
            $etat = strtolower(trim($chambre->getEtat()));
            $chambre->setEtat($etat);
        }

        // Normalisation du prix
        if ($chambre->getPrixChambre()) {
            $prix = number_format((float)$chambre->getPrixChambre(), 2, '.', '');
            $chambre->setPrixChambre($prix);
        }

        // Assainissement de la description
        if ($chambre->getDescription()) {
            $description = trim($chambre->getDescription());
            $description = htmlspecialchars($description, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $description = strip_tags($description);
            $description = substr($description, 0, 1000);
            $chambre->setDescription($description ?: null);
        }
    }

    private function numeroExists(string $numero, ?int $excludeId = null): bool
    {
        $qb = $this->entityManager->getRepository(Chambre::class)
            ->createQueryBuilder('c')
            ->where('c.numero = :numero')
            ->setParameter('numero', $numero);

        if ($excludeId) {
            $qb->andWhere('c.id != :id')
               ->setParameter('id', $excludeId);
        }

        return $qb->getQuery()->getOneOrNullResult() !== null;
    }

    private function hasActiveReservations(Chambre $chambre): bool
    {
        // Vérifier s'il y a des réservations actives ou futures
        $count = $this->entityManager
            ->getRepository(Chambre::class)
            ->createQueryBuilder('c')
            ->select('COUNT(r.id)')
            ->leftJoin('c.reservations', 'r')
            ->where('c.id = :chambre_id')
            ->andWhere('r.dateDebut >= :today OR r.dateFin >= :today')
            ->setParameter('chambre_id', $chambre->getId())
            ->setParameter('today', new \DateTime('today'))
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    private function logChambreChanges(Chambre $original, Chambre $updated): void
    {
        $changes = [];
        
        if ($original->getNumero() !== $updated->getNumero()) {
            $changes['numero'] = ['old' => $original->getNumero(), 'new' => $updated->getNumero()];
        }
        
        if ($original->getType() !== $updated->getType()) {
            $changes['type'] = ['old' => $original->getType(), 'new' => $updated->getType()];
        }
        
        if ($original->getEtat() !== $updated->getEtat()) {
            $changes['etat'] = ['old' => $original->getEtat(), 'new' => $updated->getEtat()];
        }

        if ($original->getCapacite() !== $updated->getCapacite()) {
            $changes['capacite'] = ['old' => $original->getCapacite(), 'new' => $updated->getCapacite()];
        }

        if ($original->getPrixChambre() !== $updated->getPrixChambre()) {
            $changes['prix'] = ['old' => $original->getPrixChambre(), 'new' => $updated->getPrixChambre()];
        }

        if (!empty($changes)) {
            $this->logger->info('Chambre modifiée', [
                'chambre_id' => $updated->getId(),
                'numero' => $updated->getNumero(),
                'changes' => $changes,
                'user_id' => $this->security->getUser()?->getId()
            ]);
        }
    }
}