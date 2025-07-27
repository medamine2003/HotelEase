# HotelEase – Hotel Management System / Système de Gestion Hôtelière

## English

HotelEase is a complete management solution featuring:

- Room, Customer, and Reservation management  
- Payment processing  
- Service management  
- JWT (JSON Web Token) authentication  
- Responsive pages  
- Dynamic dashboard  

## Français

HotelEase est une solution complète de gestion hôtelière avec :

- Gestion des chambres, clients et réservations  
- Traitement des paiements  
- Gestion des services annexes  
- Authentification sécurisée avec JWT  
- Pages responsives  
- Tableau de bord dynamique  

---

## Technical Stack / Stack technique

### Frontend

React + Vite + React Bootstrap

### Backend

Symfony

### Database

MySQL

---

## Installation & Setup / Installation & Configuration

Before you begin, ensure you have met the following requirements:

- PHP >= 8.2  
- Composer 2+  
- Symfony CLI  
- MySQL 8+  
- Node.js v18+

---

### Backend Setup / Configuration Backend

1. Clone the repository:  
   `https://github.com/medamine2003/HotelEase.git`

2. Navigate to the backend directory:  
   `cd back-end`

3. Install dependencies:  
   `composer install`

4. Create the database:  
   `php bin/console doctrine:database:create`

5. Run migrations:  
   `php bin/console doctrine:migrations:migrate`

6. Start the development server:  
   `symfony server:start`

---

### API Routes

#### Main routes

- `/api/chambres.{_format}`  
- `/api/chambres/{id}.{_format}`  
- `/api/clients.{_format}`  
- `/api/clients/{id}.{_format}`  
- `/api/paiements.{_format}`  
- `/api/paiements/{id}.{_format}`  
- `/api/reservations.{_format}`  
- `/api/reservations/{id}.{_format}`  
- `/api/reservation_services.{_format}`  
- `/api/reservation_services/{id}.{_format}`  
- `/api/services.{_format}`  
- `/api/services/{id}.{_format}`  
- `/api/utilisateurs.{_format}`  
- `/api/utilisateurs/{id}.{_format}`  

#### Authentication routes

- `/api/login`  
- `/api/logout`  
- `/api/me`  

#### Custom routes

- `/api/reservations/{id}/add-service`  
- `/api/reservations/{reservationId}/remove-service/{serviceId}`  
- `/api/reservations/{reservationId}/update-service/{serviceId}`  
- `/api/reservations/{id}/list-services`  

---

### Frontend Setup / Configuration Frontend

1. Navigate to the frontend directory:  
   `cd front-end`

2. Install dependencies:  
   `npm install`

---

## Running Tests / Lancement des tests

- Frontend: `npm run test`  
- Backend: `php bin/phpunit`

---

## Run the Project with Docker / Lancer le projet avec Docker

- Start all containers:  
  `docker-compose up -d`

- Stop containers:  
  `docker-compose down`

- Rebuild and start:  
  `docker-compose up --build -d`

- View logs:  
  `docker-compose logs -f`
