<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\PaiementRepository;
use App\State\PaiementStateProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PaiementRepository::class)]
#[ApiResource(
    operations: [
        new Get(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['paiement:read']]
        ),
        new GetCollection(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['paiement:read']]
        ),
        new Post(
            security: "is_granted('ROLE_RECEPTIONNISTE') or is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['paiement:create']],
            normalizationContext: ['groups' => ['paiement:read']],
            validationContext: ['groups' => ['Default', 'paiement:create']],
            processor: PaiementStateProcessor::class
        ),
        new Put(
            security: "is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['paiement:update']],
            normalizationContext: ['groups' => ['paiement:read']],
            validationContext: ['groups' => ['Default', 'paiement:update']],
            processor: PaiementStateProcessor::class
        ),
        new Patch(
            security: "is_granted('ROLE_ADMIN')",
            denormalizationContext: ['groups' => ['paiement:patch']],
            normalizationContext: ['groups' => ['paiement:read']],
            validationContext: ['groups' => ['Default', 'paiement:patch']],
            processor: PaiementStateProcessor::class
        ),
        new Delete(
            security: "is_granted('ROLE_ADMIN')",
            processor: PaiementStateProcessor::class
        )
    ]
)]
class Paiement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['paiement:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Assert\NotBlank(message: 'Le montant est obligatoire')]
    #[Assert\Type(type: 'numeric', message: 'Le montant doit être un nombre')]
    #[Assert\Range(
        min: 0.01,
        max: 999999.99,
        notInRangeMessage: 'Le montant doit être compris entre {{ min }}€ et {{ max }}€'
    )]
    #[Assert\Regex(
        pattern: '/^\d{1,7}(\.\d{1,2})?$/',
        message: 'Le montant doit avoir au maximum 2 décimales'
    )]
    #[Groups(['paiement:read', 'paiement:create', 'paiement:update'])]
    private ?string $montant = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank(message: 'La méthode de paiement est obligatoire')]
    #[Assert\Choice(
        choices: ['especes', 'carte_bancaire', 'cheque', 'virement', 'paypal', 'stripe'],
        message: 'Méthode de paiement non valide'
    )]
    #[Groups(['paiement:read', 'paiement:create', 'paiement:update'])]
    private ?string $methodePaiement = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Assert\NotBlank(message: 'La date de paiement est obligatoire')]
    #[Assert\Type(type: \DateTimeInterface::class, message: 'La date doit être valide')]
    #[Assert\LessThanOrEqual(value: 'now', message: 'La date de paiement ne peut pas être dans le futur')]
    #[Groups(['paiement:read', 'paiement:create', 'paiement:update'])]
    private ?\DateTimeInterface $datePaiement = null;

    #[ORM\ManyToOne(inversedBy: 'paiements')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['paiement:read', 'paiement:create', 'paiement:update'])]
    private ?Reservation $reservation = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank(message: 'Le type de paiement est obligatoire')]
    #[Assert\Choice(
        choices: ['acompte', 'solde', 'remboursement', 'frais'],
        message: 'Type de paiement non valide'
    )]
    #[Groups(['paiement:read', 'paiement:create', 'paiement:update'])]
    private ?string $typePaiement = 'solde';

    #[ORM\Column(length: 100, nullable: true)]
    #[Assert\Length(max: 100, maxMessage: 'Le numéro de transaction ne peut pas dépasser {{ limit }} caractères')]
    #[Assert\Regex(
        pattern: '/^[A-Z0-9\-_]*$/i',
        message: 'Le numéro de transaction ne peut contenir que des lettres, chiffres, tirets et underscores'
    )]
    #[Groups(['paiement:read', 'paiement:create', 'paiement:update'])]
    private ?string $numeroTransaction = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 500, maxMessage: 'Le commentaire ne peut pas dépasser {{ limit }} caractères')]
    #[Groups(['paiement:read', 'paiement:create', 'paiement:update'])]
    private ?string $commentaire = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMontant(): ?string
    {
        return $this->montant;
    }

    public function setMontant(string $montant): static
    {
        // Nettoyage et validation du montant
        $montant = trim(str_replace([' ', ','], ['', '.'], $montant));
        
        // Validation du format numérique
        if (is_numeric($montant) && $montant >= 0 && $montant <= 999999.99) {
            // Forcer 2 décimales maximum
            $this->montant = number_format((float)$montant, 2, '.', '');
        }
        
        return $this;
    }

    public function getMethodePaiement(): ?string
    {
        return $this->methodePaiement;
    }

    public function setMethodePaiement(string $methodePaiement): static
    {
        // Validation stricte - seules les valeurs autorisées
        $methodesValides = ['especes', 'carte_bancaire', 'cheque', 'virement', 'paypal', 'stripe'];
        $methode = strtolower(trim($methodePaiement));
        
        if (in_array($methode, $methodesValides, true)) {
            $this->methodePaiement = $methode;
        }
        
        return $this;
    }

    public function getDatePaiement(): ?\DateTimeInterface
    {
        return $this->datePaiement;
    }

    public function setDatePaiement(\DateTimeInterface $datePaiement): static
    {
        // Vérification que la date n'est pas dans le futur
        $aujourdhui = new \DateTime();
        $aujourdhui->setTime(23, 59, 59); // Fin de journée
        
        if ($datePaiement <= $aujourdhui) {
            $this->datePaiement = $datePaiement;
        }
        
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

    public function getTypePaiement(): ?string
    {
        return $this->typePaiement;
    }

    public function setTypePaiement(string $typePaiement): static
    {
        // Validation stricte - seules les valeurs autorisées
        $typesValides = ['acompte', 'solde', 'remboursement', 'frais'];
        $type = strtolower(trim($typePaiement));
        
        if (in_array($type, $typesValides, true)) {
            $this->typePaiement = $type;
        }
        
        return $this;
    }

    public function getNumeroTransaction(): ?string
    {
        return $this->numeroTransaction;
    }

    public function setNumeroTransaction(?string $numeroTransaction): static
    {
        if ($numeroTransaction !== null) {
            // Nettoyage et validation
            $numero = strtoupper(trim($numeroTransaction));
            // Supprimer les caractères non autorisés
            $numero = preg_replace('/[^A-Z0-9\-_]/', '', $numero);
            $numero = substr($numero, 0, 100); // Limiter la longueur
            
            $this->numeroTransaction = $numero ?: null;
        } else {
            $this->numeroTransaction = null;
        }
        
        return $this;
    }

    public function getCommentaire(): ?string
    {
        return $this->commentaire;
    }

    public function setCommentaire(?string $commentaire): static
    {
        if ($commentaire !== null) {
            // Assainissement complet anti-XSS
            $commentaire = trim($commentaire);
            $commentaire = htmlspecialchars($commentaire, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            // Supprimer les balises potentiellement dangereuses
            $commentaire = strip_tags($commentaire);
            // Limiter la longueur
            $commentaire = substr($commentaire, 0, 500);
            
            $this->commentaire = $commentaire ?: null;
        } else {
            $this->commentaire = null;
        }
        
        return $this;
    }
}