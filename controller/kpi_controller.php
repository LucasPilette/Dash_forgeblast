<?php
session_start();
if (!isset($_SESSION['user_role'])) {
    header('Location: ../view/login.php');
    exit;
}



require_once dirname(__FILE__) . '/../config/dbConnect.php';

$periods = [
    '1m' => '-1 month',
    '3m' => '-3 months',
    '6m' => '-6 months',
    '1y' => '-1 year'
];

$selectedPeriod = $_GET['period'] ?? '1m';
$since = $periods[$selectedPeriod] ?? '-1 month';
$dateMin = date('Y-m-d', strtotime($since));


$weeklyUsers = [];
$weeklyActiveUsers = [];
$weeklyUsersWithGame = [];
try {
    // Nouveaux utilisateurs par semaine
    $sqlNew = "
        SELECT
            DATE_TRUNC('week', \"createdAt\") AS week_start,
            COUNT(*) AS new_users
        FROM \"User\"
        WHERE \"createdAt\" >= $1
        GROUP BY week_start
        ORDER BY week_start DESC
    ";
    $resNew = pg_query_params($dataDB, $sqlNew, [$dateMin]);
    if ($resNew === false) throw new RuntimeException(pg_last_error($dataDB));
    while ($row = pg_fetch_assoc($resNew)) {
        $weeklyUsers[] = $row;
    }

    $sqlWithGame = "
        SELECT
            DATE_TRUNC('week', \"createdAt\") AS week_start,
            COUNT(*) AS new_users_with_game
        FROM \"User\"
        WHERE \"createdAt\" >= $1
          AND \"currentGameId\" IS NOT NULL
        GROUP BY week_start
        ORDER BY week_start DESC
    ";
    $resWithGame = pg_query_params($dataDB, $sqlWithGame, [$dateMin]);
    if ($resWithGame === false) throw new RuntimeException(pg_last_error($dataDB));
    while ($row = pg_fetch_assoc($resWithGame)) {
        $weeklyUsersWithGame[] = $row;
    }

} catch (Throwable $e) {
    $weeklyUsers = [];
    $weeklyUsersWithGame = [];
}

// Includes inchangés (CSS chargé via ton header)
include(dirname(__FILE__) .'/../view/templates/header.php');
include(dirname(__FILE__) .'/../view/kpi.php');
include(dirname(__FILE__) .'/../view/templates/footer.php');