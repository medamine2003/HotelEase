<?php

namespace App\Controller\Api;

use App\Repository\RefreshTokenRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class RefreshTokenController extends AbstractController 
{
    #[Route('/api/token/refresh', name: 'api_refresh_token', methods: ['POST'])]
    #[IsGranted('PUBLIC_ACCESS')] 
    public function __invoke(
        Request $request,
        RefreshTokenRepository $refreshTokenRepository,
        JWTTokenManagerInterface $JWTManager
    ): JsonResponse {
        error_log("=== REFRESH DEBUG ===");
        error_log("All cookies: " . json_encode($request->cookies->all()));
        error_log("Refresh token: " . ($request->cookies->get('refresh_token') ?: 'NULL'));
        $refreshToken = $request->cookies->get('refresh_token');

        if (!$refreshToken) {
            return new JsonResponse(['error' => 'No refresh token'], Response::HTTP_UNAUTHORIZED);
        }

        $hashedToken = hash('sha256', $refreshToken);
        $tokenEntity = $refreshTokenRepository->findOneBy(['token' => $hashedToken]);

        if (!$tokenEntity || $tokenEntity->getExpiresAt() < new \DateTimeImmutable()) {
            return new JsonResponse(['error' => 'Invalid refresh token'], Response::HTTP_UNAUTHORIZED);
        }

        $user = $tokenEntity->getUser();
        $newJwt = $JWTManager->create($user);
        $newRefreshToken = bin2hex(random_bytes(64));
        $tokenEntity->setToken(hash('sha256', $newRefreshToken));
        $tokenEntity->setExpiresAt(new \DateTimeImmutable('+7 days'));

        $refreshTokenRepository->save($tokenEntity, true);

        $response = new JsonResponse(['message' => 'Token refreshed']);

        $response->headers->setCookie(
            Cookie::create('jwt_token')
                ->withValue($newJwt)
                ->withHttpOnly(true)
                ->withSecure(false)
                ->withSameSite('Lax')
                ->withPath('/')
                ->withExpires(time() + 3600)
        );

        $response->headers->setCookie(
            Cookie::create('refresh_token')
                ->withValue($newRefreshToken)
                ->withHttpOnly(true)
                ->withSecure(false)
                ->withSameSite('Lax')
                ->withPath('/')
                ->withExpires(time() + 7 * 24 * 3600)
        );

        // ✅ AJOUTER CES HEADERS CORS
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}