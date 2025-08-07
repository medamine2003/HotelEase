<?php

namespace App\DataFixtures;

use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{

    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public function load(ObjectManager $manager): void
    {

        $utilisateur = new \App\Entity\Utilisateur();
        $utilisateur->setNom('Test User');
        $utilisateur->setEmail('test@example.com');
        $utilisateur->setMotDePasse($this->passwordHasher->hashPassword($utilisateur, 'AdminEase2025*'));
        $utilisateur->setRole("['ROLE_ADMIN']");
        $manager->persist($utilisateur);
        $manager->flush();
    }
}