<?php 

require_once(dirname(__FILE__) . '/../config/dbConnect.php');





if (!$dataDB) {
    // En cas d’échec connexion, renvoyer une erreur JSON et sortir
    http_response_code(500);
    echo json_encode(['error' => 'Connexion échouée']);
    exit;
}


$result = pg_query($dataDB, "SELECT * FROM \"User\"");
if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => pg_last_error($dataDB)]);
    exit;
}

$users = [];
while ($row = pg_fetch_assoc($result)) {
    $users[] = $row;
}

echo json_encode($users);