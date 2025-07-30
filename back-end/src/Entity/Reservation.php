<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\ReservationRepository;
use App\State\ReservationStateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Serializer\Annotation\Context;
use Symfony\Component\Serializer\Annotation\SerializedName;

// cette entité gère la création d'une réservation avec des conditions de validation (appliquant une logique métier)
// This entity is responsible for the creation of a reservation with some condictions
#[ORM\Entity(repositoryClass: ReservationRepository::class)]
#[ORM\Table(name: 'reservation')]
#[ApiResource(
    operations: [
        new Get(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['reservation:read']]
        ),
        new GetCollection(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['reservation:read']]
        ),
        new Post(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['reservation:create']],
            normalizationContext: ['groups' => ['reservation:read']],
            validationContext: ['groups' => ['Default', 'reservation:create']],
            processor: ReservationStateProcessor::class
        ),
        new Put(
            security: "is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['reservation:update']],
            normalizationContext: ['groups' => ['reservation:read']],
            validationContext: ['groups' => ['Default', 'reservation:update']],
            processor: ReservationStateProcessor::class
        ),
        new Patch(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['reservation:patch']],
            normalizationContext: ['groups' => ['reservation:read']],
            validationContext: ['groups' => ['Default', 'reservation:patch']],
            processor: ReservationStateProcessor::class
        ),
        new Delete(
            security: "is_granted('ROLE_ADMIN')",
            processor: ReservationStateProcessor::class
        )
    ]
)]
class Reservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['reservation:read', 'paiement:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Assert\NotBlank(message: 'La date de début est obligatoire')]
    #[Assert\Type(type: '\DateTimeInterface', message: 'La date de début doit être une date valide')]
    #[Groups(['reservation:read', 'reservation:create', 'reservation:update', 'paiement:read'])] 
    private ?\DateTimeInterface $dateDebut = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Assert\NotBlank(message: 'La date de fin est obligatoire')]
    #[Assert\Type(type: '\DateTimeInterface', message: 'La date de fin doit être une date valide')]
    #[Assert\GreaterThan(
        propertyPath: 'dateDebut',
        message: 'La date de fin doit être postérieure à la date de début'
    )]
    #[Groups(['reservation:read', 'reservation:create', 'reservation:update', 'paiement:read'])] 
    private ?\DateTimeInterface $dateFin = null;

    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Assert\NotBlank(message: 'Le statut est obligatoire')]
    #[Assert\Choice(
        choices: ['confirmee', 'en_attente', 'annulee', 'terminee', 'en_cours'],
        message: 'Statut de réservation non valide'
    )]
    #[Groups(['reservation:read', 'reservation:create', 'reservation:update', 'reservation:patch'])]
    private ?string $statut = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['reservation:read'])]  
    private $montantTotal = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Assert\NotBlank(message: 'Le montant de base est obligatoire')]
    #[Assert\Range(
        min: 0.01,
        max: 99999999.99,
        notInRangeMessage: 'Le montant de base doit être compris entre {{ min }}€ et {{ max }}€'
    )]
    #[Groups(['reservation:create','reservation:read', 'reservation:update'])]
    private $montantBase = null;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le client est obligatoire')]
    #[Groups(['reservation:read', 'reservation:create', 'reservation:update', 'paiement:read'])]
    private ?Client $client = null;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'La chambre est obligatoire')]
    #[Groups(['reservation:read', 'reservation:create', 'reservation:update'])]
    private ?Chambre $chambre = null;

    /**
     * @var Collection<int, Paiement>
     */
    #[ORM\OneToMany(targetEntity: Paiement::class, mappedBy: 'reservation')]
    #[Groups(['reservation:read'])]
    private Collection $paiements;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le créateur est obligatoire')]
    #[Groups(['reservation:read', 'reservation:create', 'reservation:update'])]
    private ?Utilisateur $createur = null;

    /**
     * @var Collection<int, ReservationService>
     */
    #[ORM\OneToMany(targetEntity: ReservationService::class, mappedBy: 'reservation')]
    #[Groups(['reservation:read'])]
    private Collection $reservationServices;

    public function __construct()
    {
        $this->reservationServices = new ArrayCollection();
        $this->paiements = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDateDebut(): ?\DateTimeInterface
    {
        return $this->dateDebut;
    }

    public function setDateDebut(\DateTimeInterface $dateDebut): static
    {
        $this->dateDebut = $dateDebut;
        return $this;
    }

    public function getDateFin(): ?\DateTimeInterface
    {
        return $this->dateFin;
    }

    public function setDateFin(\DateTimeInterface $dateFin): static
    {
        $this->dateFin = $dateFin;
        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        // Assainissement anti-XSS et validation
        $statut = strtolower(trim(strip_tags($statut)));
        $statut = htmlspecialchars($statut, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        $statutsValides = ['confirmee', 'en_attente', 'annulee', 'terminee', 'en_cours'];
        if (in_array($statut, $statutsValides, true)) {
            $this->statut = $statut;
        }
        return $this;
    }

    /**
     * Le montant total devient automatiquement base + services
     */
    public function getMontantTotal(): ?string
    {
        $base = (float) ($this->montantBase ?? 0.0);
        $services = $this->getTotalServicesAsFloat();
        
        return number_format($base + $services, 2, '.', '');
    }

    public function setMontantTotal(mixed $montantTotal): static
    {
        if ($montantTotal === null) {
            $this->montantTotal = null;
            return $this;
        }
        
        // Conversion intelligente pour tous les types
        if (is_int($montantTotal)) {
            // Entier : ajouter .00
            $this->montantTotal = $montantTotal . '.00';
        } elseif (is_float($montantTotal)) {
            // Float : formater avec 2 décimales
            $this->montantTotal = number_format($montantTotal, 2, '.', '');
        } elseif (is_string($montantTotal) && is_numeric($montantTotal)) {
            // String numérique : formater
            $this->montantTotal = number_format((float) $montantTotal, 2, '.', '');
        } else {
            // Autres cas : conversion standard
            $this->montantTotal = number_format((float) $montantTotal, 2, '.', '');
        }
        
        return $this;
    }

    /**
     * Retourne le montant comme float pour les calculs
     */
    public function getMontantTotalAsFloat(): float
    {
        $base = (float) ($this->montantBase ?? 0.0);
        $services = $this->getTotalServicesAsFloat();
        return $base + $services;
    }

    public function getMontantBase(): ?string
    {
        return $this->montantBase ? (string) $this->montantBase : null;
    }

    public function setMontantBase(mixed $montantBase): static
{
    if ($montantBase === null) {
        $this->montantBase = null;
        return $this;
    }
    
    // Conversion intelligente pour tous les types (même logique que setMontantTotal)
    if (is_int($montantBase)) {
        // Entier : ajouter .00
        $this->montantBase = $montantBase . '.00';
    } elseif (is_float($montantBase)) {
        // Float : formater avec 2 décimales
        $this->montantBase = number_format($montantBase, 2, '.', '');
    } elseif (is_string($montantBase) && is_numeric($montantBase)) {
        // String numérique : formater
        $this->montantBase = number_format((float) $montantBase, 2, '.', '');
    } else {
        // Autres cas : conversion standard
        $this->montantBase = number_format((float) $montantBase, 2, '.', '');
    }
    
    return $this;
}

    public function getMontantBaseAsFloat(): float
    {
        return $this->montantBase ? (float) $this->montantBase : 0.0;
    }

    /**
     * Ajoute un montant au montant total (ex : ajout d'un service ou d'une réduction)
     */
    public function addToMontantTotal(float $montant): static
    {
        $current = (float) ($this->montantTotal ?? 0.0);
        $newTotal = $current + $montant;
        $this->montantTotal = number_format($newTotal, 2, '.', '');
        return $this;
    }

    /**
     * Soustrait un montant du montant total
     */
    public function subtractFromMontantTotal(float $montant): static
    {
        $current = (float) ($this->montantTotal ?? 0.0);
        $newTotal = $current - $montant;
        // S'assurer que le montant ne devient pas négatif
        $newTotal = max(0.0, $newTotal);
        $this->montantTotal = number_format($newTotal, 2, '.', '');
        return $this;
    }

    public function getClient(): ?Client
    {
        return $this->client;
    }

    public function setClient(?Client $client): static
    {
        $this->client = $client;
        return $this;
    }

    public function getChambre(): ?Chambre
    {
        return $this->chambre;
    }

    public function setChambre(?Chambre $chambre): static
    {
        $this->chambre = $chambre;
        return $this;
    }

    /**
     * @return Collection<int, Paiement>
     */
    public function getPaiements(): Collection
    {
        return $this->paiements;
    }

    public function addPaiement(Paiement $paiement): static
    {
        if (!$this->paiements->contains($paiement)) {
            $this->paiements->add($paiement);
            $paiement->setReservation($this);
        }
        return $this;
    }

    public function removePaiement(Paiement $paiement): static
    {
        if ($this->paiements->removeElement($paiement)) {
            if ($paiement->getReservation() === $this) {
                $paiement->setReservation(null);
            }
        }
        return $this;
    }

    public function getCreateur(): ?Utilisateur
    {
        return $this->createur;
    }

    public function setCreateur(?Utilisateur $createur): static
    {
        $this->createur = $createur;
        return $this;
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
            $reservationService->setReservation($this);
        }
        return $this;
    }

    public function removeReservationService(ReservationService $reservationService): static
    {
        if ($this->reservationServices->removeElement($reservationService)) {
            if ($reservationService->getReservation() === $this) {
                $reservationService->setReservation(null);
            }
        }
        return $this;
    }

    // === MÉTHODES CALCULÉES CONSERVÉES ===

    /**
     * Calcule le montant total payé pour cette réservation
     */
    #[Groups(['reservation:read'])]
    public function getMontantPaye(): string 
    {
        $total = 0.0;
        foreach ($this->paiements as $paiement) {
            $total += (float) $paiement->getMontant();
        }
        return number_format($total, 2, '.', '');
    }

    /**
     * Version float pour compatibilité
     */
    public function getMontantPayeAsFloat(): float
    {
        return (float) $this->getMontantPaye();
    }

    /**
     * Calcule le montant restant à payer
     */
    #[Groups(['reservation:read'])]
    public function getMontantRestant(): string 
    {
        $montantTotal = $this->getMontantTotalAsFloat();
        if ($montantTotal === 0.0) {
            return '0.00';
        }
        
        $montantPaye = (float) $this->getMontantPaye();
        $restant = $montantTotal - $montantPaye;
        
        // Si négatif, retourner 0
        $restant = max(0.0, $restant);
        return number_format($restant, 2, '.', '');
    }

    /**
     * Version float pour compatibilité
     */
    public function getMontantRestantAsFloat(): float
    {
        return (float) $this->getMontantRestant();
    }

    /**
     * Détermine le statut de paiement automatiquement
     */
    #[Groups(['reservation:read'])]
    public function getStatutPaiement(): string 
    {
        $montantTotal = $this->getMontantTotalAsFloat();
        if ($montantTotal === 0.0) {
            return 'impaye';
        }
        
        $montantPaye = (float) $this->getMontantPaye();
        
        if ($montantPaye === 0.0) {
            return 'impaye';
        }
        
        // Comparaison avec tolérance pour éviter les erreurs de précision
        if (abs($montantPaye - $montantTotal) < 0.01) {
            return 'complet';
        }
        
        return 'partiel';
    }

    /**
     * Retourne le nombre de paiements effectués
     */
    #[Groups(['reservation:read'])]
    public function getNombrePaiements(): int 
    {
        return $this->paiements->count();
    }

    /**
     * Récupère tous les services de cette réservation avec leurs détails
     */
    #[Groups(['reservation:read'])]
    public function getServices(): array 
    {
        $services = [];
        foreach ($this->reservationServices as $rs) {
            $services[] = [
                'id' => $rs->getService()->getId(),
                'nom' => $rs->getService()->getNom(),
                'prix' => $rs->getService()->getPrixService(),
                'quantite' => $rs->getQuantite(),
                'prixUnitaire' => $rs->getPrixUnitaire(),
                'sousTotal' => $rs->getSousTotal(),
                'dateAjout' => $rs->getDateAjout()?->format('Y-m-d H:i:s')
            ];
        }
        return $services;
    }

    /**
     * Calcule le total des services pour cette réservation
     */
    #[Groups(['reservation:read'])]
    public function getTotalServices(): string 
    {
        $total = 0.0;
        foreach ($this->reservationServices as $rs) {
            $total += (float) $rs->getSousTotal();
        }
        return number_format($total, 2, '.', '');
    }

    /**
     * Version float pour compatibilité
     */
    public function getTotalServicesAsFloat(): float
    {
        return (float) $this->getTotalServices();
    }

    /**
     * Vérifie si un service est déjà ajouté à cette réservation
     */
    public function hasService(Service $service): bool 
    {
        foreach ($this->reservationServices as $rs) {
            if ($rs->getService()->getId() === $service->getId()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calcule le montant total de la réservation incluant les services
     */
    #[Groups(['reservation:read'])]
    public function getMontantTotalAvecServices(): string 
    {
        $montantBase = (float) ($this->montantBase ?? 0.0);
        $totalServices = (float) $this->getTotalServices();
        
        return number_format($montantBase + $totalServices, 2, '.', '');
    }

    /**
     * Version float pour compatibilité
     */
    public function getMontantTotalAvecServicesAsFloat(): float
    {
        return (float) $this->getMontantTotalAvecServices();
    }

    /**
     * Compte le nombre de services ajoutés
     */
    #[Groups(['reservation:read'])]
    public function getNombreServices(): int 
    {
        return $this->reservationServices->count();
    }
}