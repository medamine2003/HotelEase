<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250723123845 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enregistrement ADD date_enregistrement DATETIME NOT NULL, ADD action VARCHAR(100) DEFAULT NULL, CHANGE client_id client_id INT DEFAULT NULL, CHANGE paiement_id paiement_id INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enregistrement DROP date_enregistrement, DROP action, CHANGE client_id client_id INT NOT NULL, CHANGE paiement_id paiement_id INT NOT NULL');
    }
}
