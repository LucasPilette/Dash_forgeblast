<?php

/**
 * Script de test pour vérifier la connexion à l'API NestJS
 * Accédez à ce fichier via : http://localhost/forgeblast/test_api.php
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/ApiService.php';

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>

<head>
    <title>Test API NestJS</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .test {
            background: white;
            padding: 20px;
            margin: 10px 0;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .success {
            border-left: 4px solid #4caf50;
        }

        .error {
            border-left: 4px solid #f44336;
        }

        h1 {
            color: #333;
        }

        h2 {
            color: #666;
            margin-top: 0;
        }

        pre {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
        }

        .status {
            font-weight: bold;
        }

        .status.ok {
            color: #4caf50;
        }

        .status.fail {
            color: #f44336;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>🧪 Test de connexion à l'API NestJS</h1>

        <?php
        $api = new ApiService();

        // Test 1 : Connexion de base
        echo '<div class="test">';
        echo '<h2>1. Configuration API</h2>';
        echo '<p><strong>URL de base :</strong> ' . getenv('API_BASE') . '</p>';
        echo '<p><strong>API Key configurée :</strong> ' . (getenv('API_KEY') ? '✅ Oui' : '❌ Non') . '</p>';
        echo '</div>';

        // Test 2 : Comptage des utilisateurs
        echo '<div class="test">';
        echo '<h2>2. Test GET /users/count</h2>';
        try {
            $count = $api->getUserCount();
            echo '<p class="status ok">✅ Succès</p>';
            echo '<p><strong>Nombre d\'utilisateurs :</strong> ' . $count . '</p>';
        } catch (Throwable $e) {
            echo '<p class="status fail">❌ Échec</p>';
            echo '<p>Erreur : ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
        echo '</div>';

        // Test 3 : Liste des utilisateurs
        echo '<div class="test">';
        echo '<h2>3. Test GET /users/list (page 1, limit 5)</h2>';
        try {
            $result = $api->getUsers(1, 5);
            echo '<p class="status ok">✅ Succès</p>';
            echo '<p><strong>Utilisateurs récupérés :</strong> ' . count($result['users']) . '</p>';
            echo '<p><strong>Total dans la DB :</strong> ' . $result['total'] . '</p>';
            if (!empty($result['users'])) {
                echo '<pre>' . json_encode($result['users'][0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
            }
        } catch (Throwable $e) {
            echo '<p class="status fail">❌ Échec</p>';
            echo '<p>Erreur : ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
        echo '</div>';

        // Test 4 : Liste des squads
        echo '<div class="test">';
        echo '<h2>4. Test GET /squads/list (page 1, limit 5)</h2>';
        try {
            $result = $api->getSquads(1, 5);
            echo '<p class="status ok">✅ Succès</p>';
            echo '<p><strong>Squads récupérés :</strong> ' . count($result['squads']) . '</p>';
            echo '<p><strong>Total dans la DB :</strong> ' . $result['total'] . '</p>';
            if (!empty($result['squads'])) {
                echo '<pre>' . json_encode($result['squads'][0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
            }
        } catch (Throwable $e) {
            echo '<p class="status fail">❌ Échec</p>';
            echo '<p>Erreur : ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
        echo '</div>';

        // Test 5 : Métriques ARPU
        echo '<div class="test">';
        echo '<h2>5. Test GET /metrics/arpu?days=30</h2>';
        try {
            $arpu = $api->getArpu(30);
            echo '<p class="status ok">✅ Succès</p>';
            if ($arpu) {
                echo '<pre>' . json_encode($arpu, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
            } else {
                echo '<p>Aucune donnée retournée</p>';
            }
        } catch (Throwable $e) {
            echo '<p class="status fail">❌ Échec</p>';
            echo '<p>Erreur : ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
        echo '</div>';

        // Test 6 : Transactions RevenueCat
        echo '<div class="test">';
        echo '<h2>6. Test GET /admin/revenuecat/transactions (page 1, limit 5)</h2>';
        try {
            $transactions = $api->getRevenueCatTransactions(1, 5);
            echo '<p class="status ok">✅ Succès</p>';
            if ($transactions) {
                $items = $transactions['items'] ?? $transactions['transactions'] ?? $transactions['data'] ?? [];
                echo '<p><strong>Transactions récupérées :</strong> ' . count($items) . '</p>';
                if (!empty($items)) {
                    echo '<pre>' . json_encode($items[0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
                }
            } else {
                echo '<p>Aucune donnée retournée</p>';
            }
        } catch (Throwable $e) {
            echo '<p class="status fail">❌ Échec</p>';
            echo '<p>Erreur : ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
        echo '</div>';

        // Test 7 : Recherche utilisateur
        echo '<div class="test">';
        echo '<h2>7. Test GET /users/search?q=test</h2>';
        try {
            $results = $api->searchUsers('test');
            echo '<p class="status ok">✅ Succès</p>';
            echo '<p><strong>Résultats trouvés :</strong> ' . count($results) . '</p>';
            if (!empty($results)) {
                echo '<pre>' . json_encode($results[0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
            }
        } catch (Throwable $e) {
            echo '<p class="status fail">❌ Échec</p>';
            echo '<p>Erreur : ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
        echo '</div>';
        ?>

        <div class="test success">
            <h2>📝 Résumé</h2>
            <p>Si tous les tests sont verts ✅, votre API NestJS est correctement configurée et accessible depuis PHP !</p>
            <p><strong>Prochaines étapes :</strong></p>
            <ol>
                <li>Vérifier que les données retournées correspondent à vos attentes</li>
                <li>Tester les nouveaux contrôleurs : <code>controller/*_api.php</code></li>
                <li>Une fois validé, remplacer les anciens contrôleurs par les nouveaux</li>
            </ol>
        </div>
    </div>
</body>

</html>