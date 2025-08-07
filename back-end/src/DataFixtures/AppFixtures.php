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
        // Utilisateur Admin
        $admin = new \App\Entity\Utilisateur();
        $admin->setNom('Admin User');
        $admin->setEmail('admin@hotelease.com');
        $admin->setMotDePasse($this->passwordHasher->hashPassword($admin, 'Password123*'));
        $admin->setRole('ROLE_ADMIN'); // ✅ Correct - juste la string
        $manager->persist($admin);

        // Utilisateur Réceptionniste
        $receptionniste = new \App\Entity\Utilisateur();
        $receptionniste->setNom('Receptionniste User');
        $receptionniste->setEmail('receptionniste@hotelease.com');
        $receptionniste->setMotDePasse($this->passwordHasher->hashPassword($receptionniste, 'Password123*'));
        $receptionniste->setRole('ROLE_RECEPTIONNISTE'); // ✅ Correct
        $manager->persist($receptionniste);

        $manager->flush();
    }
}