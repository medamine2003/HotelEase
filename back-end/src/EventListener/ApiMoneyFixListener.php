<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class ApiMoneyFixListener implements EventSubscriberInterface
{
    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        
        // Seulement pour les API
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }
        
        // Seulement POST/PUT/PATCH
        if (!in_array($request->getMethod(), ['POST', 'PUT', 'PATCH'])) {
            return;
        }
        
        $content = $request->getContent();
        if (empty($content)) {
            return;
        }
        
        $data = json_decode($content, true);
        if (!$data) {
            return;
        }
        
        // Fixer montantTotal si c'est un nombre
        if (isset($data['montantTotal']) && is_numeric($data['montantTotal'])) {
            $data['montantTotal'] = number_format((float) $data['montantTotal'], 2, '.', '');
            
            // Remplacer le contenu de la requête
            $request->initialize(
                $request->query->all(),
                $request->request->all(), 
                $request->attributes->all(),
                $request->cookies->all(),
                $request->files->all(),
                $request->server->all(),
                json_encode($data)
            );
        }
    }
    
    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => ['onKernelRequest', 200]];
    }
}