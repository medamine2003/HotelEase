<?php

namespace App\EventListener;

use App\Entity\Client;
use App\Entity\Enregistrement;
use App\Entity\Paiement;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Symfony\Bundle\SecurityBundle\Security;
// ce listener détecte les modifcations avant de les enregistrer dans la table enregistrement 
class ActivityListener
{
    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    public function onFlush(OnFlushEventArgs $args): void
    {
        $em = $args->getObjectManager();
        $uow = $em->getUnitOfWork();

        $user = $this->security->getUser();
        if (!$user || !is_object($user)) {
            return;
        }

        // Traiter les nouvelles entités
        $insertions = $uow->getScheduledEntityInsertions();

        foreach ($insertions as $entity) {
            // Éviter les boucles infinies
            if ($entity instanceof Enregistrement) {
                continue;
            }

            $log = null;

            if ($entity instanceof Client) {
                $log = new Enregistrement();
                $log->setUtilisateur($user);
                $log->setClient($entity);
                $log->setAction('Création d\'un client');
                $log->setDateEnregistrement(new \DateTime());
            }

            if ($entity instanceof Paiement) {
                $log = new Enregistrement();
                $log->setUtilisateur($user);
                $log->setPaiement($entity);
                if ($entity->getReservation()) {
                    $log->setClient($entity->getReservation()->getClient());
                }
                $log->setAction('Enregistrement d\'un paiement');
                $log->setDateEnregistrement(new \DateTime());
            }

            if ($log) {
                $em->persist($log);
                
                // Important : Calculer les métadonnées pour la nouvelle entité
                $classMetadata = $em->getClassMetadata(Enregistrement::class);
                $uow->computeChangeSet($classMetadata, $log);
            }
        }
    }
}