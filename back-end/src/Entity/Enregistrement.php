<?php

namespace App\Entity;

use App\Repository\EnregistrementRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EnregistrementRepository::class)]
#[ORM\Table(name: 'enregistrement')]
class Enregistrement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Utilisateur::class)]
    #[ORM\JoinColumn(name: 'utilisateur_id', referencedColumnName: 'id', nullable: false,onDelete: 'SET NULL')]
    private ?Utilisateur $utilisateur = null;

    #[ORM\ManyToOne(targetEntity: Client::class, inversedBy: null)]
    #[ORM\JoinColumn(name: 'client_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Client $client = null;


    #[ORM\ManyToOne(targetEntity: Paiement::class, inversedBy: null)]
    #[ORM\JoinColumn(name: 'paiement_id', referencedColumnName: 'id', nullable: true,onDelete: 'SET NULL')]
    private ?Paiement $paiement = null;

    #[ORM\Column(type: 'string', length: 255)]
    private ?string $action = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $dateEnregistrement = null;

    public function __construct()
    {
        $this->dateEnregistrement = new \DateTime();
        
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUtilisateur(): ?Utilisateur
    {
        return $this->utilisateur;
    }

    public function setUtilisateur(?Utilisateur $utilisateur): static
    {
       
        $this->utilisateur = $utilisateur;
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

    public function getPaiement(): ?Paiement
    {
        return $this->paiement;
    }

    public function setPaiement(?Paiement $paiement): static
    {
        
        $this->paiement = $paiement;
        return $this;
    }

    public function getAction(): ?string
    {
        return $this->action;
    }

    public function setAction(string $action): static
    {
        
        $this->action = $action;
        return $this;
    }

    public function getDateEnregistrement(): ?\DateTimeInterface
    {
        return $this->dateEnregistrement;
    }

    public function setDateEnregistrement(\DateTimeInterface $dateEnregistrement): static
    {
       
        $this->dateEnregistrement = $dateEnregistrement;
        return $this;
    }
}