<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Client;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Psr\Log\LoggerInterface;

class ClientStateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        private LoggerInterface $logger
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Client) {
            return $data;
        }

        // Log de sécurité pour traçabilité RGPD
        $user = $this->security->getUser();
        $this->logger->info('Opération sur données Client (RGPD)', [
            'operation' => $operation::class,
            'user_id' => $user?->getId(),
            'user_email' => $user?->getEmail(),
            'client_id' => $data->getId(),
            'client_nom' => $data->getNom(),
            'client_prenom' => $data->getPrenom(),
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

    private function handleCreate(Client $client, Operation $operation, array $uriVariables, array $context): Client
    {
        // Validation de sécurité des données personnelles
        $this->validateClientData($client);
        
        // Vérification d'unicité du téléphone (protection race condition)
        if ($this->telephoneExists($client->getNumeroTelephone())) {
            $this->logger->warning('Tentative de création de client avec téléphone existant', [
                'telephone' => $client->getNumeroTelephone(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Ce numéro de téléphone est déjà utilisé');
        }

        // Assainissement final des données
        $this->sanitizeClientData($client);

        // Persistance
        $this->entityManager->persist($client);
        $this->entityManager->flush();

        // Log de succès pour audit RGPD
        $this->logger->info('CLIENT CREE avec succès', [
            'client_id' => $client->getId(),
            'nom' => $client->getNom(),
            'prenom' => $client->getPrenom(),
            'telephone' => $client->getNumeroTelephone(),
            'user_id' => $this->security->getUser()?->getId(),
            'timestamp' => new \DateTime()
        ]);

        return $client;
    }

    private function handleUpdate(Client $client, Operation $operation, array $uriVariables, array $context): Client
    {
        // Récupération de l'entité originale pour audit RGPD
        $originalClient = $this->entityManager->find(Client::class, $client->getId());
        
        if (!$originalClient) {
            throw new BadRequestException('Client introuvable');
        }

        // Vérification du changement de téléphone
        $telephoneChanged = $originalClient->getNumeroTelephone() !== $client->getNumeroTelephone();
        
        if ($telephoneChanged && $this->telephoneExists($client->getNumeroTelephone(), $client->getId())) {
            $this->logger->warning('Tentative de modification vers téléphone existant', [
                'client_id' => $client->getId(),
                'old_telephone' => $originalClient->getNumeroTelephone(),
                'new_telephone' => $client->getNumeroTelephone(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Ce numéro de téléphone est déjà utilisé');
        }

        // Validation et assainissement
        $this->validateClientData($client);
        $this->sanitizeClientData($client);

        // Persistance
        $this->entityManager->persist($client);
        $this->entityManager->flush();

        // Log des changements pour audit RGPD
        $this->logClientChanges($originalClient, $client);

        return $client;
    }

    private function handlePatch(Client $client, Operation $operation, array $uriVariables, array $context): Client
    {
        // Même traitement que l'update pour les modifications partielles
        return $this->handleUpdate($client, $operation, $uriVariables, $context);
    }

    private function handleDelete(Client $client, Operation $operation, array $uriVariables, array $context): void
    {
        // Vérification avant suppression - si le client a des réservations
        if ($this->hasActiveReservations($client)) {
            $this->logger->warning('Tentative de suppression de client avec réservations', [
                'client_id' => $client->getId(),
                'nom' => $client->getNom(),
                'prenom' => $client->getPrenom(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Impossible de supprimer un client avec des réservations actives');
        }

        // Log RGPD avant suppression (droit à l'oubli)
        $this->logger->info('SUPPRESSION CLIENT (RGPD - Droit à l\'oubli)', [
            'client_id' => $client->getId(),
            'nom' => $client->getNom(),
            'prenom' => $client->getPrenom(),
            'telephone' => $client->getNumeroTelephone(),
            'user_id' => $this->security->getUser()?->getId(),
            'timestamp' => new \DateTime()
        ]);

        // Suppression
        $this->entityManager->remove($client);
        $this->entityManager->flush();
    }

    private function validateClientData(Client $client): void
    {
        // Validations de sécurité supplémentaires
        
        // Vérification nom/prénom
        if ($client->getNom()) {
            $nom = $client->getNom();
            if (strlen($nom) < 2 || strlen($nom) > 120 || !preg_match('/^[a-zA-ZÀ-ÿ\s\'-]+$/u', $nom)) {
                throw new BadRequestException('Format de nom invalide');
            }
        }

        if ($client->getPrenom()) {
            $prenom = $client->getPrenom();
            if (strlen($prenom) < 2 || strlen($prenom) > 120 || !preg_match('/^[a-zA-ZÀ-ÿ\s\'-]+$/u', $prenom)) {
                throw new BadRequestException('Format de prénom invalide');
            }
        }

        // Vérification téléphone plus stricte
        if ($client->getNumeroTelephone()) {
            $tel = $client->getNumeroTelephone();
            if (!preg_match('/^\+?[1-9]\d{1,14}$/', $tel)) {
                throw new BadRequestException('Format de téléphone invalide');
            }
        }

        // Vérification adresse
        if ($client->getAdresseFacturation()) {
            $adresse = $client->getAdresseFacturation();
            if (strlen($adresse) > 255) {
                throw new BadRequestException('Adresse de facturation trop longue');
            }
        }
    }

    private function sanitizeClientData(Client $client): void
    {
        // Assainissement supplémentaire au niveau métier
        
        // Normalisation des noms
        if ($client->getNom()) {
            $nom = ucwords(strtolower(trim($client->getNom())));
            $client->setNom($nom);
        }
        
        if ($client->getPrenom()) {
            $prenom = ucwords(strtolower(trim($client->getPrenom())));
            $client->setPrenom($prenom);
        }

        // Normalisation du téléphone
        if ($client->getNumeroTelephone()) {
            $tel = preg_replace('/[^0-9+]/', '', $client->getNumeroTelephone());
            $client->setNumeroTelephone($tel);
        }

        // Assainissement de l'adresse
        if ($client->getAdresseFacturation()) {
            $adresse = trim($client->getAdresseFacturation());
            $adresse = htmlspecialchars($adresse, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $adresse = strip_tags($adresse);
            $adresse = preg_replace('/[^\p{L}\p{N}\s\.,\-\']/u', '', $adresse);
            $adresse = substr($adresse, 0, 255);
            $client->setAdresseFacturation($adresse ?: null);
        }
    }

    private function telephoneExists(string $telephone, ?int $excludeId = null): bool
    {
        $qb = $this->entityManager->getRepository(Client::class)
            ->createQueryBuilder('c')
            ->where('c.numeroTelephone = :telephone')
            ->setParameter('telephone', $telephone);

        if ($excludeId) {
            $qb->andWhere('c.id != :id')
               ->setParameter('id', $excludeId);
        }

        return $qb->getQuery()->getOneOrNullResult() !== null;
    }

    private function hasActiveReservations(Client $client): bool
    {
        // Vérifier s'il y a des réservations actives ou futures
        $count = $this->entityManager
            ->getRepository(Client::class)
            ->createQueryBuilder('c')
            ->select('COUNT(r.id)')
            ->leftJoin('c.reservations', 'r')
            ->where('c.id = :client_id')
            ->andWhere('r.dateDebut >= :today OR r.dateFin >= :today')
            ->setParameter('client_id', $client->getId())
            ->setParameter('today', new \DateTime('today'))
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    private function logClientChanges(Client $original, Client $updated): void
    {
        $changes = [];
        
        if ($original->getNom() !== $updated->getNom()) {
            $changes['nom'] = ['old' => $original->getNom(), 'new' => $updated->getNom()];
        }
        
        if ($original->getPrenom() !== $updated->getPrenom()) {
            $changes['prenom'] = ['old' => $original->getPrenom(), 'new' => $updated->getPrenom()];
        }
        
        if ($original->getNumeroTelephone() !== $updated->getNumeroTelephone()) {
            $changes['telephone'] = ['old' => $original->getNumeroTelephone(), 'new' => $updated->getNumeroTelephone()];
        }

        if ($original->getAdresseFacturation() !== $updated->getAdresseFacturation()) {
            $changes['adresse'] = ['old' => $original->getAdresseFacturation(), 'new' => $updated->getAdresseFacturation()];
        }

        if (!empty($changes)) {
            $this->logger->info('CLIENT MODIFIE (RGPD)', [
                'client_id' => $updated->getId(),
                'nom' => $updated->getNom(),
                'prenom' => $updated->getPrenom(),
                'changes' => $changes,
                'user_id' => $this->security->getUser()?->getId(),
                'timestamp' => new \DateTime()
            ]);
        }
    }
}