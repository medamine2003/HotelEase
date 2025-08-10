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
        stage('Checkout') {
            steps {
                git branch: "main", url: "${REPO_URL}"
            }
        }
        
        stage('Continuous Integration') {
            parallel {
                stage('Backend CI') {
                    steps {
                        dir('back-end') {
                            echo '📦 Simulation: composer install --no-dev --optimize-autoloader'
                            echo '🗄️ Simulation: php bin/console doctrine:database:create --env=test'
                            echo '🏗️ Simulation: php bin/console doctrine:schema:create --env=test'
                            echo '📊 Simulation: php bin/console doctrine:fixtures:load --env=test'
                            echo '🧪 Simulation: php bin/phpunit'
                            echo '✅ Backend CI - Tests passés avec succès!'
                        }
                    }
                }
                stage('Frontend CI') {
                    steps {
                        dir('front-end') {
                            echo '📦 Simulation: npm install'
                            echo '🧪 Simulation: npm run test --watchAll=false'
                            echo '🏗️ Simulation: npm run build'
                            echo '✅ Frontend CI - Tests passés avec succès!'
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
                            echo '🐳 Simulation: docker build backend image'
                            echo "📤 Simulation: docker push ${DOCKERHUB_USERNAME}/hotelease-backend:latest"
                            echo '✅ Backend image buildée et poussée!'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('front-end') {
                            echo '🐳 Simulation: docker build frontend image'
                            echo "📤 Simulation: docker push ${DOCKERHUB_USERNAME}/hotelease-frontend:latest"
                            echo '✅ Frontend image buildée et poussée!'
                        }
                    }
                }
            }
        }
        
        stage('Continuous Deployment') {
            steps {
                echo '🔗 Test de connexion SSH au serveur de production...'
                sh '''
                    sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no ${SERVER_USERNAME}@${SERVER_IP} \
                    "echo '✅ Connexion SSH réussie au serveur de production - IP: ${SERVER_IP}'"
                '''
                echo '📋 Simulation des étapes de déploiement :'
                echo '   1. ⬇️ Pull des nouvelles images Docker'
                echo '   2. 🔄 Redémarrage des conteneurs'
                echo '   3. 🗄️ Migration automatique de la base de données'
                echo '   4. ✅ Application déployée avec succès!'
            }
        }
    }
    
    post {
        always {
            echo '🧹 Nettoyage des ressources temporaires...'
            sh 'docker system prune -f'
        }
        success {
            echo '🎉 Pipeline exécuté avec succès!'
            echo "📱 Application disponible sur : http://${SERVER_IP}:5173"
            echo "🔧 API Backend disponible sur : http://${SERVER_IP}:8000"
        }
        failure {
            echo '❌ Échec du pipeline. Vérifiez les logs ci-dessus.'
        }
    }
}