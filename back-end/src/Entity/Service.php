<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\ServiceRepository;

#[ORM\Entity(repositoryClass: ServiceRepository::class)]
#[ApiResource]
class Service
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 80)]
    private ?string $nom = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?float $prixService = null;

    /**
     * @var Collection<int, Associer>
     */
    #[ORM\OneToMany(targetEntity: Associer::class, mappedBy: 'service')]
    private Collection $associations;

    public function __construct()
    {
        $this->associations = new ArrayCollection();
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
        $this->nom = $nom;
        return $this;
    }

    public function getPrixService(): ?float
    {
        return $this->prixService;
    }

    public function setPrixService(float $prixService): static
    {
        $this->prixService = $prixService;
        return $this;
    }

    /**
     * @return Collection<int, Associer>
     */
    public function getAssociations(): Collection
    {
        return $this->associations;
    }

    public function addAssociation(Associer $association): static
    {
        if (!$this->associations->contains($association)) {
            $this->associations->add($association);
            $association->setService($this);
        }

        return $this;
    }

    public function removeAssociation(Associer $association): static
    {
        if ($this->associations->removeElement($association)) {
            // set the owning side to null (unless already changed)
            if ($association->getService() === $this) {
                $association->setService(null);
            }
        }

        return $this;
    }

    

    

    
}
