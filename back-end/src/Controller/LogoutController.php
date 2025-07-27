<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

class LogoutController extends AbstractController
{
    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $response = new JsonResponse(['message' => 'Déconnexion réussie']);

        // Utiliser la MÊME logique que dans JwtCookieAuthenticationSuccessHandler
        $isSecure = $request->isSecure() || $request->headers->get('X-Forwarded-Proto') === 'https';
        
        // DEBUG
        error_log("LOGOUT DEBUG - isSecure: " . ($isSecure ? 'true' : 'false'));
        error_log("LOGOUT DEBUG - Request scheme: " . $request->getScheme());

        // Supprimer JWT cookie avec EXACTEMENT les mêmes paramètres
        $expiredJwtCookie = Cookie::create('jwt_token')
            ->withValue('')
            ->withHttpOnly(true)
            ->withSecure($isSecure)
            ->withSameSite('lax')
            ->withPath('/')
            ->withExpires(new \DateTimeImmutable('-1 day'));

        // Supprimer refresh token cookie
        $expiredRefreshCookie = Cookie::create('refresh_token')
            ->withValue('')
            ->withHttpOnly(true)
            ->withSecure($isSecure)
            ->withSameSite('lax')
            ->withPath('/')
            ->withExpires(new \DateTimeImmutable('-1 day'));

        $response->headers->setCookie($expiredJwtCookie);
        $response->headers->setCookie($expiredRefreshCookie);
        
        // DEBUG - Voir les cookies générés
        error_log("LOGOUT DEBUG - Cookies dans la réponse:");
        foreach ($response->headers->getCookies() as $cookie) {
            error_log("Cookie: " . $cookie->getName() . " = " . $cookie->getValue() . 
                     " | Expires: " . $cookie->getExpiresTime() . 
                     " | Secure: " . ($cookie->isSecure() ? 'true' : 'false') .
                     " | HttpOnly: " . ($cookie->isHttpOnly() ? 'true' : 'false'));
        }

        // Headers CORS
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return $response;
    }
}