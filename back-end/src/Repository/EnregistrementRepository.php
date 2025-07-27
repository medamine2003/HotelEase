<?php

namespace App\Repository;

use App\Entity\Enregistrement;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Enregistrement>
 */
class EnregistrementRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Enregistrement::class);
    }

    /**
     * @return Enregistrement[] Returns an array of Enregistrement objects
     */
    public function findByUser($userId): array
    {
        return $this->createQueryBuilder('e')
            ->andWhere('e.utilisateur = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('e.dateEnregistrement', 'DESC')
            ->getQuery()
            ->getResult()
        ;
    }

    /**
     * @return Enregistrement[] Returns recent activity
     */
    public function findRecentActivity($limit = 10): array
    {
        return $this->createQueryBuilder('e')
            ->orderBy('e.dateEnregistrement', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult()
        ;
    }
}