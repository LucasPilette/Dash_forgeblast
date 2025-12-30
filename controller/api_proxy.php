<?php

/**
 * API Proxy sécurisé
 * Masque la clé API côté client et ajoute une couche de sécurité
 */

session_start();

// Charger la config d'authentification
require_once __DIR__ . '/../config/auth_config.php';

// Vérifier l'authentification (si activée)
if (AUTHENTICATION_ENABLED && !isset($_SESSION['user_role'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Non authentifié']);
    exit;
}

// Mode développement : créer une session par défaut
if (!AUTHENTICATION_ENABLED && !isset($_SESSION['user_role'])) {
    $_SESSION['user_role'] = DEFAULT_ROLE;
    $_SESSION['user_email'] = DEFAULT_EMAIL;
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/validation.php';

// Récupérer les paramètres
$endpoint = $_GET['endpoint'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Valider l'endpoint
if (empty($endpoint)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Endpoint requis']);
    exit;
}

// Whitelist des endpoints autorisés (sécurité supplémentaire)
$allowedEndpoints = [
    'users/list',
    'users/get',
    'users/stats',
    'revenue/stats',
    'revenue/daily',
    'revenue/monthly',
];

// Vérifier si l'endpoint est autorisé (simple vérification du début)
$endpointAllowed = false;
foreach ($allowedEndpoints as $allowed) {
    if (strpos($endpoint, $allowed) === 0) {
        $endpointAllowed = true;
        break;
    }
}

if (!$endpointAllowed) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Endpoint non autorisé']);
    exit;
}

// Récupérer les configurations API
$apiKey = getenv('API_KEY') ?: '';
$apiBase = getenv('API_BASE') ?: '';

if (empty($apiKey) || empty($apiBase)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Configuration API manquante']);
    exit;
}

// Construire l'URL complète
$url = rtrim($apiBase, '/') . '/' . ltrim($endpoint, '/');

// Ajouter les paramètres de query string
if ($method === 'GET' && !empty($_GET)) {
    $params = $_GET;
    unset($params['endpoint']); // Retirer le paramètre endpoint
    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }
}

// Initialiser cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Headers
$headers = [
    "x-api-key: $apiKey",
    'Content-Type: application/json',
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Méthode HTTP
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Body pour POST/PATCH/PUT
if (in_array($method, ['POST', 'PATCH', 'PUT'])) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Exécuter la requête
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Gérer les erreurs cURL
if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Erreur de connexion à l\'API', 'details' => $curlError]);
    exit;
}

// Retourner la réponse
http_response_code($httpCode);
header('Content-Type: application/json');
echo $response;
