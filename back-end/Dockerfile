# Utilise l'image officielle PHP 8.2 avec Apache intégré
FROM php:8.2-apache

# Active le module "rewrite" d'Apache, utile pour les routes propres
RUN a2enmod rewrite

# Met à jour les paquets et installe les dépendances
RUN apt-get update \
    && apt-get install -y libzip-dev git curl unzip --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Installe les extensions PHP nécessaires
RUN docker-php-ext-install pdo mysqli pdo_mysql zip

# Télécharge et installe Composer (dernière version)
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copie la configuration Apache personnalisée
COPY docker/apache.conf /etc/apache2/sites-enabled/000-default.conf

# Définit le répertoire de travail
WORKDIR /var/www

# Copie TOUS les fichiers de l'application d'abord
COPY . /var/www

# Installe les dépendances PHP avec Composer (AVEC les dépendances dev)
# et exécute les scripts post-install
RUN composer install --optimize-autoloader --no-interaction

# Assure-vous que les permissions sont correctes
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www \
    && chmod +x /var/www/bin/console

# Expose le port 8000 (si votre app Symfony utilise ce port)
EXPOSE 8000

# Commande par défaut : démarre Apache en mode foreground
CMD ["apache2-foreground"]