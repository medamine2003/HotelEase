<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250327082629 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE associer (id INT AUTO_INCREMENT NOT NULL, service_id INT NOT NULL, reservation_id INT NOT NULL, INDEX IDX_FA230DB9ED5CA9E6 (service_id), INDEX IDX_FA230DB9B83297E7 (reservation_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE associer ADD CONSTRAINT FK_FA230DB9ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id)');
        $this->addSql('ALTER TABLE associer ADD CONSTRAINT FK_FA230DB9B83297E7 FOREIGN KEY (reservation_id) REFERENCES reservation (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE associer DROP FOREIGN KEY FK_FA230DB9ED5CA9E6');
        $this->addSql('ALTER TABLE associer DROP FOREIGN KEY FK_FA230DB9B83297E7');
        $this->addSql('DROP TABLE associer');
    }
}
