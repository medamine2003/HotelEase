<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Delete;
use App\State\UtilisateurProcessor;
use App\Repository\UtilisateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;

// cette entité gère la création d'un utilisateur avec des conditions de validation (appliquant une logique métier)
// This entity is responsible for the creation of a user with some condictions
#[ORM\Entity(repositoryClass: UtilisateurRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(processor: UtilisateurProcessor::class),
        new Put(processor: UtilisateurProcessor::class),
        new Patch(processor: UtilisateurProcessor::class),
        new Delete(processor: UtilisateurProcessor::class)
    ],
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']]
)]
class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank(message: "Le nom est obligatoire.")]
    #[Assert\Length(max: 120, maxMessage: "Le nom ne doit pas dépasser {{ limit }} caractères.")]
    private ?string $nom = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank(message: "L'email est obligatoire.")]
    #[Assert\Email(message: "Format d'email invalide.")]
    #[Assert\Length(
        max: 180,
        maxMessage: "L'email ne doit pas dépasser {{ limit }} caractères."
    )]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user:read'])]
    private ?string $motDePasse = null;

    #[Groups(['user:write'])]
    #[Assert\NotBlank(message: "Le mot de passe est obligatoire.", groups: ['user:create'])]
    #[Assert\Length(
        min: 12,
        max: 255,
        minMessage: "Le mot de passe doit contenir au moins {{ limit }} caractères.",
        maxMessage: "Le mot de passe ne doit pas dépasser {{ limit }} caractères.",
        groups: ['user:create', 'user:update']
    )]
    #[Assert\Regex(
        pattern: '/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
        message: "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.",
        groups: ['user:create', 'user:update']
    )]
    private ?string $plainPassword = null;

    #[ORM\Column(length: 50)]
    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank(message: "Le rôle est obligatoire.")]
    #[Assert\Choice(
        choices: ['ROLE_ADMIN', 'ROLE_RECEPTIONNISTE'],
        message: "Le rôle doit être soit 'ROLE_ADMIN' soit 'ROLE_RECEPTIONNISTE'."
    )]
    private ?string $role = null;

    /**
     * @var Collection<int, Reservation>
     */
    #[ORM\OneToMany(targetEntity: Reservation::class, mappedBy: 'createur')]
    private Collection $reservations;

    public function __construct()
    {
        $this->reservations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = trim($nom);
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        // Normalisation : trim et lowercase comme en front
        $this->email = trim(strtolower($email));
        return $this;
    }

    public function getMotDePasse(): ?string
    {
        return $this->motDePasse;
    }

    public function setMotDePasse(string $motDePasse): static
    {
        $this->motDePasse = $motDePasse;
        return $this;
    }

    public function getPlainPassword(): ?string
    {
        return $this->plainPassword;
    }

    public function setPlainPassword(?string $plainPassword): static
    {
        $this->plainPassword = $plainPassword;
        return $this;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;
        return $this;
    }

    /**
     * @return Collection<int, Reservation>
     */
    public function getReservations(): Collection
    {
        return $this->reservations;
    }

    public function addReservation(Reservation $reservation): static
    {
        if (!$this->reservations->contains($reservation)) {
            $this->reservations->add($reservation);
            $reservation->setCreateur($this);
        }
        return $this;
    }

    public function removeReservation(Reservation $reservation): static
    {
        if ($this->reservations->removeElement($reservation)) {
            if ($reservation->getCreateur() === $this) {
                $reservation->setCreateur(null);
            }
        }
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->motDePasse;
    }

    public function getUserIdentifier(): string
    {
        return $this->email ?? '';
    }

    public function getRoles(): array
    {
        $roles = ['ROLE_USER']; 
        
        if ($this->role) {
            $roles[] = $this->role;
        }
        
        return array_unique($roles);
    }

    public function eraseCredentials(): void
    {
        // On efface les données sensibles (ici le mot de passe en clair)
        $this->plainPassword = null;
    }
}