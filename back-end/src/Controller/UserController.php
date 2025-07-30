<?php
namespace App\Controller;

use App\Entity\Utilisateur;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request; 
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
// ce controller détecte s'il y a un utilisateur connecté si oui il affiche directement la page souhaitée si non il affiche une erreur et raffiche donc la page de connexion /login
class UserController extends AbstractController
{
#[Route('/api/me', name: 'api_me', methods: ['GET'])]
public function me(Request $request, #[CurrentUser] ?Utilisateur $user): JsonResponse
{
    if (!$user) {
        $response = new JsonResponse(['error' => 'Unauthorized'], 401);
    } else {
        $response = new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
        ]);
    }
    
    // Headers CORS manuels
    $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:5173');
    $response->headers->set('Access-Control-Allow-Credentials', 'true');
    
    return $response;
}
}