pipeline {
    agent {
        label "${AGENT}"
    }
    
    environment {
        // Variables globales
        REPO_URL = "https://github.com/medamine2003/HotelEase"
        COMPOSE_PROJECT_NAME = "hotelease"
    }
    
    stages {
        stage('Continuous Integration') {
            parallel {
                stage('Backend CI') {
                    steps {
                        git branch: "main", url: "${REPO_URL}"
                        dir('back-end') {
                            sh 'composer install --no-dev --optimize-autoloader'
                            // Tests backend avec SQLite
                            sh 'php bin/console doctrine:database:create --env=test --if-not-exists'
                            sh 'php bin/console doctrine:schema:create --env=test'
                            sh 'php bin/console doctrine:fixtures:load --env=test --no-interaction'
                            sh 'php bin/phpunit'
                        }
                    }
                }
                stage('Frontend CI') {
                    steps {
                        git branch: "main", url: "${REPO_URL}"
                        dir('front-end') {
                            sh 'npm install'
                            sh 'npm run test -- --watchAll=false'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Continuous Delivery') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('back-end') {
                            sh "docker build --platform linux/amd64 . -t ${DOCKERHUB_USERNAME}/hotelease-backend:latest"
                            sh "docker login -u ${DOCKERHUB_USERNAME} -p ${DOCKERHUB_PASSWORD}"
                            sh "docker push ${DOCKERHUB_USERNAME}/hotelease-backend:latest"
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('front-end') {
                            sh "docker build --platform linux/amd64 . -t ${DOCKERHUB_USERNAME}/hotelease-frontend:latest"
                            sh "docker login -u ${DOCKERHUB_USERNAME} -p ${DOCKERHUB_PASSWORD}"
                            sh "docker push ${DOCKERHUB_USERNAME}/hotelease-frontend:latest"
                        }
                    }
                }
            }
        }
        
        stage('Continuous Deployment') {
            steps {
                sh '''
                    sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no ${SERVER_USERNAME}@${SERVER_IP} \
                    "echo 'Connexion SSH réussie au serveur de production'"
                    # cd /root && \
                    # curl -O https://raw.githubusercontent.com/medamine2003/HotelEase/main/docker-compose.yml && \
                    # curl -O https://raw.githubusercontent.com/medamine2003/HotelEase/main/back-end/.env.prod && \
                    # mkdir -p back-end && mv .env.prod back-end/ && \
                    # docker compose -p hotelease pull && \
                    # docker compose -p hotelease up -d && \
                    # docker compose -p hotelease exec -T backend php bin/console doctrine:migrations:migrate --no-interaction
                '''
            }
        }
    }
    
    post {
        always {
            // Nettoyage
            sh 'docker system prune -f'
        }
        success {
            echo '🎉 Déploiement réussi ! Application disponible sur http://${SERVER_IP}:5173'
        }
        failure {
            echo '❌ Échec du pipeline. Vérifiez les logs.'
        }
    }
}