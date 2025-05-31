<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250326153149 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE associer (reservation_id INT NOT NULL, service_id INT NOT NULL, INDEX IDX_FA230DB9B83297E7 (reservation_id), INDEX IDX_FA230DB9ED5CA9E6 (service_id), PRIMARY KEY(reservation_id, service_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE associer ADD CONSTRAINT FK_FA230DB9B83297E7 FOREIGN KEY (reservation_id) REFERENCES reservation (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE associer ADD CONSTRAINT FK_FA230DB9ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reservation_service DROP FOREIGN KEY FK_86082157ED5CA9E6');
        $this->addSql('ALTER TABLE reservation_service DROP FOREIGN KEY FK_86082157B83297E7');
        $this->addSql('DROP TABLE reservation_service');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE reservation_service (reservation_id INT NOT NULL, service_id INT NOT NULL, INDEX IDX_86082157ED5CA9E6 (service_id), INDEX IDX_86082157B83297E7 (reservation_id), PRIMARY KEY(reservation_id, service_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE reservation_service ADD CONSTRAINT FK_86082157ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reservation_service ADD CONSTRAINT FK_86082157B83297E7 FOREIGN KEY (reservation_id) REFERENCES reservation (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE associer DROP FOREIGN KEY FK_FA230DB9B83297E7');
        $this->addSql('ALTER TABLE associer DROP FOREIGN KEY FK_FA230DB9ED5CA9E6');
        $this->addSql('DROP TABLE associer');
    }
}
