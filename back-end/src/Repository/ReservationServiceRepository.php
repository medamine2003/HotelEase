<?php

namespace App\Repository;

use App\Entity\ReservationService;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReservationService>
 */
class ReservationServiceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReservationService::class);
    }

    // Vous pouvez garder les méthodes commentées si vous voulez
}