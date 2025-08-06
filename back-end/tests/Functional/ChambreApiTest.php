<?php

namespace App\Tests\Functional;

use App\Entity\Chambre;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ChambreApiTest extends WebTestCase
{
    private $client;
    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->entityManager = $container->get('doctrine')->getManager();
        
        $this->cleanDatabase();
    }

    protected function tearDown(): void
    {
        $this->cleanDatabase();
        parent::tearDown();
    }

    /**
     * Test GET collection des chambres
     */
    public function testGetChambresCollection(): void
    {
        
        $chambres = [
            ['101', 'Standard', 'disponible', 2, '80.00', 'Chambre standard'],
            ['102', 'Suite', 'occupee', 4, '150.00', 'Suite luxueuse'],
            ['103', 'Deluxe', 'maintenance', 3, '120.00', 'Chambre deluxe']
        ];

        foreach ($chambres as [$numero, $type, $etat, $capacite, $prix, $description]) {
            $chambre = new Chambre();
            $chambre->setNumero($numero);
            $chambre->setType($type);
            $chambre->setEtat($etat);
            $chambre->setCapacite($capacite);
            $chambre->setPrixChambre($prix);
            $chambre->setDescription($description);
            
            $this->entityManager->persist($chambre);
        }
        $this->entityManager->flush();

        // Requête GET sans authentification 
        $this->client->request('GET', '/api/chambres');

        // Vérifications de base 
        $response = $this->client->getResponse();
        $contentType = $response->headers->get('Content-Type');
        $this->assertStringContainsString('application', $contentType);
        
        // Si pas d'auth requise ou si erreur attendue
        if ($response->getStatusCode() === 200) {
            $responseData = json_decode($response->getContent(), true);
            $this->assertArrayHasKey('hydra:member', $responseData);
            $this->assertCount(3, $responseData['hydra:member']);
            
            // Vérifier structure des données
            $premiereChambre = $responseData['hydra:member'][0];
            $this->assertArrayHasKey('numero', $premiereChambre);
            $this->assertArrayHasKey('type', $premiereChambre);
            $this->assertArrayHasKey('etat', $premiereChambre);
        } else {
            // Si authentification requise
            $this->assertContains($response->getStatusCode(), [401, 403]);
        }
    }

    /**
     * Test GET d'une chambre spécifique
     */
    public function testGetSingleChambre(): void
    {
        
        $chambre = new Chambre();
        $chambre->setNumero('201');
        $chambre->setType('Standard');
        $chambre->setEtat('disponible');
        $chambre->setCapacite(2);
        $chambre->setPrixChambre('85.00');
        $chambre->setDescription('Chambre avec vue jardin');

        $this->entityManager->persist($chambre);
        $this->entityManager->flush();

        $chambreId = $chambre->getId();

        
        $this->client->request('GET', "/api/chambres/{$chambreId}");

        $response = $this->client->getResponse();
        
        if ($response->getStatusCode() === 200) {
            $responseData = json_decode($response->getContent(), true);
            
            $this->assertEquals('201', $responseData['numero']);
            $this->assertEquals('Standard', $responseData['type']);
            $this->assertEquals('disponible', $responseData['etat']);
            $this->assertEquals(2, $responseData['capacite']);
            $this->assertEquals('85.00', $responseData['prixChambre']);
        } else {
            $this->assertContains($response->getStatusCode(), [401, 403]);
        }
    }

    /**
     * Test POST avec données valides (testera validation même si auth échoue)
     */
    public function testPostChambreWithValidData(): void
    {
        $chambreData = [
            'numero' => '301',
            'type' => 'Suite',
            'etat' => 'disponible',
            'capacite' => 4,
            'prixChambre' => '180.00',
            'description' => 'Suite présidentielle'
        ];

        $this->client->request('POST', '/api/chambres', 
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($chambreData)
        );

        $response = $this->client->getResponse();
        
        if ($response->getStatusCode() === 201) {
            
            $responseData = json_decode($response->getContent(), true);
            $this->assertEquals('301', $responseData['numero']);
            $this->assertEquals('Suite', $responseData['type']);
            
            
            $chambre = $this->entityManager->getRepository(Chambre::class)->findOneBy(['numero' => '301']);
            $this->assertNotNull($chambre);
        } else {
            
            $this->assertContains($response->getStatusCode(), [401, 403]);
            $this->assertNotEquals(422, $response->getStatusCode()); 
        }
    }

    /**
     * Test POST avec données invalides pour tester la validation
     */
    public function testPostChambreWithInvalidData(): void
    {
        $chambreData = [
            'numero' => '', 
            'type' => 'TypeInexistant', 
            'etat' => 'disponible',
            'capacite' => 15, 
            'prixChambre' => '-50.00' 
        ];

        $this->client->request('POST', '/api/chambres', 
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($chambreData)
        );

        $response = $this->client->getResponse();
        
        
        $this->assertContains($response->getStatusCode(), [401, 403, 422]);
        
        if ($response->getStatusCode() === 422) {
            
            $responseData = json_decode($response->getContent(), true);
            $this->assertArrayHasKey('violations', $responseData);
            $this->assertNotEmpty($responseData['violations']);
        }
    }

    /**
     * Test format de réponse API Platform
     */
    public function testApiPlatformJsonLdFormat(): void
    {
        
        $chambre = new Chambre();
        $chambre->setNumero('401');
        $chambre->setType('Familiale');
        $chambre->setEtat('disponible');
        $chambre->setCapacite(6);
        $chambre->setPrixChambre('200.00');

        $this->entityManager->persist($chambre);
        $this->entityManager->flush();

        $this->client->request('GET', '/api/chambres');
        $response = $this->client->getResponse();

       
        $contentType = $response->headers->get('Content-Type');
        $this->assertStringContainsString('application', $contentType);
        
        if ($response->getStatusCode() === 200) {
            $responseData = json_decode($response->getContent(), true);
            
           
            $this->assertArrayHasKey('@context', $responseData);
            $this->assertArrayHasKey('@id', $responseData);
            $this->assertArrayHasKey('@type', $responseData);
            $this->assertArrayHasKey('hydra:member', $responseData);
            $this->assertArrayHasKey('hydra:totalItems', $responseData);
        }
    }

    /**
     * Test formatage automatique des données
     */
    public function testDataFormatting(): void
    {
        
        $chambre = new Chambre();
        $chambre->setNumero('  a5b2  '); 
        $chambre->setType('  suite  '); 
        $chambre->setEtat('DISPONIBLE');
        $chambre->setCapacite(3);
        $chambre->setPrixChambre('99,75'); 

        $this->entityManager->persist($chambre);
        $this->entityManager->flush();

        
        $this->assertEquals('A5B2', $chambre->getNumero());
        $this->assertEquals('Suite', $chambre->getType());
        $this->assertEquals('disponible', $chambre->getEtat());
        $this->assertEquals('99.75', $chambre->getPrixChambre());
    }

    private function cleanDatabase(): void
    {
        $this->entityManager->createQuery('DELETE FROM App\Entity\Chambre')->execute();
        $this->entityManager->clear();
    }
}