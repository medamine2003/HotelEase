<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250723194556 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C744045581C868F ON client (numero_telephone)');
        $this->addSql('ALTER TABLE reservation CHANGE statut statut VARCHAR(50) NOT NULL, CHANGE montant_total montant_total NUMERIC(10, 2) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX UNIQ_C744045581C868F ON client');
        $this->addSql('ALTER TABLE reservation CHANGE statut statut VARCHAR(150) NOT NULL, CHANGE montant_total montant_total DOUBLE PRECISION NOT NULL');
    }
}
