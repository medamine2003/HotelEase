<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250326165650 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE enregistrer (id INT AUTO_INCREMENT NOT NULL, utilisateur_id INT NOT NULL, client_id INT NOT NULL, paiement_id INT NOT NULL, INDEX IDX_9454838FB88E14F (utilisateur_id), INDEX IDX_945483819EB6921 (client_id), INDEX IDX_94548382A4C4478 (paiement_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE enregistrer ADD CONSTRAINT FK_9454838FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE enregistrer ADD CONSTRAINT FK_945483819EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
        $this->addSql('ALTER TABLE enregistrer ADD CONSTRAINT FK_94548382A4C4478 FOREIGN KEY (paiement_id) REFERENCES paiement (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enregistrer DROP FOREIGN KEY FK_9454838FB88E14F');
        $this->addSql('ALTER TABLE enregistrer DROP FOREIGN KEY FK_945483819EB6921');
        $this->addSql('ALTER TABLE enregistrer DROP FOREIGN KEY FK_94548382A4C4478');
        $this->addSql('DROP TABLE enregistrer');
    }
}
