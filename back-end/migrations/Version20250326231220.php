<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250326231220 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE associer DROP FOREIGN KEY FK_FA230DB9B83297E7');
        $this->addSql('ALTER TABLE associer DROP FOREIGN KEY FK_FA230DB9ED5CA9E6');
        $this->addSql('DROP TABLE associer');
        $this->addSql('ALTER TABLE paiement ADD utilisateur_id INT NOT NULL, ADD client_id INT NOT NULL, ADD chambre_id INT NOT NULL');
        $this->addSql('ALTER TABLE paiement ADD CONSTRAINT FK_B1DC7A1EFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE paiement ADD CONSTRAINT FK_B1DC7A1E19EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
        $this->addSql('ALTER TABLE paiement ADD CONSTRAINT FK_B1DC7A1E9B177F54 FOREIGN KEY (chambre_id) REFERENCES chambre (id)');
        $this->addSql('CREATE INDEX IDX_B1DC7A1EFB88E14F ON paiement (utilisateur_id)');
        $this->addSql('CREATE INDEX IDX_B1DC7A1E19EB6921 ON paiement (client_id)');
        $this->addSql('CREATE INDEX IDX_B1DC7A1E9B177F54 ON paiement (chambre_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE associer (reservation_id INT NOT NULL, service_id INT NOT NULL, INDEX IDX_FA230DB9B83297E7 (reservation_id), INDEX IDX_FA230DB9ED5CA9E6 (service_id), PRIMARY KEY(reservation_id, service_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE associer ADD CONSTRAINT FK_FA230DB9B83297E7 FOREIGN KEY (reservation_id) REFERENCES reservation (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE associer ADD CONSTRAINT FK_FA230DB9ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE paiement DROP FOREIGN KEY FK_B1DC7A1EFB88E14F');
        $this->addSql('ALTER TABLE paiement DROP FOREIGN KEY FK_B1DC7A1E19EB6921');
        $this->addSql('ALTER TABLE paiement DROP FOREIGN KEY FK_B1DC7A1E9B177F54');
        $this->addSql('DROP INDEX IDX_B1DC7A1EFB88E14F ON paiement');
        $this->addSql('DROP INDEX IDX_B1DC7A1E19EB6921 ON paiement');
        $this->addSql('DROP INDEX IDX_B1DC7A1E9B177F54 ON paiement');
        $this->addSql('ALTER TABLE paiement DROP utilisateur_id, DROP client_id, DROP chambre_id');
    }
}
