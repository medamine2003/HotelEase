<?php

namespace App\Tests\Entity;

use App\Entity\Service;
use PHPUnit\Framework\TestCase;

class ServiceTest extends TestCase
{
    private Service $service;

    protected function setUp(): void
    {
        $this->service = new Service();
    }

    /**
     * Test création d'un service valide
     */
    public function testCreateValidService(): void
    {
        $this->service->setNom('Spa Premium');
        $this->service->setPrixService(45.50);

        $this->assertEquals('Spa Premium', $this->service->getNom());
        $this->assertEquals('45.50', $this->service->getPrixService());
        $this->assertEquals(45.50, $this->service->getPrixServiceAsFloat());
    }

    /**
     * Test assainissement XSS dans le nom
     */
    public function testNomSanitization(): void
    {
        $this->service->setNom('<script>alert("xss")</script>Massage  relaxant');
        
        
        $this->assertEquals('alert(&quot;xss&quot;)Massage relaxant', $this->service->getNom());
    }

    /**
     * Test formatage automatique du prix
     */
    public function testPrixFormatting(): void
    {
        
        $this->service->setPrixService(25);
        $this->assertEquals('25.00', $this->service->getPrixService());

       
        $this->service->setPrixService(33.456789);
        $this->assertEquals('33.46', $this->service->getPrixService());

        
        $this->service->setPrixService('19.9');
        $this->assertEquals('19.90', $this->service->getPrixService());
    }

    /**
     * Test gestion prix null
     */
    public function testPrixNull(): void
    {
        $this->service->setPrixService(null);
        
        $this->assertNull($this->service->getPrixService());
        $this->assertEquals(0.0, $this->service->getPrixServiceAsFloat());
    }

    /**
     * Test méthodes métier
     */
    public function testBusinessMethods(): void
    {
        
        $this->assertFalse($this->service->isUsedInReservations());
        $this->assertEquals(0, $this->service->getUsageCount());
        $this->assertEquals('0.00', $this->service->getTotalRevenue());
    }

    /**
     * Test normalisation espaces multiples
     */
    public function testMultipleSpacesNormalization(): void
    {
        $this->service->setNom('   Service    avec    espaces   ');
        
        $this->assertEquals('Service avec espaces', $this->service->getNom());
    }

    /**
     * Test prix avec valeurs extrêmes
     */
    public function testPrixExtremeValues(): void
    {
        
        $this->service->setPrixService(0.01);
        $this->assertEquals('0.01', $this->service->getPrixService());

        
        $this->service->setPrixService(99999.99);
        $this->assertEquals('99999.99', $this->service->getPrixService());
    }
}