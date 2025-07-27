<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Service;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Psr\Log\LoggerInterface;

class ServiceStateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        private LoggerInterface $logger
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Service) {
            return $data;
        }

        // Log de sécurité pour traçabilité RGPD
        $user = $this->security->getUser();
        $this->logger->info('Opération sur Service', [
            'operation' => $operation::class,
            'user_id' => $user?->getId(),
            'user_email' => $user?->getEmail(),
            'service_id' => $data->getId(),
            'service_nom' => $data->getNom(),
            'service_prix' => $data->getPrixService(),
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

    private function handleCreate(Service $service, Operation $operation, array $uriVariables, array $context): Service
    {
        // Validation de sécurité supplémentaire
        $this->validateServiceData($service);
        
        // Vérification unicité du nom (sécurité supplémentaire)
        if ($this->isServiceNameExists($service->getNom())) {
            $this->logger->warning('Tentative de création de service avec nom existant', [
                'nom' => $service->getNom(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Un service avec ce nom existe déjà');
        }

        // Assainissement final des données
        $this->sanitizeServiceData($service);

        // Persistance
        $this->entityManager->persist($service);
        $this->entityManager->flush();

        // Log de succès avec données RGPD
        $this->logger->info('Service créé avec succès', [
            'service_id' => $service->getId(),
            'nom' => $service->getNom(),
            'prix' => $service->getPrixService(),
            'user_id' => $this->security->getUser()?->getId()
        ]);

        return $service;
    }

    private function handleUpdate(Service $service, Operation $operation, array $uriVariables, array $context): Service
    {
        // Récupération de l'entité originale pour audit
        $originalService = $this->entityManager->find(Service::class, $service->getId());
        
        if (!$originalService) {
            throw new BadRequestException('Service introuvable');
        }

        // Vérification unicité du nom si changé
        if ($originalService->getNom() !== $service->getNom() && $this->isServiceNameExists($service->getNom(), $service->getId())) {
            $this->logger->warning('Tentative de modification vers nom existant', [
                'service_id' => $service->getId(),
                'old_nom' => $originalService->getNom(),
                'new_nom' => $service->getNom(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Un service avec ce nom existe déjà');
        }

        // Validation et assainissement
        $this->validateServiceData($service);
        $this->sanitizeServiceData($service);

        // Persistance
        $this->entityManager->persist($service);
        $this->entityManager->flush();

        // Log des changements pour audit RGPD
        $this->logServiceChanges($originalService, $service);

        return $service;
    }

    private function handlePatch(Service $service, Operation $operation, array $uriVariables, array $context): Service
    {
        // Similaire à handleUpdate mais pour modifications partielles
        return $this->handleUpdate($service, $operation, $uriVariables, $context);
    }

    private function handleDelete(Service $service, Operation $operation, array $uriVariables, array $context): void
    {
        // Vérification avant suppression - si le service est utilisé dans des réservations
        if ($this->isServiceUsedInReservations($service)) {
            $this->logger->warning('Tentative de suppression de service utilisé', [
                'service_id' => $service->getId(),
                'nom' => $service->getNom(),
                'usage_count' => $service->getUsageCount(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Impossible de supprimer un service utilisé dans des réservations');
        }

        // Log avant suppression pour audit RGPD
        $this->logger->info('Suppression de service', [
            'service_id' => $service->getId(),
            'nom' => $service->getNom(),
            'prix' => $service->getPrixService(),
            'user_id' => $this->security->getUser()?->getId()
        ]);

        // Suppression
        $this->entityManager->remove($service);
        $this->entityManager->flush();
    }

    private function validateServiceData(Service $service): void
    {
        // Validations de sécurité supplémentaires
        
        // Vérification nom
        if (!$service->getNom() || strlen(trim($service->getNom())) < 2) {
            throw new BadRequestException('Le nom du service doit contenir au moins 2 caractères');
        }

        if (strlen($service->getNom()) > 80) {
            throw new BadRequestException('Le nom du service ne peut pas dépasser 80 caractères');
        }

        // Vérification caractères autorisés dans le nom
        if (!preg_match('/^[a-zA-ZÀ-ÿ0-9\s\-\'\.]+$/u', $service->getNom())) {
            throw new BadRequestException('Le nom ne peut contenir que des lettres, chiffres, espaces, tirets, apostrophes et points');
        }

        // Vérification prix
        if ($service->getPrixService()) {
            $prix = $service->getPrixServiceAsFloat();
            if ($prix < 0.01 || $prix > 99999999.99) {
                throw new BadRequestException('Le prix doit être compris entre 0,01€ et 99 999 999,99€');
            }
        }

        // Vérification mots interdits ou sensibles
        $motsInterdits = ['admin', 'test', 'debug', 'null', 'undefined','script','alert'];
        $nomLower = strtolower($service->getNom());
        foreach ($motsInterdits as $mot) {
            if (str_contains($nomLower, $mot)) {
                throw new BadRequestException('Le nom du service contient des termes non autorisés');
            }
        }
    }

    private function sanitizeServiceData(Service $service): void
    {
        // Assainissement supplémentaire au niveau métier
        
        // Normalisation du nom - déjà fait dans setNom() mais sécurité supplémentaire
        if ($service->getNom()) {
            $nom = trim(strip_tags($service->getNom()));
            $nom = htmlspecialchars($nom, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $nom = preg_replace('/\s+/', ' ', $nom); // Espaces multiples
            $service->setNom($nom);
        }

        // Le prix est déjà traité par setPrixService() - pas de re-traitement nécessaire
    }

    private function isServiceNameExists(string $nom, ?int $excludeId = null): bool
    {
        $qb = $this->entityManager->getRepository(Service::class)
            ->createQueryBuilder('s')
            ->where('LOWER(s.nom) = LOWER(:nom)')
            ->setParameter('nom', trim($nom));

        if ($excludeId) {
            $qb->andWhere('s.id != :exclude_id')
               ->setParameter('exclude_id', $excludeId);
        }

        return $qb->getQuery()->getOneOrNullResult() !== null;
    }

    private function isServiceUsedInReservations(Service $service): bool
    {
        return $service->getReservationServices()->count() > 0;
    }

    private function logServiceChanges(Service $original, Service $updated): void
    {
        $changes = [];
        
        if ($original->getNom() !== $updated->getNom()) {
            $changes['nom'] = [
                'old' => $original->getNom(), 
                'new' => $updated->getNom()
            ];
        }
        
        if ($original->getPrixService() !== $updated->getPrixService()) {
            $changes['prix'] = [
                'old' => $original->getPrixService(), 
                'new' => $updated->getPrixService()
            ];
        }

        if (!empty($changes)) {
            $this->logger->info('Service modifié', [
                'service_id' => $updated->getId(),
                'changes' => $changes,
                'usage_count' => $updated->getUsageCount(),
                'total_revenue' => $updated->getTotalRevenue(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
        }
    }
}