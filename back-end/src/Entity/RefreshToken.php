<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use App\Repository\RefreshTokenRepository;

#[ORM\Entity(repositoryClass: RefreshTokenRepository::class)]
#[ORM\Table(name: "refresh_tokens")]
#[ORM\Index(columns: ["token"], name: "refresh_token_idx")]
// cette entité gère la création d'un refresh token
// This entity is responsible for the creation of a refresh token
class RefreshToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(unique: true)]
    private string $token; 

    #[ORM\ManyToOne(targetEntity: Utilisateur::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private Utilisateur $user;

    #[ORM\Column]
    private \DateTimeImmutable $expiresAt;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    /**
     * Enregistre le *hash* du token
     */
    
    public function setToken(string $token): self
    {
        $this->token = $token; // Pas de hash automatique
        return $this;
    }

    /**
     * Vérifie si le hash correspond à un token brut
     */
    public function isValidToken(string $token): bool
    {
        return hash_equals($this->token, hash('sha256', $token));
    }

    public function getUser(): Utilisateur
    {
        return $this->user;
    }

    public function setUser(Utilisateur $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): self
    {
        $this->expiresAt = $expiresAt;
        return $this;
    }
}
