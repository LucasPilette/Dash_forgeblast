# 🚀 Guide d'utilisation - Migration vers l'API

## ✅ Ce qui a été créé

### 1. Service API centralisé

**Fichier :** `config/ApiService.php`

Classe PHP qui encapsule tous les appels vers votre API NestJS. Plus besoin d'écrire du code cURL à chaque fois !

### 2. Nouveaux contrôleurs (version API)

-   `controller/user_controller_api.php` - Remplace les requêtes SQL par des appels API
-   `controller/home_controller_api.php` - Idem pour la page d'accueil

### 3. Nouvelle vue (version API)

-   `view/user_api.php` - Affiche les détails utilisateur via l'API

### 4. Script de test

-   `test_api.php` - Pour vérifier que tout fonctionne

### 5. Documentation

-   `MIGRATION_API.md` - Guide de migration complet

## 🧪 Tester votre installation

### Étape 1 : Vérifier que l'API NestJS fonctionne

Ouvrez votre navigateur et accédez à :

```
http://localhost/forgeblast/test_api.php
```

Vous devriez voir tous les tests passer en vert ✅

### Étape 2 : Tester le contrôleur utilisateurs

Testez l'endpoint API :

```
http://localhost/forgeblast/controller/user_controller_api.php?action=list
```

Vous devriez recevoir un JSON avec la liste des utilisateurs.

### Étape 3 : Tester la page d'accueil

Modifiez temporairement `index.php` pour charger le nouveau contrôleur :

```php
<?php
// Dans index.php, remplacez :
// include('./controller/home_controller.php');
// Par :
include('./controller/home_controller_api.php');
```

## 📋 Utilisation dans votre code

### Exemple simple : Récupérer des utilisateurs

```php
<?php
require_once __DIR__ . '/config/ApiService.php';

$api = new ApiService();

// Liste paginée
$result = $api->getUsers($page = 1, $limit = 20);
echo "Total : " . $result['total'];
foreach ($result['users'] as $user) {
    echo $user['name'] . "\n";
}

// Un utilisateur spécifique
$user = $api->getUserById('123');
echo $user['email'];
```

### Exemple : Récupérer des métriques

```php
<?php
require_once __DIR__ . '/config/ApiService.php';

$api = new ApiService();

// ARPU sur 30 jours
$arpu = $api->getArpu(30);
echo "ARPU : " . $arpu['arpu'];

// Transactions RevenueCat
$transactions = $api->getRevenueCatTransactions(1, 100);
$items = $transactions['items'] ?? [];
echo "Nombre de transactions : " . count($items);
```

### Exemple : Dans une vue

```php
<?php
// view/user_detail.php
require_once __DIR__ . '/../config/ApiService.php';

$api = new ApiService();
$userId = $_GET['id'] ?? null;

if ($userId) {
    $user = $api->getUserById($userId);
    if ($user) {
        echo "<h1>" . htmlspecialchars($user['name']) . "</h1>";
        echo "<p>Email: " . htmlspecialchars($user['email']) . "</p>";
    }
}
?>
```

## 🔄 Migration complète

### Option A : Migration progressive (recommandée)

1. **Tester les nouveaux fichiers** sans toucher aux anciens
2. **Valider que les données sont correctes**
3. **Basculer progressivement** page par page

```bash
# Exemple : Migrer uniquement le contrôleur utilisateurs
mv controller/user_controller.php controller/user_controller_old.php
mv controller/user_controller_api.php controller/user_controller.php
```

### Option B : Migration complète en une fois

Une fois tous les tests validés :

```bash
# Sauvegarder les anciens
mkdir -p controller/old
mv controller/user_controller.php controller/old/
mv controller/home_controller.php controller/old/

# Activer les nouveaux
mv controller/user_controller_api.php controller/user_controller.php
mv controller/home_controller_api.php controller/home_controller.php

# Vues
mv view/user.php view/old_user.php
mv view/user_api.php view/user.php
```

## 🎯 Avantages de cette approche

1. **Sécurité** : Plus d'accès direct à la DB depuis PHP
2. **Centralisation** : Une seule API gère toutes les données
3. **Maintenance** : Plus facile de modifier la logique métier (dans l'API)
4. **Performance** : L'API peut faire du caching, de l'optimisation
5. **Scalabilité** : L'API et le dashboard PHP peuvent être sur des serveurs différents

## ⚠️ Points d'attention

### 1. Les métriques complexes

Les contrôleurs `kpi_controller.php` et `overview_controller.php` font des agrégations SQL complexes (groupement par semaine, etc.).

**Vous avez 2 options :**

**Option A** : Créer des endpoints dans votre API NestJS pour ces métriques

```typescript
// Dans votre API NestJS
@Get('metrics/weekly-new-users')
async getWeeklyNewUsers(@Query('since') since: string) {
  // SQL aggregation ici
}
```

**Option B** : Garder temporairement ces contrôleurs avec DB directe

-   Migrez d'abord les endpoints simples (users, squads)
-   Créez ensuite les endpoints de métriques dans l'API
-   Migrez ces contrôleurs en dernier

### 2. Format des données

L'API peut retourner les données dans un format différent de PostgreSQL.
Vérifiez les mappings dans `ApiService.php` :

```php
// L'API peut retourner "blastId" au lieu de "blast_id"
$blastId = $user['blast_id'] ?? $user['blastId'] ?? '';
```

### 3. Gestion des erreurs

ApiService retourne `null` en cas d'erreur. Pensez à vérifier :

```php
$user = $api->getUserById($id);
if (!$user) {
    // Gérer l'erreur
    echo "Utilisateur non trouvé";
}
```

## 🛠️ Personnalisation

### Ajouter une nouvelle méthode dans ApiService

```php
// Dans config/ApiService.php

public function getCustomData(string $param): ?array
{
    $result = $this->request("/your-endpoint?param=$param");
    return $result;
}
```

### Modifier le timeout

```php
// Dans la méthode request() de ApiService.php
curl_setopt($ch, CURLOPT_TIMEOUT, 60); // 60 secondes au lieu de 30
```

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs PHP : `error_log()`
2. Testez l'API directement : `curl http://127.0.0.1:3100/users/list`
3. Vérifiez que l'API NestJS est bien démarrée
4. Vérifiez les variables d'environnement dans `.env`

## ✨ Résumé

Vous avez maintenant :

-   ✅ Un service PHP qui communique avec votre API NestJS
-   ✅ Des contrôleurs migrés pour utiliser l'API
-   ✅ Un script de test pour valider
-   ✅ Une migration progressive sans casser l'existant

**Prochaine étape :** Ouvrez `http://localhost/forgeblast/test_api.php` et vérifiez que tout fonctionne ! 🚀
