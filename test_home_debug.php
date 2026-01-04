<?php
// Script de debug pour tester home_controller

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Debug Home Controller</h1>";

require_once __DIR__ . '/config/config.php';

echo "<h2>1. Variables d'environnement</h2>";
echo "API_BASE: " . getenv('API_BASE') . "<br>";
echo "API_KEY: " . (getenv('API_KEY') ? 'Définie (caché)' : 'NON DÉFINIE') . "<br>";

require_once __DIR__ . '/config/ApiService.php';

echo "<h2>2. Test ApiService</h2>";
try {
    $api = new ApiService();
    echo "✅ ApiService créé<br>";

    echo "<h3>Test getUsers</h3>";
    $usersData = $api->getUsers(1, 10);
    echo "Résultat: <pre>" . print_r($usersData, true) . "</pre>";

    echo "<h3>Test getSquads</h3>";
    $squadsData = $api->getSquads(1, 10);
    echo "Résultat: <pre>" . print_r($squadsData, true) . "</pre>";
} catch (Throwable $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "<br>";
    echo "Stack trace: <pre>" . $e->getTraceAsString() . "</pre>";
}
