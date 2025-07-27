# Hotel Management System / Système de Gestion Hôtelière
**English**
HotelEase is a complete management solution featuring:
-Room, Customer and reservation management
-Payment processing
-Service management
-JWT (json web token) authentifcation
-Responsive pages
-Dynamic dashboard
**Français**
HotelEase est une solution complète de gestion hôtelière avec:
-Gestion des chambres, clients et réservations
-Suivi des clients
-Traitements des paiements
-Gestion des services annexes 
-Authentification sécurisée avec JWT 
-Pages responsives 
-Tableau de bord dynamique
## Technical Stack/Stack technique
**Frontend**
React + Vite + React Bootstrap
**Backend**
Symfony
**Database**
MySQL
### Installation & Setup / Installation & Configuration
Before you begin, ensure you have met the following requirements:
You have installed PHP >= 8
You have installed Composer
You have installed Symfony CLI
You have a running instance of a MySQL database
**Prerequisites / Prérequis**
- Node.js v18+
- PHP 8.2+
- Composer 2+
- MySQL 8+
**Backend Setup / Configuration Backend**
1.Clone the repository/ Cloner la repository:
https://github.com/medamine2003/HotelEase.git 

2.Navigate to the project directory/Naviguer au projet:
cd back-end

3.Install the dependencies/Installer les dépendances:
composer install

4.Create the database/Créer la base de données:
php bin/console doctrine:database:create

5.Run the database migrations/ Faire les migrations de la base de données:
php bin/console doctrine:migrations:migrate

**Usage**
To start the development serveur, run/ pour lancer le serveur de développement:
symfony server:start
**All routes/ Toutes les routes:**                   
Routes principales :
-------------------
/api/chambres.{_format}                  (CRUD chambres)
/api/chambres/{id}.{_format}             (CRUD chambre spécifique)
/api/clients.{_format}                   (CRUD clients) 
/api/clients/{id}.{_format}              (CRUD client spécifique)
/api/paiements.{_format}                 (CRUD paiements)
/api/paiements/{id}.{_format}            (CRUD paiement spécifique)
/api/reservations.{_format}              (CRUD réservations)
/api/reservations/{id}.{_format}         (CRUD réservation spécifique)
/api/reservation_services.{_format}      (CRUD services de réservation)
/api/reservation_services/{id}.{_format} (CRUD service de réservation spécifique)
/api/services.{_format}                  (CRUD services) 
/api/services/{id}.{_format}             (CRUD service spécifique)
/api/utilisateurs.{_format}              (CRUD utilisateurs)
/api/utilisateurs/{id}.{_format}         (CRUD utilisateur spécifique)

Routes d'authentification :
--------------------------
/api/login                                (Connexion)
/api/logout                               (Déconnexion)  
/api/me                                   (Profil utilisateur connecté)

Routes personnalisées :
----------------------
/api/reservations/{id}/add-service        (Ajouter service à réservation)
/api/reservations/{reservationId}/remove-service/{serviceId} (Supprimer service)
/api/reservations/{reservationId}/update-service/{serviceId} (Modifier quantité)
/api/reservations/{id}/list-services      (Lister services d'une réservation)
**Running Tests/lancement des tests**                                              
front-end:npm run test
back-end:php bin/phpunit

**Run the project with Docker/ Lancer le projet avec Docker**

# Lancer tous les conteneurs
docker-compose up -d

# Arrêter
docker-compose down

# Rebuild + lancer
docker-compose up --build -d

# Voir les logs
docker-compose logs -f