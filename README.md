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

7. Generate the jwt keys:
   `php bin/console lexik:jwt:generate-keypair`

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

## Docker Configuration / Configuration Docker

Before running with Docker, update your `.env` file to match your `docker-compose.yml` database settings:

### If your docker-compose.yml has:
```yaml
database:
  image: mariadb:10.4
  container_name: hotelease_db_container
  environment:
    MYSQL_ROOT_PASSWORD: root_password
    MYSQL_DATABASE: hotel_administration
    MYSQL_USER: hotelease_user
    MYSQL_PASSWORD: hotelease_pass
    MYSQL_ROOT_HOST: '%'
```

### Update your `.env` to:
```env
DATABASE_URL="mysql://hotelease_user:hotelease_pass@database:3306/hotel_administration?serverVersion=10.4.32-MariaDB&charset=utf8mb4"
```

## Server Deployment / Déploiement sur serveur

- Access container:
    ```bash
    docker-compose exec app bash 
    ```
    or 
    ```docker run -it mohamedamine2003/hotelease-backend:latest bash```


- Run migrations:
    ```bash
    php bin/console doctrine:migrations:migrate --no-interaction
    ```

- Generate JWT keys:
    ```bash
    php bin/console lexik:jwt:generate-keypair
    ```

- Load fixtures:
    ```bash
    php bin/console doctrine:fixtures:load --no-interaction
    ```

---

## API Examples / Exemples d'API

### cURL Example
```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"username": "admin@hotel.com", "password": "password123"}'

# Get all rooms
curl -X GET http://localhost:8000/api/chambres \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

### Postman Example
```
Method: POST
URL: http://localhost:8000/api/login
Headers: 
  Content-Type: application/json
  Accept: application/json
Body (raw JSON):
{
  "username": "admin@hotel.com",
  "password": "password123"
}
```