<?php

require_once(dirname(__FILE__) . '/../config/dbConnect.php');

// Si on appelle en AJAX (fetch), retourne le JSON de l'utilisateur
if (isset($_GET['api']) && $_GET['api'] === '1' && isset($_GET['id'])) {
    $userId = pg_escape_string($dataDB, $_GET['id']);
    $result = pg_query($dataDB, "SELECT * FROM \"User\" WHERE id = '$userId' LIMIT 1");
    if ($result && $row = pg_fetch_assoc($result)) {
        header('Content-Type: application/json');
        echo json_encode($row);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
    }
    exit;
}

include(dirname(__FILE__) .'/../view/templates/header.php');
include(dirname(__FILE__) .'/../view/templates/headerUser.php');
include(dirname(__FILE__) .'/../view/user.php');
include(dirname(__FILE__) .'/../view/templates/footer.php');