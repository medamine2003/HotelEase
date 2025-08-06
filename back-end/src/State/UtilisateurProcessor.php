<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Psr\Log\LoggerInterface;

class UtilisateurProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
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
        // Validation Symfony avec groupe de création
        $this->validateWithSymfonyConstraints($utilisateur, ['user:create']);
        
        // Validations métier spécifiques
        $this->validateBusinessRules($utilisateur, true);
        
        // Sécurisation finale des données
        $this->securizeData($utilisateur);
        
        // Vérification unicité de l'email (sécurité supplémentaire)
        if ($this->isEmailExists($utilisateur->getEmail())) {
            $this->logger->warning('Tentative de création d\'utilisateur avec email existant', [
                'email' => $utilisateur->getEmail(),
                'user_id' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Un utilisateur avec cet email existe déjà');
        }

        // Hash du mot de passe
        if ($utilisateur->getPlainPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword($utilisateur, $utilisateur->getPlainPassword());
            $utilisateur->setMotDePasse($hashedPassword);
            $utilisateur->setPlainPassword(null);
        }

        // Persistance
        $this->entityManager->persist($utilisateur);
        $this->entityManager->flush();

        // Log de succès avec données RGPD
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

        // Validation avec groupe de mise à jour (seulement si mot de passe fourni)
        $validationGroups = [];
        if ($utilisateur->getPlainPassword()) {
            $validationGroups[] = 'user:update';
        }
        $this->validateWithSymfonyConstraints($utilisateur, $validationGroups);

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

        // Validations métier spécifiques
        $this->validateBusinessRules($utilisateur, false);

        // Sécurisation finale des données
        $this->securizeData($utilisateur);

        // Gestion du mot de passe
        if ($utilisateur->getPlainPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword($utilisateur, $utilisateur->getPlainPassword());
            $utilisateur->setMotDePasse($hashedPassword);
            $utilisateur->setPlainPassword(null);
        } else {
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

    private function handleDelete(Utilisateur $utilisateur, Operation $operation, array $uriVariables, array $context): void
    {
        // Empêcher la suppression de son propre compte
        if ($this->security->getUser() && $this->security->getUser()->getId() === $utilisateur->getId()) {
            $this->logger->warning('Tentative d\'auto-suppression', [
                'user_id' => $utilisateur->getId(),
                'email' => $utilisateur->getEmail()
            ]);
            throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte');
        }

        // Vérification avant suppression - si l'utilisateur a des réservations
        if ($this->isUtilisateurUsedInReservations($utilisateur)) {
            $this->logger->warning('Tentative de suppression d\'utilisateur avec réservations', [
                'user_id' => $utilisateur->getId(),
                'nom' => $utilisateur->getNom(),
                'email' => $utilisateur->getEmail(),
                'reservations_count' => $utilisateur->getReservations()->count(),
                'user_id_requesting' => $this->security->getUser()?->getId()
            ]);
            throw new BadRequestException('Impossible de supprimer un utilisateur ayant des réservations associées');
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
    }

    /**
     * Validation avec les contraintes Symfony définies dans l'entité
     */
    private function validateWithSymfonyConstraints(Utilisateur $utilisateur, array $groups = []): void
    {
        $violations = $this->validator->validate($utilisateur, null, $groups);
        
        if (count($violations) > 0) {
            $errors = [];
            foreach ($violations as $violation) {
                $errors[] = $violation->getMessage();
            }
            
            $this->logger->warning('Erreurs de validation Symfony', [
                'errors' => $errors,
                'user_email' => $utilisateur->getEmail(),
                'groups' => $groups
            ]);
            
            throw new UnprocessableEntityHttpException(implode(' ', $errors));
        }
    }

    /**
     * Validations métier spécifiques non couvertes par les contraintes Symfony
     */
    private function validateBusinessRules(Utilisateur $utilisateur, bool $isCreation = false): void
    {
        // Vérification mot de passe obligatoire à la création
        if ($isCreation && !$utilisateur->getPlainPassword()) {
            throw new BadRequestException('Le mot de passe est obligatoire lors de la création');
        }

        // Vérification mots de passe trop communs (sécurité métier)
        if ($utilisateur->getPlainPassword()) {
            $commonPasswords = ['123456789012', 'MotDePasse123', 'Password123!', 'Azerty123456', 'HotelEase123'];
            if (in_array($utilisateur->getPlainPassword(), $commonPasswords)) {
                throw new BadRequestException('Ce mot de passe est trop commun, veuillez en choisir un autre');
            }
        }

        // Vérification domaine email autorisé (règle métier optionnelle)
        if ($utilisateur->getEmail()) {
            $domainesAutorises = ['@hotelease.com', '@admin.hotelease.com']; // Exemple
            $emailDomain = substr(strrchr($utilisateur->getEmail(), '@'), 0);
            
             if (!in_array($emailDomain, $domainesAutorises)) {
              throw new BadRequestException('Domaine email non autorisé pour cette application');
             }
        }

        // Vérification mots interdits dans le nom (sécurité métier)
        if ($utilisateur->getNom()) {
            $motsInterdits = ['<script', 'javascript:', 'eval(', 'alert(', 'confirm(', 'prompt(', 'onload=', 'onerror='];
            $nomLower = strtolower($utilisateur->getNom());
            foreach ($motsInterdits as $mot) {
                if (str_contains($nomLower, $mot)) {
                    throw new BadRequestException('Le nom contient des termes non autorisés');
                }
            }
        }

        // Vérification longueur minimale nom (règle métier)
        if ($utilisateur->getNom() && strlen(trim($utilisateur->getNom())) < 2) {
            throw new BadRequestException('Le nom doit contenir au moins 2 caractères');
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

    private function isUtilisateurUsedInReservations(Utilisateur $utilisateur): bool
    {
        return $utilisateur->getReservations()->count() > 0;
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

    /**
     * Sécurisation finale des données contre XSS et autres attaques
     */
    private function securizeData(Utilisateur $utilisateur): void
    {
        // Protection XSS sur le nom
        if ($utilisateur->getNom()) {
            $nom = trim(strip_tags($utilisateur->getNom()));
            $nom = htmlspecialchars($nom, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $nom = preg_replace('/\s+/', ' ', $nom);
            $utilisateur->setNom($nom);
        }

        // Protection sur l'email (déjà fait dans le setter mais sécurité supplémentaire)
        if ($utilisateur->getEmail()) {
            $email = trim(strtolower($utilisateur->getEmail()));
            $email = filter_var($email, FILTER_SANITIZE_EMAIL);
            $utilisateur->setEmail($email);
        }

        // Normalisation du rôle
        if ($utilisateur->getRole()) {
            $role = strtoupper(trim(strip_tags($utilisateur->getRole())));
            $utilisateur->setRole($role);
        }
    }
}