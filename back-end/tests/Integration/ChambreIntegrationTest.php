<?php

namespace App\Tests\Integration;

use App\Entity\Chambre;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class ChambreIntegrationTest extends KernelTestCase
{
    private EntityManagerInterface $entityManager;
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->entityManager = static::getContainer()->get('doctrine')->getManager();
        $this->validator = static::getContainer()->get('validator');
        
       
        $this->cleanDatabase();
    }

    protected function tearDown(): void
    {
        $this->cleanDatabase();
        parent::tearDown();
    }

    /**
     * Test création et persistance d'une chambre valide
     */
    public function testCreateValidChambre(): void
    {
        $chambre = new Chambre();
        $chambre->setNumero('101');
        $chambre->setType('Standard');
        $chambre->setEtat('disponible');
        $chambre->setCapacite(2);
        $chambre->setPrixChambre('89.50');
        $chambre->setDescription('Chambre standard avec vue sur jardin');

       
        $violations = $this->validator->validate($chambre);
        $this->assertCount(0, $violations);

        
        $this->entityManager->persist($chambre);
        $this->entityManager->flush();

        
        $savedChambre = $this->entityManager->getRepository(Chambre::class)->findOneBy(['numero' => '101']);
        
        $this->assertNotNull($savedChambre);
        $this->assertEquals('101', $savedChambre->getNumero());
        $this->assertEquals('Standard', $savedChambre->getType());
        $this->assertEquals('disponible', $savedChambre->getEtat());
        $this->assertEquals(2, $savedChambre->getCapacite());
        $this->assertEquals('89.50', $savedChambre->getPrixChambre());
    }

    /**
     * Test contrainte d'unicité du numéro
     */
    public function testUniqueNumeroConstraint(): void
    {
        
        $chambre1 = new Chambre();
        $chambre1->setNumero('102');
        $chambre1->setType('Suite');
        $chambre1->setEtat('disponible');
        $chambre1->setCapacite(4);
        $chambre1->setPrixChambre('150.00');

        $this->entityManager->persist($chambre1);
        $this->entityManager->flush();

        // Deuxième chambre avec même numéro
        $chambre2 = new Chambre();
        $chambre2->setNumero('102'); 
        $chambre2->setType('Standard');
        $chambre2->setEtat('disponible');
        $chambre2->setCapacite(2);
        $chambre2->setPrixChambre('80.00');

        
        $violations = $this->validator->validate($chambre2);
        $this->assertGreaterThan(0, $violations);
        $this->assertStringContainsString('Ce numéro de chambre existe déjà', $violations[0]->getMessage());
    }

    /**
     * Test validation des contraintes
     */
    public function testValidationConstraints(): void
    {
        $chambre = new Chambre();
        
        
        $violations = $this->validator->validate($chambre);
        $this->assertGreaterThan(0, $violations);

        
        $chambre->setNumero('103');
        $chambre->setType('Standard');
        $chambre->setEtat('disponible');
        $chambre->setCapacite(15);
        $chambre->setPrixChambre('50.00');

        $violations = $this->validator->validate($chambre);
        $this->assertGreaterThan(0, $violations);
        
        
        $capaciteViolation = null;
        foreach ($violations as $violation) {
            if ($violation->getPropertyPath() === 'capacite') {
                $capaciteViolation = $violation;
                break;
            }
        }
        $this->assertNotNull($capaciteViolation);
    }

    /**
     * Test type de chambre invalide
     */
    public function testInvalidChambreType(): void
    {
        $chambre = new Chambre();
        $chambre->setNumero('104');
        $chambre->setType('TypeInexistant'); 
        $chambre->setEtat('disponible');
        $chambre->setCapacite(2);
        $chambre->setPrixChambre('75.00');

        $violations = $this->validator->validate($chambre);
        $this->assertGreaterThan(0, $violations);
        
        $typeViolation = null;
        foreach ($violations as $violation) {
            if ($violation->getPropertyPath() === 'type') {
                $typeViolation = $violation;
                break;
            }
        }
        $this->assertNotNull($typeViolation);
        $this->assertStringContainsString('Type de chambre non valide', $typeViolation->getMessage());
    }

    /**
     * Test modification d'une chambre
     */
    public function testUpdateChambre(): void
    {
       
        $chambre = new Chambre();
        $chambre->setNumero('105');
        $chambre->setType('Standard');
        $chambre->setEtat('disponible');
        $chambre->setCapacite(2);
        $chambre->setPrixChambre('60.00');

        $this->entityManager->persist($chambre);
        $this->entityManager->flush();
        $chambreId = $chambre->getId();

        // Modification
        $chambre->setType('Confort');
        $chambre->setPrixChambre('85'); 
        $chambre->setEtat('maintenance');

        $this->entityManager->flush();

        
        $this->entityManager->clear();
        $updatedChambre = $this->entityManager->find(Chambre::class, $chambreId);

        $this->assertEquals('Confort', $updatedChambre->getType());
        $this->assertEquals('85', $updatedChambre->getPrixChambre());
        $this->assertEquals('maintenance', $updatedChambre->getEtat());
    }

    /**
     * Test suppression d'une chambre
     */
    public function testDeleteChambre(): void
    {
        $chambre = new Chambre();
        $chambre->setNumero('106');
        $chambre->setType('Suite');
        $chambre->setEtat('disponible');
        $chambre->setCapacite(4);
        $chambre->setPrixChambre('120.00');

        $this->entityManager->persist($chambre);
        $this->entityManager->flush();
        $chambreId = $chambre->getId();

        
        $this->entityManager->remove($chambre);
        $this->entityManager->flush();

        
        $deletedChambre = $this->entityManager->find(Chambre::class, $chambreId);
        $this->assertNull($deletedChambre);
    }

    /**
     * Test formatage automatique des données
     */
    public function testDataFormatting(): void
    {
        $chambre = new Chambre();
        $chambre->setNumero('  a1b2  '); 
        $chambre->setType('  standard  '); 
        $chambre->setEtat('DISPONIBLE');
        $chambre->setCapacite(3);
        $chambre->setPrixChambre('99,50'); 

        $this->entityManager->persist($chambre);
        $this->entityManager->flush();

        
        $this->assertEquals('A1B2', $chambre->getNumero());
        $this->assertEquals('Standard', $chambre->getType());
        $this->assertEquals('disponible', $chambre->getEtat());
        $this->assertEquals('99.50', $chambre->getPrixChambre());
    }

    private function cleanDatabase(): void
    {
        $this->entityManager->createQuery('DELETE FROM App\Entity\Chambre')->execute();
        $this->entityManager->clear();
    }
}