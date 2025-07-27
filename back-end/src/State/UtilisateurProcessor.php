<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Psr\Log\LoggerInterface;

class UtilisateurProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private Security $security,
        private LoggerInterface $logger
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Utilisateur) {
            return $data;
        }

        // Log de sécurité pour traçabilité RGPD
        $user = $this->security->getUser();
        $this->logger->info('Opération sur Utilisateur', [
            'operation' => $operation::class,
            'user_id' => $user?->getId(),
            'user_email' => $user?->getEmail(),
            'target_user_id' => $data->getId(),
            'target_user_email' => $data->getEmail(),
            'target_user_role' => $data->getRole(),
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

    private function handleCreate(Utilisateur $utilisateur, Operation $operation, array $uriVariables, array $context): Utilisateur
    {
        // Validation de sécurité supplémentaire
        $this->validateUtilisateurData($utilisateur, true);
        
        // Vérification unicité de l'email (sécurité supplémentaire)
        if ($this->isEmailExists($utilisateur->getEmail())) {
            $this->logger->warning('Tentative de création d\'utilisateur avec email existant', [
                'email' => $utilisateur->getEmail(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Un utilisateur avec cet email existe déjà');
        }

        // Assainissement final des données
        $this->sanitizeUtilisateurData($utilisateur);

        // Hacher le mot de passe si présent
        if ($utilisateur->getPlainPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword($utilisateur, $utilisateur->getPlainPassword());
            $utilisateur->setMotDePasse($hashedPassword);
            $utilisateur->setPlainPassword(null);
        }

        // Persistance
        $this->entityManager->persist($utilisateur);
        $this->entityManager->flush();

        // Log de succès avec données RGPD (sans mot de passe)
        $this->logger->info('Utilisateur créé avec succès', [
            'user_id' => $utilisateur->getId(),
            'nom' => $utilisateur->getNom(),
            'email' => $utilisateur->getEmail(),
            'role' => $utilisateur->getRole(),
            'created_by' => $this->security->getUser()?->getId()
        ]);

        return $utilisateur;
    }

    private function handleUpdate(Utilisateur $utilisateur, Operation $operation, array $uriVariables, array $context): Utilisateur
    {
        // Récupération de l'entité originale pour audit
        $originalUtilisateur = $this->entityManager->find(Utilisateur::class, $utilisateur->getId());
        
        if (!$originalUtilisateur) {
            throw new BadRequestException('Utilisateur introuvable');
        }

        // Vérification des droits de modification
        $this->checkModificationRights($originalUtilisateur, $utilisateur);

        // Vérification unicité de l'email si changé
        if ($originalUtilisateur->getEmail() !== $utilisateur->getEmail() && $this->isEmailExists($utilisateur->getEmail(), $utilisateur->getId())) {
            $this->logger->warning('Tentative de modification vers email existant', [
                'user_id' => $utilisateur->getId(),
                'old_email' => $originalUtilisateur->getEmail(),
                'new_email' => $utilisateur->getEmail(),
                'modified_by' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Un utilisateur avec cet email existe déjà');
        }

        // Validation et assainissement
        $this->validateUtilisateurData($utilisateur, false);
        $this->sanitizeUtilisateurData($utilisateur);

        // Hacher le nouveau mot de passe si fourni
        if ($utilisateur->getPlainPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword($utilisateur, $utilisateur->getPlainPassword());
            $utilisateur->setMotDePasse($hashedPassword);
            $utilisateur->setPlainPassword(null);
        } else {
            // Conserver l'ancien mot de passe si pas de nouveau
            $utilisateur->setMotDePasse($originalUtilisateur->getMotDePasse());
        }

        // Persistance
        $this->entityManager->persist($utilisateur);
        $this->entityManager->flush();

        // Log des changements pour audit RGPD
        $this->logUtilisateurChanges($originalUtilisateur, $utilisateur);

        return $utilisateur;
    }

    private function handlePatch(Utilisateur $utilisateur, Operation $operation, array $uriVariables, array $context): Utilisateur
    {
        // Similaire à handleUpdate mais pour modifications partielles
        return $this->handleUpdate($utilisateur, $operation, $uriVariables, $context);
    }

    private function handleDelete(Utilisateur $utilisateur, Operation $operation, array $uriVariables, array $context): mixed
    {
        // Empêcher la suppression de son propre compte
        if ($this->security->getUser() && $this->security->getUser()->getId() === $utilisateur->getId()) {
            $this->logger->warning('Tentative d\'auto-suppression', [
                'user_id' => $utilisateur->getId(),
                'email' => $utilisateur->getEmail()
            ]);
            throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte');
        }

        // Log avant suppression pour audit RGPD
        $this->logger->info('Suppression d\'utilisateur', [
            'user_id' => $utilisateur->getId(),
            'nom' => $utilisateur->getNom(),
            'email' => $utilisateur->getEmail(),
            'role' => $utilisateur->getRole(),
            'deleted_by' => $this->security->getUser()?->getId()
        ]);

        // Suppression
        $this->entityManager->remove($utilisateur);
        $this->entityManager->flush();

        // ✅ CORRECTION : Retourner l'utilisateur supprimé ou null
        return $utilisateur;
    }

    private function validateUtilisateurData(Utilisateur $utilisateur, bool $isCreation = false): void
    {
        // Validations de sécurité supplémentaires
        
        // Vérification nom
        if (!$utilisateur->getNom() || strlen(trim($utilisateur->getNom())) < 2) {
            throw new BadRequestException('Le nom doit contenir au moins 2 caractères');
        }

        if (strlen($utilisateur->getNom()) > 120) {
            throw new BadRequestException('Le nom ne peut pas dépasser 120 caractères');
        }

        // Vérification email
        if (!$utilisateur->getEmail() || !filter_var($utilisateur->getEmail(), FILTER_VALIDATE_EMAIL)) {
            throw new BadRequestException('L\'email doit être valide');
        }

        if (strlen($utilisateur->getEmail()) > 180) {
            throw new BadRequestException('L\'email ne peut pas dépasser 180 caractères');
        }

        // Vérification mot de passe pour création
        if ($isCreation && (!$utilisateur->getPlainPassword() || strlen($utilisateur->getPlainPassword()) < 6)) {
            throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères');
        }

        // Vérification rôle
        $rolesAutorises = ['ROLE_ADMIN', 'ROLE_RECEPTIONNISTE'];
        if (!$utilisateur->getRole() || !in_array($utilisateur->getRole(), $rolesAutorises, true)) {
            throw new BadRequestException('Le rôle doit être ROLE_ADMIN ou ROLE_RECEPTIONNISTE');
        }

        // Vérification domaine email autorisé (optionnel - adaptez selon vos besoins)
        $domainesAutorises = ['@hotelease.com', '@admin.hotelease.com']; // Exemple
        $emailDomain = substr(strrchr($utilisateur->getEmail(), '@'), 0);
        // Désactivé par défaut - décommentez si vous voulez restreindre les domaines
        // if (!in_array($emailDomain, $domainesAutorises)) {
        //     throw new BadRequestException('Domaine email non autorisé');
        // }
    }

    private function sanitizeUtilisateurData(Utilisateur $utilisateur): void
    {
        // Assainissement supplémentaire au niveau métier
        
        // Normalisation du nom
        if ($utilisateur->getNom()) {
            $nom = trim(strip_tags($utilisateur->getNom()));
            $nom = htmlspecialchars($nom, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $nom = preg_replace('/\s+/', ' ', $nom); // Espaces multiples
            $utilisateur->setNom($nom);
        }

        // Normalisation de l'email
        if ($utilisateur->getEmail()) {
            $email = trim(strtolower($utilisateur->getEmail()));
            $email = filter_var($email, FILTER_SANITIZE_EMAIL);
            $utilisateur->setEmail($email);
        }

        // Normalisation du rôle
        if ($utilisateur->getRole()) {
            $role = strtoupper(trim($utilisateur->getRole()));
            $utilisateur->setRole($role);
        }
    }

    private function checkModificationRights(Utilisateur $original, Utilisateur $updated): void
    {
        $currentUser = $this->security->getUser();
        
        // Seuls les ADMIN peuvent modifier les rôles
        if ($original->getRole() !== $updated->getRole() && !$this->security->isGranted('ROLE_ADMIN')) {
            throw new BadRequestException('Seuls les administrateurs peuvent modifier les rôles');
        }

        // Empêcher un utilisateur de se retirer ses droits admin
        if ($currentUser && $currentUser->getId() === $updated->getId() && 
            $original->getRole() === 'ROLE_ADMIN' && $updated->getRole() !== 'ROLE_ADMIN') {
            throw new BadRequestException('Vous ne pouvez pas retirer vos propres droits administrateur');
        }
    }

    private function isEmailExists(string $email, ?int $excludeId = null): bool
    {
        $qb = $this->entityManager->getRepository(Utilisateur::class)
            ->createQueryBuilder('u')
            ->where('LOWER(u.email) = LOWER(:email)')
            ->setParameter('email', trim($email));

        if ($excludeId) {
            $qb->andWhere('u.id != :exclude_id')
               ->setParameter('exclude_id', $excludeId);
        }

        return $qb->getQuery()->getOneOrNullResult() !== null;
    }

    private function logUtilisateurChanges(Utilisateur $original, Utilisateur $updated): void
    {
        $changes = [];
        
        if ($original->getNom() !== $updated->getNom()) {
            $changes['nom'] = [
                'old' => $original->getNom(), 
                'new' => $updated->getNom()
            ];
        }
        
        if ($original->getEmail() !== $updated->getEmail()) {
            $changes['email'] = [
                'old' => $original->getEmail(), 
                'new' => $updated->getEmail()
            ];
        }

        if ($original->getRole() !== $updated->getRole()) {
            $changes['role'] = [
                'old' => $original->getRole(), 
                'new' => $updated->getRole()
            ];
        }

        if ($updated->getPlainPassword()) {
            $changes['password'] = 'Mot de passe modifié';
        }

        if (!empty($changes)) {
            $this->logger->info('Utilisateur modifié', [
                'user_id' => $updated->getId(),
                'changes' => $changes,
                'reservations_count' => $updated->getReservations()->count(),
                'modified_by' => $this->security->getUser()?->getId()
            ]);
        }
    }
}