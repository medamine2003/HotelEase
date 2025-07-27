<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\ServiceRepository;
use App\State\ServiceStateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: ServiceRepository::class)]
#[ORM\Table(name: 'service')]
#[UniqueEntity(
    fields: ['nom'],
    message: 'Un service avec ce nom existe déjà.'
)]
#[ApiResource(
    operations: [
        new Get(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['service:read']]
        ),
        new GetCollection(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['service:read']]
        ),
        new Post(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['service:create']],
            normalizationContext: ['groups' => ['service:read']],
            validationContext: ['groups' => ['Default', 'service:create']],
            processor: ServiceStateProcessor::class
        ),
        new Put(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['service:update']],
            normalizationContext: ['groups' => ['service:read']],
            validationContext: ['groups' => ['Default', 'service:update']],
            processor: ServiceStateProcessor::class
        ),
        new Patch(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['service:patch']],
            normalizationContext: ['groups' => ['service:read']],
            validationContext: ['groups' => ['Default', 'service:patch']],
            processor: ServiceStateProcessor::class
        ),
        new Delete(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            processor: ServiceStateProcessor::class
        )
    ]
)]
class Service
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['service:read', 'reservation:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 80)]
    #[Assert\NotBlank(message: 'Le nom du service est obligatoire')]
    #[Assert\Length(
        min: 2,
        max: 80,
        minMessage: 'Le nom doit contenir au moins {{ limit }} caractères',
        maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères'
    )]
    #[Assert\Regex(
        pattern: '/^[a-zA-ZÀ-ÿ0-9\s\-\'\.]+$/u',
        message: 'Le nom ne peut contenir que des lettres, chiffres, espaces, tirets, apostrophes et points'
    )]
    #[Groups(['service:read', 'service:create', 'service:update', 'reservation:read'])]
    private ?string $nom = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Assert\NotBlank(message: 'Le prix du service est obligatoire')]
    #[Assert\Range(
        min: 0.01,
        max: 99999999.99,
        notInRangeMessage: 'Le prix doit être compris entre {{ min }}€ et {{ max }}€'
    )]
    #[Groups(['service:read', 'service:create', 'service:update', 'reservation:read'])]
    private ?string $prixService = null;

    /**
     * @var Collection<int, ReservationService>
     */
    #[ORM\OneToMany(targetEntity: ReservationService::class, mappedBy: 'service')]
    #[Groups(['service:read'])]
    private Collection $reservationServices;

    public function __construct()
    {
        $this->reservationServices = new ArrayCollection();
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
        // Assainissement anti-XSS et normalisation
        $nom = trim(strip_tags($nom));
        $nom = htmlspecialchars($nom, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // Normalisation des espaces multiples
        $nom = preg_replace('/\s+/', ' ', $nom);
        
        $this->nom = $nom;
        return $this;
    }

    public function getPrixService(): ?string
    {
        return $this->prixService ? (string) $this->prixService : null;
    }

    public function setPrixService(mixed $prixService): static
    {
        if ($prixService === null) {
            $this->prixService = null;
            return $this;
        }
        
        // Conversion intelligente avec gestion de la précision
        if (is_int($prixService)) {
            $this->prixService = $prixService . '.00';
        } elseif (is_float($prixService)) {
            $this->prixService = number_format($prixService, 2, '.', '');
        } elseif (is_string($prixService) && is_numeric($prixService)) {
            $this->prixService = number_format((float) $prixService, 2, '.', '');
        } else {
            $this->prixService = number_format((float) $prixService, 2, '.', '');
        }
        
        return $this;
    }

    /**
     * Retourne le prix comme float pour les calculs
     */
    public function getPrixServiceAsFloat(): float
    {
        return $this->prixService ? (float) $this->prixService : 0.0;
    }

    /**
     * @return Collection<int, ReservationService>
     */
    public function getReservationServices(): Collection
    {
        return $this->reservationServices;
    }

    public function addReservationService(ReservationService $reservationService): static
    {
        if (!$this->reservationServices->contains($reservationService)) {
            $this->reservationServices->add($reservationService);
            $reservationService->setService($this);
        }

        return $this;
    }

    public function removeReservationService(ReservationService $reservationService): static
    {
        if ($this->reservationServices->removeElement($reservationService)) {
            if ($reservationService->getService() === $this) {
                $reservationService->setService(null);
            }
        }

        return $this;
    }

    /**
     * Vérifie si le service est utilisé dans des réservations
     */
    #[Groups(['service:read'])]
    public function isUsedInReservations(): bool
    {
        return $this->reservationServices->count() > 0;
    }

    /**
     * Compte le nombre d'utilisations du service
     */
    #[Groups(['service:read'])]
    public function getUsageCount(): int
    {
        return $this->reservationServices->count();
    }

    /**
     * Calcule le chiffre d'affaires généré par ce service
     */
    #[Groups(['service:read'])]
    public function getTotalRevenue(): string
    {
        $total = 0.0;
        foreach ($this->reservationServices as $rs) {
            $total += (float) $rs->getSousTotal();
        }
        return number_format($total, 2, '.', '');
    }
}