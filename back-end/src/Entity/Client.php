<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\ClientRepository;
use App\State\ClientStateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
// cette entité gère la création d'un client avec des conditions de validation (appliquant une logique métier)
// This entity is responsible for the creation of a customer with some condictions

#[ORM\Entity(repositoryClass: ClientRepository::class)]
#[UniqueEntity(fields: ['numeroTelephone'], message: 'Ce numéro de téléphone est déjà utilisé.')]
#[ApiResource(
    operations: [
        new Get(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['client:read']]
        ),
        new GetCollection(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['client:read']]
        ),
        new Post(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['client:write']],
            normalizationContext: ['groups' => ['client:read']],
            processor: ClientStateProcessor::class
        ),
        new Put(
            security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_RECEPTIONNISTE')",
            denormalizationContext: ['groups' => ['client:write']],
            normalizationContext: ['groups' => ['client:read']],
            processor: ClientStateProcessor::class
        ),
        new Patch(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['client:write']],
            normalizationContext: ['groups' => ['client:read']],
            processor: ClientStateProcessor::class
        ),
        new Delete(
            security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_RECEPTIONNISTE')",
            processor: ClientStateProcessor::class
        )
    ]
)]
class Client
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['client:read', 'reservation:read', 'paiement:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Length(
        min: 2,
        max: 120,
        minMessage: 'Le nom doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le nom ne doit pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^[a-zA-ZÀ-ÿ\s\'-]+$/u',
        message: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'
    )]
    #[Groups(['client:read', 'client:write', 'reservation:read', 'paiement:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank(message: 'Le prénom est obligatoire.')]
    #[Assert\Length(
        min: 2,
        max: 120,
        minMessage: 'Le prénom doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le prénom ne doit pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^[a-zA-ZÀ-ÿ\s\'-]+$/u',
        message: 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'
    )]
    #[Groups(['client:read', 'client:write', 'reservation:read', 'paiement:read'])]
    private ?string $prenom = null;

    #[ORM\Column(length: 20, unique: true)]
    #[Assert\NotBlank(message: 'Le numéro de téléphone est obligatoire.')]
    #[Assert\Length(
        min: 6,
        max: 17,
        minMessage: 'Le numéro de téléphone doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le numéro de téléphone ne doit pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^\+?[1-9]\d{1,14}$/',
        message: 'Le numéro de téléphone n\'est pas valide (format international attendu).'
    )]
    #[Groups(['client:read', 'client:write', 'reservation:read'])]
    private ?string $numeroTelephone = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Length(
        max: 255,
        maxMessage: 'L\'adresse de facturation ne doit pas dépasser {{ limit }} caractères.'
    )]
    #[Groups(['client:read', 'client:write', 'reservation:read'])]
    private ?string $adresseFacturation = null;

    /**
     * @var Collection<int, Reservation>
     */
    #[ORM\OneToMany(targetEntity: Reservation::class, mappedBy: 'client', cascade: ['persist', 'remove'])]
    #[Groups(['client:read'])]
    private Collection $reservations;

    public function __construct()
    {
        $this->reservations = new ArrayCollection();
    }

    // Getters & setters avec normalisation et assainissement

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
        $nom = trim($nom);
        $nom = htmlspecialchars($nom, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $nom = preg_replace('/[<>"\']/', '', $nom);
        $nom = ucwords(strtolower($nom));
        $this->nom = $nom;
        return $this;
    }

    public function getPrenom(): ?string
    {
        return $this->prenom;
    }

    public function setPrenom(string $prenom): static
    {
        $prenom = trim($prenom);
        $prenom = htmlspecialchars($prenom, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $prenom = preg_replace('/[<>"\']/', '', $prenom);
        $prenom = ucwords(strtolower($prenom));
        $this->prenom = $prenom;
        return $this;
    }

    public function getNumeroTelephone(): ?string
    {
        return $this->numeroTelephone;
    }

    public function setNumeroTelephone(string $numeroTelephone): static
    {
        $tel = trim($numeroTelephone);
        $tel = preg_replace('/[^0-9+]/', '', $tel);
        if (str_starts_with($tel, '0033')) {
            $tel = '+33' . substr($tel, 4);
        } elseif (str_starts_with($tel, '33') && strlen($tel) == 11) {
            $tel = '+' . $tel;
        }
        $this->numeroTelephone = $tel;
        return $this;
    }

    public function getAdresseFacturation(): ?string
    {
        return $this->adresseFacturation;
    }

    public function setAdresseFacturation(?string $adresseFacturation): static
    {
        if ($adresseFacturation !== null) {
            $adresse = trim($adresseFacturation);
            $adresse = htmlspecialchars($adresse, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $adresse = strip_tags($adresse);
            $adresse = preg_replace('/[^\p{L}\p{N}\s\.,\-\']/u', '', $adresse);
            $adresse = substr($adresse, 0, 255);
            $this->adresseFacturation = $adresse ?: null;
        } else {
            $this->adresseFacturation = null;
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
            $reservation->setClient($this);
        }
        return $this;
    }

    public function removeReservation(Reservation $reservation): static
    {
        if ($this->reservations->removeElement($reservation)) {
            if ($reservation->getClient() === $this) {
                $reservation->setClient(null);
            }
        }
        return $this;
    }
}
