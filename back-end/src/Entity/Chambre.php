<?php 

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\ChambreRepository;
use App\State\ChambreStateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
// cette entité gère la création d'une chambre avec des conditions de validation (appliquant une logique métier)
// This entity is responsible for the creation of a room with some condictions
#[ORM\Entity(repositoryClass: ChambreRepository::class)]
#[ORM\Table(name: 'chambre')]
#[ApiResource(
    operations: [
        new Get(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['chambre:read']]
        ),
        new GetCollection(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['chambre:read']]
        ),
        new Post(
            security: "is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['chambre:create']],
            normalizationContext: ['groups' => ['chambre:read']],
            validationContext: ['groups' => ['Default', 'chambre:create']],
            processor: ChambreStateProcessor::class
        ),
        new Put(
            security: "is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['chambre:update']],
            normalizationContext: ['groups' => ['chambre:read']],
            validationContext: ['groups' => ['Default', 'chambre:update']],
            processor: ChambreStateProcessor::class
        ),
        new Patch(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['chambre:patch']],
            normalizationContext: ['groups' => ['chambre:read']],
            validationContext: ['groups' => ['Default', 'chambre:patch']],
            processor: ChambreStateProcessor::class
        ),
        new Delete(
            security: "is_granted('ROLE_ADMIN')",
            processor: ChambreStateProcessor::class
        )
    ]
)]
#[UniqueEntity(
    fields: ['numero'],
    message: 'Ce numéro de chambre existe déjà.'
)]
class Chambre
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['chambre:read', 'reservation:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 10, unique: true)]
    #[Assert\NotBlank(message: 'Le numéro de chambre est obligatoire')]
    #[Assert\Length(
        min: 1,
        max: 10,
        minMessage: 'Le numéro doit contenir au moins {{ limit }} caractère',
        maxMessage: 'Le numéro ne peut pas dépasser {{ limit }} caractères'
    )]
    #[Assert\Regex(
        pattern: '/^[A-Z0-9]+$/i',
        message: 'Le numéro ne peut contenir que des lettres et des chiffres'
    )]
    #[Groups(['chambre:read', 'reservation:read', 'chambre:create', 'chambre:update'])]
    private ?string $numero = null;

    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Assert\NotBlank(message: 'Le type de chambre est obligatoire')]
    #[Assert\Length(
        min: 2,
        max: 50,
        minMessage: 'Le type doit contenir au moins {{ limit }} caractères',
        maxMessage: 'Le type ne peut pas dépasser {{ limit }} caractères'
    )]
    #[Assert\Choice(
        choices: ['Standard', 'Confort', 'Suite', 'Familiale', 'Deluxe', 'Junior Suite', 'Suite Présidentielle'],
        message: 'Type de chambre non valide'
    )]
    #[Groups(['chambre:read', 'reservation:read', 'chambre:create', 'chambre:update'])]
    private ?string $type = null;

    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Assert\NotBlank(message: 'L\'état de la chambre est obligatoire')]
    #[Assert\Choice(
        choices: ['disponible', 'occupee', 'maintenance', 'hors_service'],
        message: 'État de chambre non valide'
    )]
    #[Groups(['chambre:read', 'reservation:read', 'chambre:create', 'chambre:update', 'chambre:patch'])]
    private ?string $etat = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Assert\NotBlank(message: 'La capacité est obligatoire')]
    #[Assert\Type(type: 'integer', message: 'La capacité doit être un nombre entier')]
    #[Assert\Range(
        min: 1,
        max: 10,
        notInRangeMessage: 'La capacité doit être comprise entre {{ min }} et {{ max }} personnes'
    )]
    #[Groups(['chambre:read', 'reservation:read', 'chambre:create', 'chambre:update'])]
    private ?int $capacite = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 8, scale: 2)]
    #[Assert\NotBlank(message: 'Le prix est obligatoire')]
    #[Assert\Type(type: 'numeric', message: 'Le prix doit être un nombre')]
    #[Assert\Range(
        min: 0.01,
        max: 999999.99,
        notInRangeMessage: 'Le prix doit être compris entre {{ min }}€ et {{ max }}€'
    )]
    #[Assert\Regex(
        pattern: '/^\d{1,6}(\.\d{1,2})?$/',
        message: 'Le prix doit avoir au maximum 2 décimales'
    )]
    #[Groups(['chambre:read', 'chambre:create', 'chambre:update'])]
    private ?string $prixChambre = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(
        max: 1000,
        maxMessage: 'La description ne peut pas dépasser {{ limit }} caractères'
    )]
    #[Groups(['chambre:read', 'chambre:create', 'chambre:update'])]
    private ?string $description = null;

    /**
     * @var Collection<int, Reservation>
     */
    #[ORM\OneToMany(targetEntity: Reservation::class, mappedBy: 'chambre')]
    private Collection $reservations;

    public function __construct()
    {
        $this->reservations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNumero(): ?string
    {
        return $this->numero;
    }

    public function setNumero(string $numero): static
    {
        $numero = strtoupper(trim(strip_tags($numero)));
        $numero = preg_replace('/[^A-Z0-9]/', '', $numero);
        $this->numero = $numero;
        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $type = trim(strip_tags($type));
        $type = ucwords(strtolower($type));
        $type = preg_replace('/[<>"\']/', '', $type);
        $this->type = $type;
        return $this;
    }

    public function getEtat(): ?string
    {
        return $this->etat;
    }

    public function setEtat(string $etat): static
    {
        $etatsValides = ['disponible', 'occupee', 'maintenance', 'hors_service'];
        $etat = strtolower(trim($etat));
        if (in_array($etat, $etatsValides, true)) {
            $this->etat = $etat;
        }
        return $this;
    }

    public function getCapacite(): ?int
    {
        return $this->capacite;
    }

    public function setCapacite(int $capacite): static
    {
        if ($capacite >= 1 && $capacite <= 10) {
            $this->capacite = $capacite;
        }
        return $this;
    }

    public function getPrixChambre(): ?string
    {
        return $this->prixChambre;
    }

    public function setPrixChambre(string $prixChambre): static
    {
        $prix = trim(str_replace([' ', ','], ['', '.'], $prixChambre));
        if (is_numeric($prix) && $prix >= 0 && $prix <= 999999.99) {
            $this->prixChambre = number_format((float)$prix, 2, '.', '');
        }
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        if ($description !== null) {
            $description = trim($description);
            $description = htmlspecialchars($description, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $description = strip_tags($description);
            $description = substr($description, 0, 1000);
            $this->description = $description ?: null;
        } else {
            $this->description = null;
        }
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
            $reservation->setChambre($this);
        }
        return $this;
    }

    public function removeReservation(Reservation $reservation): static
    {
        if ($this->reservations->removeElement($reservation)) {
            if ($reservation->getChambre() === $this) {
                $reservation->setChambre(null);
            }
        }
        return $this;
    }
}
