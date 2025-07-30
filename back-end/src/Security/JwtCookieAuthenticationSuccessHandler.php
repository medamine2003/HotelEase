<?php

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
// ce handler est utilisé pour la création des token jwt 
// this handler is mainly used for the creation of a new token ( and refresh token) in each login
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
        
        $jwt = $this->jwtManager->create($user);

        // Méthode pour générer un refresh token cryptographiquement sécurisé 
        $refreshTokenValue = bin2hex(random_bytes(64));
        
        // une fois un nouveau refresh token est créé, voici comment supprimer TOUS les anciens refresh tokens pour cet utilisateur
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
                
            ]
        ]);

       
        $isSecure = $request->isSecure() || $request->headers->get('X-Forwarded-Proto') === 'https';

        
        $jwtCookie = Cookie::create('jwt_token')
            ->withValue($jwt)
            ->withHttpOnly(true)
            ->withSecure($isSecure) 
            ->withSameSite('lax') 
            ->withPath('/')
            ->withExpires(new \DateTimeImmutable('+1 hour')); 

        
        $refreshCookie = Cookie::create('refresh_token')
            ->withValue($refreshTokenValue)
            ->withHttpOnly(true)
            ->withSecure($isSecure)
            ->withSameSite('lax') 
            ->withPath('/')
            ->withExpires(new \DateTimeImmutable('+7 days'));

        $response->headers->setCookie($jwtCookie);
        $response->headers->setCookie($refreshCookie);

        // Headers de sécurité supplémentaires
       
        // Headers CORS manuels
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

return $response;
        return $response;
    }
}