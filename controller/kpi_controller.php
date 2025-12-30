<?php
session_start();

// Charger la config d'authentification
require_once dirname(__FILE__) . '/../config/auth_config.php';

// Vérifier l'authentification (si activée)
if (AUTHENTICATION_ENABLED && !isset($_SESSION['user_role'])) {
    header('Location: ../view/login.php');
    exit;
}

// Mode développement : créer une session par défaut
if (!AUTHENTICATION_ENABLED && !isset($_SESSION['user_role'])) {
    $_SESSION['user_role'] = DEFAULT_ROLE;
    $_SESSION['user_email'] = DEFAULT_EMAIL;
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
          AND email NOT LIKE '%fakeuser%'
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
          AND email NOT LIKE '%fakeuser%'
        GROUP BY week_start
        ORDER BY week_start DESC
    ";
    $resWithGame = pg_query_params($dataDB, $sqlWithGame, [$dateMin]);
    if ($resWithGame === false) throw new RuntimeException(pg_last_error($dataDB));
    while ($row = pg_fetch_assoc($resWithGame)) {
        $weeklyUsersWithGame[] = $row;
    }

    // Weekly active users: users whose lastActiveAt falls in the week and
    // who had accounts older than 7 days at that activity time (createdAt <= lastActiveAt - 7 days)
    $sqlActive = "
        SELECT
            DATE_TRUNC('week', \"lastActiveAt\") AS week_start,
            COUNT(*) AS active_users
        FROM \"User\"
        WHERE \"lastActiveAt\" IS NOT NULL
          AND \"lastActiveAt\" >= $1
          AND email NOT LIKE '%fakeuser%'
        GROUP BY week_start
        ORDER BY week_start DESC
    ";
    $resActive = pg_query_params($dataDB, $sqlActive, [$dateMin]);
    if ($resActive === false) throw new RuntimeException(pg_last_error($dataDB));
    while ($row = pg_fetch_assoc($resActive)) {
        $weeklyActiveUsers[] = $row;
    }

    // Monthly active users: similar logic but grouped by month and using 30 days threshold
    $sqlMonthlyActive = "
        SELECT
            TO_CHAR(DATE_TRUNC('month', \"lastActiveAt\"), 'YYYY-MM') AS month_start,
            COUNT(*) AS active_users
        FROM \"User\"
        WHERE \"lastActiveAt\" IS NOT NULL
          AND \"lastActiveAt\" >= $1
          AND email NOT LIKE '%fakeuser%'
        GROUP BY month_start
        ORDER BY month_start DESC
    ";
    $resMonthly = pg_query_params($dataDB, $sqlMonthlyActive, [$dateMin]);
    if ($resMonthly === false) throw new RuntimeException(pg_last_error($dataDB));
    $monthlyActiveUsers = [];
    while ($row = pg_fetch_assoc($resMonthly)) {
        $monthlyActiveUsers[] = $row;
    }
} catch (Throwable $e) {
    $weeklyUsers = [];
    $weeklyUsersWithGame = [];
}

// Includes inchangés (CSS chargé via ton header)
include(dirname(__FILE__) . '/../view/templates/header.php');
include(dirname(__FILE__) . '/../view/kpi.php');
include(dirname(__FILE__) . '/../view/templates/footer.php');
