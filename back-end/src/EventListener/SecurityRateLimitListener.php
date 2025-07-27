<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\RateLimiter\RateLimiterFactory;

/**
 * Event Listener pour la sécurité anti brute-force
 */
class SecurityRateLimitListener
{
    public function __construct(
        private RateLimiterFactory $loginAttemptsLimiter,
        private RateLimiterFactory $apiGlobalLimiter,
        private RateLimiterFactory $tokenRefreshLimiter,
        private RateLimiterFactory $adminEndpointsLimiter
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();
        $clientIp = $request->getClientIp();

        // Protection endpoint login
        if ($path === '/api/login') {
            $limiter = $this->loginAttemptsLimiter->create($clientIp);
            
            // Stocker l'IP et le limiter pour traitement après réponse
            $request->attributes->set('_rate_limit_ip', $clientIp);
            $request->attributes->set('_rate_limiter', $limiter);
            return;
        }

        // Protection refresh token
        if ($path === '/api/token/refresh') {
            $this->checkRateLimit(
                $event,
                $this->tokenRefreshLimiter,
                $clientIp,
                'Trop de demandes de refresh token'
            );
            return;
        }

        // Protection endpoints admin
        if (str_starts_with($path, '/api/admin')) {
            $this->checkRateLimit(
                $event,
                $this->adminEndpointsLimiter,
                $clientIp,
                'Limite dépassée pour les fonctions d\'administration'
            );
            return;
        }

        // Endpoints exclus du rate limiting global
        $excludedPaths = [
            '/api/me',
            '/api/logout',
            '/api/utilisateurs',
            '/api/paiements',
            '/api/chambres',
            '/api/clients',
            '/api/reservations',
            '/api/services',
            '/api/reservation_services',
        ];

        foreach ($excludedPaths as $excluded) {
            if (str_starts_with($path, $excluded)) {
                return;
            }
}


        // Protection globale API
        if (str_starts_with($path, '/api/')) {
            $this->checkRateLimit(
                $event,
                $this->apiGlobalLimiter,
                $clientIp,
                'Limite de requêtes API dépassée'
            );
        }
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $response = $event->getResponse();
        $path = $request->getPathInfo();

        // Traitement spécifique pour les tentatives de login
        if ($path === '/api/login' && $request->attributes->has('_rate_limiter')) {
            $limiter = $request->attributes->get('_rate_limiter');
            
            if ($response->getStatusCode() === 401) {
                // Vérifier si on peut encore faire des tentatives
                $testConsumption = $limiter->consume(0);
                
                if ($testConsumption->getRemainingTokens() <= 0) {
                    // Plus de tentatives autorisées - retourner 429
                    $response->setStatusCode(429);
                    $response->setContent(json_encode([
                        'error' => 'Trop de tentatives de connexion échouées',
                        'message' => 'Veuillez patienter avant de réessayer',
                        'retry_after' => $testConsumption->getRetryAfter(),
                        'type' => 'rate_limit_exceeded'
                    ]));
                    $response->headers->set('Content-Type', 'application/json');
                    return;
                }
                
                // Login échoué - consommer un token
                $limiter->consume(1);
            }
        }
    }

    private function checkRateLimit(
        RequestEvent $event,
        RateLimiterFactory $limiterFactory,
        string $clientIp,
        string $errorMessage
    ): void {
        $limiter = $limiterFactory->create($clientIp);
        $consumption = $limiter->consume();

        if (!$consumption->isAccepted()) {
            $response = new JsonResponse([
                'error' => $errorMessage,
                'message' => 'Veuillez patienter avant de réessayer',
                'retry_after' => $consumption->getRetryAfter(),
                'type' => 'rate_limit_exceeded'
            ], 429);

            $event->setResponse($response);
        }
    }
}