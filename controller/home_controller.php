<?php
session_start();

// Ouvre $dataDB (ressource pg_connect) via ton dbConnect.php
require_once dirname(__FILE__) . '/../config/dbConnect.php';

$squads = [];
try {
    // IMPORTANT: si tes tables/colonnes ont été créées avec des
    // identifiants "CamelCase" ou réservés (user), garde les guillemets.
    $sqlSquads = '
SELECT
  s.id,
  s."name"        AS name,
  s."leaderId"    AS "leaderId",
  s."createdAt"   AS "createdAt",
  s."goal"        AS goal,
  s."city"        AS city,
  s."gameId"      AS "gameId",
  u."name"        AS leader_name,
  g."name"       AS game_name
FROM "Squad" s
LEFT JOIN "User" u ON u.id = s."leaderId"
LEFT JOIN "Game" g ON g.id = s."gameId"
ORDER BY s."createdAt" DESC NULLS LAST, s.id DESC
';

    $resS = pg_query($dataDB, $sqlSquads);
    if ($resS === false) {
        throw new RuntimeException(pg_last_error($dataDB));
    }
    while ($row = pg_fetch_assoc($resS)) {
        $squads[] = $row;
    }
} catch (Throwable $e) {
    // log si besoin
    // error_log('Home squads query failed: ' . $e->getMessage());
    $squads = [];
}


$users = [];
try {
    if (!$dataDB) {
        throw new RuntimeException('DB connection unavailable');
    }

    $sql = '
SELECT
    id,
    name,
    "blastId"   AS blast_id,
    email,
    active,
    premium::int AS premium,
    "balance"   AS grapes,
    "country"   AS country,
    "city"      AS city,
    "createdAt" AS created_at,
    "platform"  AS platform
FROM "User"
WHERE email NOT LIKE $1
ORDER BY "createdAt" DESC
';

    $res = pg_query_params($dataDB, $sql, ['%fakeuser%']);
    if ($res === false) {
        throw new RuntimeException(pg_last_error($dataDB));
    }



    while ($row = pg_fetch_assoc($res)) {
        $users[] = $row;
    }
} catch (Throwable $e) {
    // log si besoin
    // error_log('Home users query failed: ' . $e->getMessage());
    $users = [];
}

// Includes inchangés (CSS chargé via ton header)
include(dirname(__FILE__) . '/../view/templates/header.php');
include(dirname(__FILE__) . '/../view/home.php');
include(dirname(__FILE__) . '/../view/templates/footer.php');
