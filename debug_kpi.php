<?php

/**
 * Page de debug pour diagnostiquer les problèmes KPI/Overview
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/ApiService.php';

header('Content-Type: text/html; charset=utf-8');

$api = new ApiService();
?>
<!DOCTYPE html>
<html>

<head>
    <title>🔍 Debug KPI/Overview</title>
    <style>
        body {
            font-family: Arial;
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            background: #f5f5f5;
        }

        h1 {
            color: #333;
        }

        .section {
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .ok {
            color: #27ae60;
            font-weight: bold;
        }

        .error {
            color: #e74c3c;
            font-weight: bold;
        }

        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 3px;
            overflow-x: auto;
            font-size: 12px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        th {
            background: #34495e;
            color: white;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
        }

        .badge-success {
            background: #27ae60;
            color: white;
        }

        .badge-danger {
            background: #e74c3c;
            color: white;
        }

        .badge-warning {
            background: #f39c12;
            color: white;
        }
    </style>
</head>

<body>
    <h1>🔍 Debug KPI/Overview - Données API</h1>

    <div class="section">
        <h2>1. Test de connexion API</h2>
        <?php
        $count = $api->getUserCount();
        if ($count > 0) {
            echo "<p class='ok'>✅ API connectée - $count utilisateurs dans la base</p>";
        } else {
            echo "<p class='error'>❌ Problème de connexion API ou aucun utilisateur</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>2. Récupération des utilisateurs (premiers 20)</h2>
        <?php
        $result = $api->getUsers(1, 20);
        $users = $result['users'] ?? [];
        echo "<p>Utilisateurs récupérés : <strong>" . count($users) . "</strong></p>";

        if (count($users) > 0) {
            echo "<p class='ok'>✅ L'API retourne des utilisateurs</p>";
            echo "<h3>Structure du premier utilisateur :</h3>";
            echo "<pre>" . json_encode($users[0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

            echo "<h3>Champs de date disponibles :</h3>";
            $firstUser = $users[0];
            echo "<table>";
            echo "<tr><th>Champ</th><th>Valeur</th><th>Type</th></tr>";

            $dateFields = ['createdAt', 'created_at', 'lastActiveAt', 'last_active_at', 'updatedAt', 'updated_at'];
            foreach ($dateFields as $field) {
                if (isset($firstUser[$field])) {
                    $value = $firstUser[$field];
                    $type = gettype($value);
                    echo "<tr>";
                    echo "<td><strong>$field</strong></td>";
                    echo "<td>$value</td>";
                    echo "<td><span class='badge badge-success'>$type</span></td>";
                    echo "</tr>";
                }
            }
            echo "</table>";

            echo "<h3>Champs liés au jeu :</h3>";
            echo "<table>";
            echo "<tr><th>Champ</th><th>Valeur</th></tr>";
            $gameFields = ['currentGameId', 'current_game_id', 'gameId', 'game_id'];
            foreach ($gameFields as $field) {
                if (isset($firstUser[$field])) {
                    $value = $firstUser[$field] ? 'OUI - ' . $firstUser[$field] : 'NULL';
                    echo "<tr><td><strong>$field</strong></td><td>$value</td></tr>";
                }
            }
            echo "</table>";
        } else {
            echo "<p class='error'>❌ Aucun utilisateur retourné par l'API</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>3. Test des agrégations (30 derniers jours)</h2>
        <?php
        $dateLimit = date('Y-m-d', strtotime('-30 days'));
        echo "<p>Date limite : <strong>$dateLimit</strong></p>";

        $allUsers = $api->getUsers(1, 5000);
        $users = $allUsers['users'] ?? [];

        // Filtrer fakeusers
        $usersFiltered = array_filter($users, function ($u) {
            return stripos($u['email'] ?? '', 'fakeuser') === false;
        });

        echo "<p>Total utilisateurs récupérés : <strong>" . count($users) . "</strong></p>";
        echo "<p>Après filtrage fakeuser : <strong>" . count($usersFiltered) . "</strong></p>";

        // Compter par semaine
        $weeklyData = [];
        $usersInPeriod = 0;
        $dateErrors = 0;

        foreach ($usersFiltered as $user) {
            $createdAt = $user['createdAt'] ?? $user['created_at'] ?? '';

            if ($createdAt) {
                try {
                    $date = new DateTime($createdAt);
                    $dateStr = $date->format('Y-m-d');

                    if ($dateStr >= $dateLimit) {
                        $usersInPeriod++;
                        $date->modify('monday this week');
                        $weekStart = $date->format('Y-m-d');

                        if (!isset($weeklyData[$weekStart])) {
                            $weeklyData[$weekStart] = 0;
                        }
                        $weeklyData[$weekStart]++;
                    }
                } catch (Exception $e) {
                    $dateErrors++;
                }
            }
        }

        echo "<p>Utilisateurs créés dans les 30 derniers jours : <strong>$usersInPeriod</strong></p>";
        echo "<p>Erreurs de parsing de date : <strong>$dateErrors</strong></p>";
        echo "<p>Nombre de semaines avec des données : <strong>" . count($weeklyData) . "</strong></p>";

        if (count($weeklyData) > 0) {
            echo "<p class='ok'>✅ Des données sont disponibles pour les graphiques</p>";
            echo "<h3>Distribution par semaine :</h3>";
            echo "<table>";
            echo "<tr><th>Semaine</th><th>Nouveaux utilisateurs</th></tr>";
            krsort($weeklyData);
            foreach ($weeklyData as $week => $count) {
                echo "<tr><td>$week</td><td><strong>$count</strong></td></tr>";
            }
            echo "</table>";
        } else {
            echo "<p class='error'>❌ Aucune donnée agrégée - les graphiques seront vides</p>";
            echo "<p class='badge-warning' style='padding: 10px;'>Possible causes :</p>";
            echo "<ul>";
            echo "<li>Tous les utilisateurs ont été créés il y a plus de 30 jours</li>";
            echo "<li>Le champ de date n'est pas au bon format</li>";
            echo "<li>Tous les utilisateurs sont des 'fakeuser'</li>";
            echo "</ul>";
        }
        ?>
    </div>

    <div class="section">
        <h2>4. Test des transactions RevenueCat</h2>
        <?php
        try {
            $txData = $api->getRevenueCatTransactions(1, 10);
            $transactions = $txData['items'] ?? $txData['transactions'] ?? $txData['data'] ?? [];

            echo "<p>Transactions récupérées : <strong>" . count($transactions) . "</strong></p>";

            if (count($transactions) > 0) {
                echo "<p class='ok'>✅ Des transactions sont disponibles</p>";
                echo "<h3>Structure de la première transaction :</h3>";
                echo "<pre>" . json_encode($transactions[0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
            } else {
                echo "<p class='badge-warning' style='padding: 10px;'>⚠️ Aucune transaction trouvée - le graphique des revenus sera vide</p>";
            }
        } catch (Exception $e) {
            echo "<p class='error'>❌ Erreur lors de la récupération des transactions : " . htmlspecialchars($e->getMessage()) . "</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>5. Recommandations</h2>
        <?php
        if (count($weeklyData) > 0) {
            echo "<p class='ok'>✅ Les pages KPI et Overview devraient maintenant afficher des données</p>";
            echo "<p>Si ce n'est pas le cas :</p>";
            echo "<ul>";
            echo "<li>Vérifiez les logs PHP : Les messages de debug commencent par 'KPI:' ou 'Overview:'</li>";
            echo "<li>Vérifiez la console JavaScript du navigateur (F12)</li>";
            echo "<li>Rafraîchissez les pages KPI et Overview avec Ctrl+F5</li>";
            echo "</ul>";
        } else {
            echo "<p class='error'>❌ Problème identifié : Aucune donnée agrégée disponible</p>";
            echo "<p><strong>Solutions :</strong></p>";
            echo "<ol>";
            echo "<li><strong>Augmenter la période :</strong> Essayez avec 3 mois, 6 mois ou 1 an au lieu de 1 mois</li>";
            echo "<li><strong>Créer des endpoints dédiés dans votre API NestJS :</strong>";
            echo "<pre>GET /metrics/weekly-new-users?since=YYYY-MM-DD
GET /metrics/weekly-active-users?since=YYYY-MM-DD
GET /metrics/monthly-active-users?since=YYYY-MM-DD</pre>";
            echo "</li>";
            echo "<li><strong>Vérifier vos données :</strong> Assurez-vous d'avoir des utilisateurs créés récemment</li>";
            echo "</ol>";
        }
        ?>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="controller/kpi_controller.php" style="display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 5px;">
            📊 Voir la page KPI
        </a>
        <a href="controller/overview_controller.php" style="display: inline-block; padding: 12px 24px; background: #9b59b6; color: white; text-decoration: none; border-radius: 5px; margin: 5px;">
            📈 Voir la page Overview
        </a>
        <a href="test_api.php" style="display: inline-block; padding: 12px 24px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 5px;">
            🧪 Tests API complets
        </a>
    </div>
</body>

</html>