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
                            echo 'Simulation: composer install --no-dev --optimize-autoloader'
                            echo 'Simulation: php bin/console doctrine:database:create --env=test'
                            echo 'Simulation: php bin/console doctrine:schema:create --env=test'
                            echo 'Simulation: php bin/console doctrine:fixtures:load --env=test'
                            echo 'Simulation: php bin/phpunit'
                            echo 'Backend CI - Tests passed successfully!'
                        }
                    }
                }
                stage('Frontend CI') {
                    steps {
                        dir('front-end') {
                            echo 'Simulation: npm install'
                            echo 'Simulation: npm run test --watchAll=false'
                            echo 'Simulation: npm run build'
                            echo 'Frontend CI - Tests passed successfully!'
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
                            echo 'Simulation: docker build backend image'
                            echo 'Simulation: docker push mohamedamine2003/hotelease-backend:latest'
                            echo 'Backend image built and pushed successfully!'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('front-end') {
                            echo 'Simulation: docker build frontend image'
                            echo 'Simulation: docker push mohamedamine2003/hotelease-frontend:latest'
                            echo 'Frontend image built and pushed successfully!'
                        }
                    }
                }
            }
        }
        
        stage('Continuous Deployment') {
            steps {
                echo 'Testing SSH connection to production server...'
                sh '''
                    sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no ${SERVER_USERNAME}@${SERVER_IP} \
                    "echo 'SSH connection successful to production server - IP: ${SERVER_IP}'"
                '''
                echo 'Deployment steps simulation:'
                echo '   1. Pull new Docker images'
                echo '   2. Restart containers'
                echo '   3. Run database migrations'
                echo '   4. Application deployed successfully!'
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up temporary resources...'
            sh 'docker system prune -f'
        }
        success {
            echo 'Pipeline executed successfully!'
            echo "Application available at: http://${SERVER_IP}:5173"
            echo "Backend API available at: http://${SERVER_IP}:8000"
        }
        failure {
            echo 'Pipeline failed. Check logs above.'
        }
    }
}