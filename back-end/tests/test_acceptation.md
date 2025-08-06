# Tests d'Acceptation - Gestion Hôtelière

## Objectif
Valider que l'application répond aux besoins métier des utilisateurs (réceptionnistes, administration).

## Scénario 1 : Création d'une Réservation Complète

### Contexte
Un client réserve une chambre pour 2 nuits avec service petit-déjeuner.

### Prérequis
- Utilisateur connecté avec rôle RECEPTIONNISTE  
- Au moins une chambre disponible  
- Service "Petit-déjeuner" créé  

### Étapes de Test

1. **Vérification des Chambres Disponibles**  
   - Accéder à la liste des chambres  
   - Résultat : chambres disponibles affichées  

2. **Création du Client**  
   - Ajouter client (nom, email, téléphone)  
   - Résultat : client créé avec email unique  

3. **Création de la Réservation**  
   - Sélectionner chambre 101, dates 15/03/2025 - 17/03/2025  
   - Associer au client  
   - Résultat : réservation créée, montant calculé (160€)  

4. **Ajout de Services**  
   - Ajouter service "Petit-déjeuner" (15€ x 2 jours)  
   - Résultat : total mis à jour (190€)  

5. **Finalisation**  
   - Confirmer réservation  
   - Résultat : chambre occupée, email confirmation envoyé, réservation visible  

### Critères d'Acceptation
- Données cohérentes (calculs, dates)  
- Chambre non double-bookée  
- Interface intuitive  
- Traçabilité des actions  

---

## Scénario 2 : Gestion des Conflits de Réservation

### Contexte
Tester la gestion d'une réservation conflictuelle sur une chambre déjà occupée.

### Étapes
1. Créer réservation du 15 au 17/03 sur chambre 101  
2. Essayer de créer réservation du 16 au 18/03 sur même chambre  
3. Système refuse la réservation avec message d’erreur  
4. Propose chambres disponibles alternatives  

### Résultat
Conflit détecté et bloqué, intégrité des données préservée.


