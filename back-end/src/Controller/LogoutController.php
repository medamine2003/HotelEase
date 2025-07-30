<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
// ce controller gère la déconnexion et il supprime le token et le refresh token
class LogoutController extends AbstractController
{
    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $response = new JsonResponse(['message' => 'Déconnexion réussie']);

        
        $isSecure = $request->isSecure() || $request->headers->get('X-Forwarded-Proto') === 'https';
        


        // Supprimer JWT cookie avec EXACTEMENT les mêmes paramètres que j'ai lors de la création 
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
        
        

        // Headers CORS 
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return $response;
    }
}