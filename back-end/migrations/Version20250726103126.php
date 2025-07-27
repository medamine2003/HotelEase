<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250726103126 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enregistrement DROP FOREIGN KEY FK_15FA02F19EB6921');
        $this->addSql('ALTER TABLE enregistrement ADD CONSTRAINT FK_15FA02F19EB6921 FOREIGN KEY (client_id) REFERENCES client (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE enregistrement DROP FOREIGN KEY FK_15FA02F19EB6921');
        $this->addSql('ALTER TABLE enregistrement ADD CONSTRAINT FK_15FA02F19EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
    }
}
