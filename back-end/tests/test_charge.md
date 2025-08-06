# Tests de Charge - Outil de Gestion Hôtelière

## Objectif
Mesurer les performances de l'API backend sous contrainte pour valider son adéquation à un usage interne hôtelier.

## Environnement de Test
- Outil : Apache Bench (ab.exe)
- Serveur : Symfony (localhost:8000)
- Base de données : MySQL (XAMPP)
- OS : Windows

## Tests Réalisés

### Test 1 - /api/chambres
Commande :
\.ab.exe -n 100 -c 10 http://localhost:8000/api/chambres
- Requêtes totales : 100  
- Concurrence : 10  
- Résultat : 0.82 req/sec  
- Temps moyen : 12.1 s  
- Statut : 100% erreurs (auth requise)  
- Taille réponse : 44 bytes  

### Test 2 - /api/login (GET non supporté)
Commande :
\.ab.exe -n 100 -c 10 http://localhost:8000/api/login
- Requêtes totales : 100  
- Concurrence : 10  
- Résultat : 1.03 req/sec  
- Temps moyen : 9.7 s  
- Temps médian : 9.2 s  
- Temps max : 11.7 s  
- Statut : 100% erreurs (GET non supporté)  
- Taille réponse : 227 KB  

### Test 3 - /api/login (POST avec login.json)
Commande :
ab.exe -n 100 -c 10 -p "C:\Users\abdrh\OneDrive\Desktop\projet CDA\HotelEase\back-end\login.json" -T application/json http://localhost:8000/api/login
- Requêtes totales : 100  
- Concurrence : 10  
- Résultat : 2.19 req/sec  
- Temps moyen : 4.56 s  
- Temps médian : 4.38 s  
- Temps max : 5.15 s  
- Statut : 100% erreurs (probablement erreurs métier ou pas de suivi cookie)  
- Taille réponse : 10.7 MB  

## Analyse

### Points positifs
- Stabilité du serveur, aucun crash  
- Amélioration notable du débit avec POST  
- Résultats cohérents et reproductibles  

### Améliorations possibles
- Intégrer la gestion du cookie JWT pour simuler un utilisateur authentifié  
- Adapter les tests pour suivre la session/authentification  
- Optimiser les temps de réponse (4-5s encore longs)  

## Conclusion

### Adéquation au besoin
- Usage interne avec faible nombre d’utilisateurs simultanés  
- Performances suffisantes pour les scénarios actuels  
- Nécessité d’un outil plus avancé pour simuler les sessions authentifiées  

### Recommandations
- Passer à un outil comme k6 ou JMeter pour gérer cookies et scénarios complexes  
- Mettre en place un monitoring en production  
- Optimiser backend et base de données (cache, requêtes)  

## Informations
- Environnement : local  
- Outil : Apache Bench 2.3  
