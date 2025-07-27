<?php

namespace App\Entity;

use App\Repository\ReservationServiceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Annotation\Groups;

#[ApiResource]
#[ORM\Entity(repositoryClass: ReservationServiceRepository::class)]
class ReservationService
{
   #[ORM\Id]
   #[ORM\GeneratedValue]
   #[ORM\Column]
   #[Groups(['reservation:read'])]
   private ?int $id = null;

   #[ORM\ManyToOne(inversedBy: 'reservationServices')]
   #[ORM\JoinColumn(nullable: false)]
   #[Groups(['reservation:read'])]
   private ?Service $service = null;

   #[ORM\ManyToOne(inversedBy: 'reservationServices')]
   #[ORM\JoinColumn(nullable: false)]
   private ?Reservation $reservation = null;

   #[ORM\Column]
   #[Groups(['reservation:read', 'reservation:write'])]
   private ?int $quantite = 1;

   #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
   #[Groups(['reservation:read', 'reservation:write'])]
   private ?float $prixUnitaire = null;

   #[ORM\Column(type: Types::DATETIME_MUTABLE)]
   #[Groups(['reservation:read'])]
   private ?\DateTimeInterface $dateAjout = null;

   public function __construct()
   {
       $this->dateAjout = new \DateTime();
       $this->quantite = 1;
   }

   public function getId(): ?int
   {
       return $this->id;
   }

   public function getService(): ?Service
   {
       return $this->service;
   }

   public function setService(?Service $service): static
   {
       $this->service = $service;
       return $this;
   }

   public function getReservation(): ?Reservation
   {
       return $this->reservation;
   }

   public function setReservation(?Reservation $reservation): static
   {
       $this->reservation = $reservation;
       return $this;
   }

   public function getQuantite(): ?int
   {
       return $this->quantite;
   }

   public function setQuantite(int $quantite): static
   {
       $this->quantite = $quantite;
       return $this;
   }

   public function getPrixUnitaire(): ?float
   {
       return $this->prixUnitaire;
   }

   public function setPrixUnitaire(float $prixUnitaire): static
   {
       $this->prixUnitaire = $prixUnitaire;
       return $this;
   }

   public function getDateAjout(): ?\DateTimeInterface
   {
       return $this->dateAjout;
   }

   public function setDateAjout(\DateTimeInterface $dateAjout): static
   {
       $this->dateAjout = $dateAjout;
       return $this;
   }

   /**
    * Calcule le sous-total (quantité × prix unitaire)
    */
   #[Groups(['reservation:read'])]
   public function getSousTotal(): float
   {
       return ($this->quantite ?? 1) * ($this->prixUnitaire ?? 0);
   }
}