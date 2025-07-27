<?php
// src/Security/JwtCookieAuthenticationSuccessHandler.php
namespace App\Security;

use App\Entity\RefreshToken;
use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

class JwtCookieAuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    private JWTTokenManagerInterface $jwtManager;
    private EntityManagerInterface $entityManager;
    private RefreshTokenRepository $refreshTokenRepository;

    public function __construct(
        JWTTokenManagerInterface $jwtManager,
        EntityManagerInterface $entityManager,
        RefreshTokenRepository $refreshTokenRepository
    ) {
        $this->jwtManager = $jwtManager;
        $this->entityManager = $entityManager;
        $this->refreshTokenRepository = $refreshTokenRepository;
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): JsonResponse
    {
        $user = $token->getUser();
        error_log('=== DEBUG JWT CREATION ===');
        error_log('User Email: ' . $user->getEmail());
        error_log('User Role (BDD): ' . ($user->getRole() ?? 'NULL'));
        error_log('User getRoles(): ' . json_encode($user->getRoles()));
        error_log('=============================');
        $jwt = $this->jwtManager->create($user);

        // Générer un refresh token cryptographiquement sécurisé
        $refreshTokenValue = bin2hex(random_bytes(64));
        
        // Supprimer TOUS les anciens refresh tokens pour cet utilisateur
        $existingTokens = $this->refreshTokenRepository->findBy(['user' => $user]);
        foreach ($existingTokens as $existingToken) {
            $this->entityManager->remove($existingToken);
        }

        // Créer le nouveau refresh token
        $refreshToken = new RefreshToken();
        $refreshToken->setToken(hash('sha256', $refreshTokenValue));
        $refreshToken->setUser($user);
        $refreshToken->setExpiresAt(new \DateTimeImmutable('+7 days'));

        $this->entityManager->persist($refreshToken);
        $this->entityManager->flush();

        usleep(100000);
        $response = new JsonResponse([
            'message' => 'Connexion réussie',
            
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                // Ajoutez d'autres infos si nécessaire
            ]
        ]);

        // Déterminer si on est en HTTPS
        $isSecure = $request->isSecure() || $request->headers->get('X-Forwarded-Proto') === 'https';

        // Cookie JWT (15 minutes) - Configuration sécurisée
        $jwtCookie = Cookie::create('jwt_token')
            ->withValue($jwt)
            ->withHttpOnly(true)
            ->withSecure($isSecure) // true en production HTTPS
            ->withSameSite('lax') // Plus strict pour la sécurité
            ->withPath('/')
            ->withExpires(new \DateTimeImmutable('+1 hour')); // 15 minutes

        // Cookie refresh token (7 jours) - Configuration sécurisée
        $refreshCookie = Cookie::create('refresh_token')
            ->withValue($refreshTokenValue)
            ->withHttpOnly(true)
            ->withSecure($isSecure)
            ->withSameSite('lax') // Plus strict
            ->withPath('/')
            ->withExpires(new \DateTimeImmutable('+7 days')); // 7 jours

        $response->headers->setCookie($jwtCookie);
        $response->headers->setCookie($refreshCookie);

        // Headers de sécurité supplémentaires
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        // Headers CORS manuels
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

return $response;
        return $response;
    }
}