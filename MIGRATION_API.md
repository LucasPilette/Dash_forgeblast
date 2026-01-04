# Migration des requêtes SQL vers l'API NestJS

## ✅ Fichiers créés

1. **config/ApiService.php** - Service centralisé pour communiquer avec l'API
2. **controller/user_controller_api.php** - Version API du contrôleur utilisateurs
3. **controller/home_controller_api.php** - Version API du contrôleur home

## 🔄 Migration progressive

### Étape 1 : Tester les nouveaux contrôleurs

Les fichiers `*_api.php` utilisent l'API au lieu des requêtes SQL directes.

**Pour tester sans casser l'existant :**

-   Les anciens fichiers (`user_controller.php`, `home_controller.php`) restent inchangés
-   Vous pouvez tester les nouveaux en changeant les routes ou includes temporairement

### Étape 2 : Remplacer progressivement

Une fois que vous avez testé et validé que les nouveaux contrôleurs fonctionnent :

```bash
# Sauvegarder les anciens
mv controller/user_controller.php controller/user_controller_old.php
mv controller/home_controller.php controller/home_controller_old.php

# Activer les nouveaux
mv controller/user_controller_api.php controller/user_controller.php
mv controller/home_controller_api.php controller/home_controller.php
```

## 📊 Contrôleurs KPI et Overview

Ces contrôleurs nécessitent des endpoints supplémentaires dans votre API NestJS pour les agrégations complexes :

### Endpoints manquants à créer dans NestJS

#### Pour KPI Controller

```
GET /metrics/weekly-new-users?since=2024-01-01
→ Nouveaux utilisateurs par semaine

GET /metrics/weekly-new-users-with-game?since=2024-01-01
→ Nouveaux utilisateurs avec jeu par semaine

GET /metrics/weekly-active-users?since=2024-01-01
→ Utilisateurs actifs par semaine

GET /metrics/monthly-active-users?since=2024-01-01
→ Utilisateurs actifs par mois
```

#### Pour Overview Controller

```
GET /metrics/weekly-new-users?since=2024-01-01
GET /metrics/weekly-onboarded?since=2024-01-01
GET /metrics/weekly-active-users?since=2024-01-01
GET /metrics/monthly-active-users?since=2024-01-01
GET /metrics/cumulative-users?since=2024-01-01
```

### Alternative : Utiliser les transactions RevenueCat

Le contrôleur Overview utilise déjà l'endpoint `/admin/revenuecat/transactions` pour les transactions. C'est un bon exemple de migration réussie !

## 🎯 Utilisation de ApiService

### Dans vos contrôleurs

```php
<?php
require_once __DIR__ . '/../config/ApiService.php';

$api = new ApiService();

// Récupérer des utilisateurs
$users = $api->getUsers($page, $limit);

// Récupérer un utilisateur
$user = $api->getUserById($id);

// Récupérer des métriques
$arpu = $api->getArpu(30);
$retention = $api->getRetention(30);
```

### Dans vos vues

```php
<?php
$api = new ApiService();
$user = $api->getUserById($_GET['id']);
```

## 🔐 Sécurité

-   ✅ Les clés API sont dans `.env` (pas exposées au client)
-   ✅ Les requêtes passent par le serveur PHP (pas de CORS côté client)
-   ✅ Validation des paramètres avant d'appeler l'API
-   ✅ Gestion des erreurs avec logs

## ⚡ Prochaines étapes

1. **Tester les contrôleurs créés**

    - Accédez à votre dashboard
    - Vérifiez que les données s'affichent correctement

2. **Créer les endpoints manquants dans NestJS**

    - Pour les métriques hebdomadaires/mensuelles
    - Pour les agrégations complexes

3. **Migrer KPI et Overview controllers**

    - Une fois les endpoints créés dans l'API
    - Utiliser ApiService pour les appeler

4. **Supprimer dbConnect.php**
    - Une fois tous les contrôleurs migrés
    - Plus besoin de connexion directe à PostgreSQL

## 📝 Notes

-   Tous les formats de réponse de l'API sont en JSON standard
-   Les dates sont au format ISO 8601
-   La pagination utilise `page` et `limit` comme paramètres
-   Les erreurs retournent des codes HTTP appropriés (404, 500, etc.)
