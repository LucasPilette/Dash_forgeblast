# 📋 État de la migration - Dashboard ForgeBlast

## ✅ Pages MIGRÉES (utilisant l'API)

### 1. Page Home ✅

-   **Fichier :** `index.php` → `controller/home_controller_api.php`
-   **Statut :** Actif
-   **Test :** Ouvrez votre dashboard, vérifiez que les utilisateurs et squads s'affichent

### 2. Contrôleur User ✅

-   **Fichier :** `controller/user_controller.php` (version API active)
-   **Ancien fichier :** Sauvegardé dans `controller/user_controller_sql.php`
-   **Statut :** Actif
-   **Test :**
    -   Liste : `/controller/user_controller.php?action=list`
    -   Détail : `/controller/user_controller.php?action=get&id=XXX`

### 3. Vue User ✅

-   **Fichier :** `view/user.php` (version API active)
-   **Ancien fichier :** Sauvegardé dans `view/user_sql.php`
-   **Statut :** Actif
-   **Test :** Cliquez sur un utilisateur pour voir ses détails

---

## ⚠️ Pages PARTIELLEMENT MIGRÉES (agrégations côté PHP)

### 4. KPI Controller 🟡

-   **Fichier créé :** `controller/kpi_controller_api.php`
-   **Fichier actuel :** `controller/kpi_controller.php` (version SQL encore active)
-   **Statut :** Version API créée mais non activée
-   **Limitation :** Fait l'agrégation côté PHP (pas optimal)
-   **Pour activer :**
    ```bash
    cd controller
    mv kpi_controller.php kpi_controller_sql.php
    mv kpi_controller_api.php kpi_controller.php
    ```

### 5. Overview Controller 🟡

-   **Fichier créé :** `controller/overview_controller_api.php`
-   **Fichier actuel :** `controller/overview_controller.php` (version SQL encore active)
-   **Statut :** Version API créée mais non activée
-   **Limitation :** Fait l'agrégation côté PHP (pas optimal)
-   **Pour activer :**
    ```bash
    cd controller
    mv overview_controller.php overview_controller_sql.php
    mv overview_controller_api.php overview_controller.php
    ```

---

## 📊 Endpoints API manquants (à créer dans NestJS)

Pour une migration complète et optimale, créez ces endpoints dans votre API NestJS :

### Métriques hebdomadaires/mensuelles

```typescript
GET /metrics/weekly-new-users?since=2024-01-01
// Retourne: [{ week_start: '2024-01-01', new_users: 150 }, ...]

GET /metrics/weekly-new-users-with-game?since=2024-01-01
// Retourne: [{ week_start: '2024-01-01', new_users_with_game: 120 }, ...]

GET /metrics/weekly-active-users?since=2024-01-01
// Retourne: [{ week_start: '2024-01-01', active_users: 450 }, ...]

GET /metrics/weekly-onboarded?since=2024-01-01
// Retourne: [{ week_start: '2024-01-01', onboarded: 100, percentage: 66.67 }, ...]

GET /metrics/monthly-active-users?since=2024-01-01
// Retourne: [{ month_start: '2024-01', active_users: 1200 }, ...]

GET /metrics/cumulative-users?since=2024-01-01
// Retourne: [{ week_start: '2024-01-01', total_users: 5000 }, ...]
```

### Une fois ces endpoints créés :

Mettez à jour `config/ApiService.php` :

```php
public function getWeeklyNewUsers(string $since): ?array
{
    return $this->request("/metrics/weekly-new-users?since=$since");
}

public function getWeeklyActiveUsers(string $since): ?array
{
    return $this->request("/metrics/weekly-active-users?since=$since");
}

public function getMonthlyActiveUsers(string $since): ?array
{
    return $this->request("/metrics/monthly-active-users?since=$since");
}

public function getCumulativeUsers(string $since): ?array
{
    return $this->request("/metrics/cumulative-users?since=$since");
}
```

Puis simplifiez les contrôleurs KPI et Overview pour utiliser ces méthodes.

---

## 🎯 Actions recommandées

### Option A : Migration complète maintenant (rapide mais agrégations PHP)

Activez KPI et Overview avec les versions API actuelles :

```bash
cd /c/laragon/www/forgeblast/controller

# KPI
mv kpi_controller.php kpi_controller_sql.php
mv kpi_controller_api.php kpi_controller.php

# Overview
mv overview_controller.php overview_controller_sql.php
mv overview_controller_api.php overview_controller.php
```

**Avantage :** Tout utilise l'API immédiatement  
**Inconvénient :** Les agrégations se font côté PHP (moins performant)

### Option B : Migration progressive (recommandé)

1. **Maintenant :** Gardez KPI et Overview avec SQL
2. **Ensuite :** Créez les endpoints de métriques dans NestJS
3. **Puis :** Activez les versions API de KPI et Overview

**Avantage :** Performance optimale  
**Inconvénient :** Nécessite du travail sur l'API NestJS

---

## 🧪 Tests à effectuer

### Tests de base (pages migrées)

-   [ ] Dashboard s'affiche correctement
-   [ ] Liste des utilisateurs visible
-   [ ] Clic sur un utilisateur affiche ses détails
-   [ ] Squads s'affichent correctement
-   [ ] Pas d'erreurs dans la console navigateur
-   [ ] Pas d'erreurs dans les logs PHP

### Tests si vous activez KPI/Overview

-   [ ] Page KPI affiche les graphiques
-   [ ] Page Overview affiche les statistiques
-   [ ] Les filtres de période fonctionnent (1m, 3m, 6m, 1y)
-   [ ] Les transactions s'affichent

---

## 🔄 Retour en arrière (si besoin)

Si quelque chose ne fonctionne pas :

```bash
cd /c/laragon/www/forgeblast

# Restaurer Home
nano index.php  # Changer home_controller_api.php → home_controller.php

# Restaurer User controller
cd controller
mv user_controller.php user_controller_api.php
mv user_controller_sql.php user_controller.php

# Restaurer User view
cd ../view
mv user.php user_api.php
mv user_sql.php user.php
```

---

## 📈 Bénéfices actuels

-   ✅ **Sécurité :** Plus d'accès direct à la DB AWS depuis PHP pour User et Home
-   ✅ **Centralisation :** L'API gère les données
-   ✅ **Compatibilité :** Ancien code préservé en `.sql.php`
-   ✅ **Tests :** Script de test validé

---

## 🚀 Prochaines étapes

1. **Testez les pages migrées** pendant quelques jours
2. **Si tout fonctionne bien :**
    - Créez les endpoints de métriques dans NestJS
    - Activez KPI et Overview en mode API
3. **Une fois tout validé :**
    - Supprimez les fichiers `*_sql.php`
    - Supprimez ou désactivez `config/dbConnect.php`

---

## 📞 Support

En cas de problème :

1. Vérifiez les logs PHP : `tail -f /path/to/error.log`
2. Testez l'API directement : `curl http://127.0.0.1:3100/users/count`
3. Relancez le test : `http://localhost/forgeblast/test_api.php`
4. Restaurez l'ancien fichier si nécessaire (voir section "Retour en arrière")
