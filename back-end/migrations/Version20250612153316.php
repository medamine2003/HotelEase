<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250612153316 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE enregistrement (id INT AUTO_INCREMENT NOT NULL, utilisateur_id INT NOT NULL, client_id INT NOT NULL, paiement_id INT NOT NULL, INDEX IDX_15FA02FFB88E14F (utilisateur_id), INDEX IDX_15FA02F19EB6921 (client_id), INDEX IDX_15FA02F2A4C4478 (paiement_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE reservation_service (id INT AUTO_INCREMENT NOT NULL, service_id INT NOT NULL, reservation_id INT NOT NULL, INDEX IDX_86082157ED5CA9E6 (service_id), INDEX IDX_86082157B83297E7 (reservation_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE enregistrement ADD CONSTRAINT FK_15FA02FFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE enregistrement ADD CONSTRAINT FK_15FA02F19EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
        $this->addSql('ALTER TABLE enregistrement ADD CONSTRAINT FK_15FA02F2A4C4478 FOREIGN KEY (paiement_id) REFERENCES paiement (id)');
        $this->addSql('ALTER TABLE reservation_service ADD CONSTRAINT FK_86082157ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id)');
        $this->addSql('ALTER TABLE reservation_service ADD CONSTRAINT FK_86082157B83297E7 FOREIGN KEY (reservation_id) REFERENCES reservation (id)');
        $this->addSql('ALTER TABLE associer DROP FOREIGN KEY FK_FA230DB9B83297E7');
        $this->addSql('ALTER TABLE associer DROP FOREIGN KEY FK_FA230DB9ED5CA9E6');
        $this->addSql('ALTER TABLE enregistrer DROP FOREIGN KEY FK_94548382A4C4478');
        $this->addSql('ALTER TABLE enregistrer DROP FOREIGN KEY FK_9454838FB88E14F');
        $this->addSql('ALTER TABLE enregistrer DROP FOREIGN KEY FK_945483819EB6921');
        $this->addSql('DROP TABLE associer');
        $this->addSql('DROP TABLE enregistrer');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE associer (id INT AUTO_INCREMENT NOT NULL, service_id INT NOT NULL, reservation_id INT NOT NULL, INDEX IDX_FA230DB9ED5CA9E6 (service_id), INDEX IDX_FA230DB9B83297E7 (reservation_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('CREATE TABLE enregistrer (id INT AUTO_INCREMENT NOT NULL, utilisateur_id INT NOT NULL, client_id INT NOT NULL, paiement_id INT NOT NULL, INDEX IDX_9454838FB88E14F (utilisateur_id), INDEX IDX_945483819EB6921 (client_id), INDEX IDX_94548382A4C4478 (paiement_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE associer ADD CONSTRAINT FK_FA230DB9B83297E7 FOREIGN KEY (reservation_id) REFERENCES reservation (id)');
        $this->addSql('ALTER TABLE associer ADD CONSTRAINT FK_FA230DB9ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id)');
        $this->addSql('ALTER TABLE enregistrer ADD CONSTRAINT FK_94548382A4C4478 FOREIGN KEY (paiement_id) REFERENCES paiement (id)');
        $this->addSql('ALTER TABLE enregistrer ADD CONSTRAINT FK_9454838FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE enregistrer ADD CONSTRAINT FK_945483819EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
        $this->addSql('ALTER TABLE enregistrement DROP FOREIGN KEY FK_15FA02FFB88E14F');
        $this->addSql('ALTER TABLE enregistrement DROP FOREIGN KEY FK_15FA02F19EB6921');
        $this->addSql('ALTER TABLE enregistrement DROP FOREIGN KEY FK_15FA02F2A4C4478');
        $this->addSql('ALTER TABLE reservation_service DROP FOREIGN KEY FK_86082157ED5CA9E6');
        $this->addSql('ALTER TABLE reservation_service DROP FOREIGN KEY FK_86082157B83297E7');
        $this->addSql('DROP TABLE enregistrement');
        $this->addSql('DROP TABLE reservation_service');
    }
}
