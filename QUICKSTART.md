# 🎯 DÉMARRAGE RAPIDE - API Migration

## ⚡ 3 étapes pour commencer

### 1️⃣ Tester que l'API fonctionne (2 minutes)

Ouvrez votre navigateur :

```
http://localhost/forgeblast/test_api.php
```

✅ **Tous les tests en vert ?** → Passez à l'étape 2
❌ **Des erreurs ?** → Vérifiez que votre API NestJS est démarrée sur le port 3100

---

### 2️⃣ Tester un contrôleur migré (2 minutes)

Testez le contrôleur utilisateurs via l'API :

```
http://localhost/forgeblast/controller/user_controller_api.php?action=list
```

Vous devriez voir un JSON avec vos utilisateurs.

---

### 3️⃣ Migrer votre première page (5 minutes)

#### Modifier index.php

Ouvrez `index.php` et trouvez cette ligne :

```php
include('./controller/home_controller.php');
```

Remplacez par :

```php
include('./controller/home_controller_api.php');
```

Rechargez votre dashboard → Les données viennent maintenant de l'API ! 🎉

---

## 📁 Fichiers créés pour vous

| Fichier                              | Description                             |
| ------------------------------------ | --------------------------------------- |
| `config/ApiService.php`              | ⭐ Service principal pour appeler l'API |
| `controller/user_controller_api.php` | Contrôleur utilisateurs (version API)   |
| `controller/home_controller_api.php` | Contrôleur home (version API)           |
| `view/user_api.php`                  | Vue détail utilisateur (version API)    |
| `test_api.php`                       | Script de test des endpoints            |
| `README_API.md`                      | 📖 Guide complet d'utilisation          |
| `MIGRATION_API.md`                   | 📋 Plan de migration détaillé           |

---

## 🔍 Vérifier que ça marche

### Méthode 1 : Regarder les logs

```bash
# Dans votre terminal
tail -f /path/to/your/php/error.log
```

### Méthode 2 : Test direct

```php
<?php
require_once 'config/ApiService.php';
$api = new ApiService();
var_dump($api->getUserCount());
// Devrait afficher le nombre d'utilisateurs
?>
```

---

## 🚨 En cas de problème

### Erreur : "API Error: /users/count returned 0"

→ L'API NestJS n'est pas démarrée

```bash
# Démarrez votre API
cd /chemin/vers/votre/api
npm run start:dev
```

### Erreur : "Configuration API manquante"

→ Vérifiez votre fichier `.env` :

```env
API_BASE=http://127.0.0.1:3100
API_KEY=fb_sk_live_3b7f29e1c4e14a509a8f4f97ae6aaf6b
```

### Erreur : "Connection refused"

→ Vérifiez que l'API écoute sur le bon port :

```bash
curl http://127.0.0.1:3100/users/count
```

---

## 📊 Comparaison Avant/Après

### ❌ Avant (avec DB directe)

```php
$sql = 'SELECT * FROM "User" WHERE id = $1';
$res = pg_query_params($dataDB, $sql, [$id]);
$user = pg_fetch_assoc($res);
```

### ✅ Après (avec API)

```php
$api = new ApiService();
$user = $api->getUserById($id);
```

**C'est plus simple et plus sûr !** 🎯

---

## 🎓 Pour aller plus loin

### Migrer d'autres pages

1. Ouvrez le contrôleur que vous voulez migrer
2. Remplacez les `pg_query()` par des appels à `ApiService`
3. Testez que les données s'affichent correctement
4. Remplacez l'ancien fichier par le nouveau

### Exemple : Migrer le contrôleur KPI

```php
<?php
// Ancien code
$sql = "SELECT COUNT(*) FROM User WHERE createdAt >= $1";
$res = pg_query_params($dataDB, $sql, [$date]);

// Nouveau code (après avoir créé l'endpoint dans NestJS)
$api = new ApiService();
$stats = $api->request('/metrics/weekly-new-users?since=' . $date);
?>
```

---

## ✅ Checklist de migration

-   [ ] L'API NestJS est démarrée
-   [ ] Le fichier `.env` contient `API_BASE` et `API_KEY`
-   [ ] Le test `test_api.php` passe tous les tests en vert
-   [ ] Le contrôleur `user_controller_api.php` retourne des données
-   [ ] J'ai testé en modifiant temporairement `index.php`
-   [ ] Les données s'affichent correctement sur le dashboard

---

## 💡 Conseil

**Ne supprimez pas vos anciens fichiers tout de suite !**

Gardez-les quelques jours pour être sûr que tout fonctionne.
Vous pouvez les renommer en `.old` :

```bash
mv controller/home_controller.php controller/home_controller.php.old
```

---

## 🎉 C'est tout !

Vous êtes prêt à utiliser votre API au lieu des requêtes SQL directes.

**Questions ?** Relisez [README_API.md](README_API.md) pour plus de détails.

**Prochaine étape :** Une fois que tout fonctionne, vous pourrez retirer complètement `dbConnect.php` ! 🚀
