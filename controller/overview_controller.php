<?php
session_start();
if (!isset($_SESSION['user_role'])) {
    header('Location: ../view/login.php');
    exit;
}

// Ouvre $dataDB (ressource pg_connect) via ton dbConnect.php
require_once dirname(__FILE__) . '/../config/dbConnect.php';

// Compute date window from period parameter (1m/3m/6m/1y)
$period = $_GET['period'] ?? '3m';
switch($period) {
    case '1m': $dateMin = date('Y-m-d', strtotime('-1 month')); break;
    case '3m': $dateMin = date('Y-m-d', strtotime('-3 months')); break;
    case '6m': $dateMin = date('Y-m-d', strtotime('-6 months')); break;
    case '1y': $dateMin = date('Y-m-d', strtotime('-1 year')); break;
    default: $dateMin = date('Y-m-d', strtotime('-3 months')); break;
}

$weeklyNewUsers = [];
$weeklyOnboarded = [];
$weeklyActiveUsers = [];
$monthlyActiveUsers = [];
$weeklyTransactions = [];
$weeklyCumulativeUsers = [];

try {
    // Weekly new users
    $sql = "SELECT DATE_TRUNC('week', \"createdAt\") AS week_start, COUNT(*) AS new_users FROM \"User\" WHERE \"createdAt\" >= $1 GROUP BY week_start ORDER BY week_start DESC";
    $res = pg_query_params($dataDB, $sql, [$dateMin]);
    if ($res === false) throw new RuntimeException(pg_last_error($dataDB));
    while ($row = pg_fetch_assoc($res)) $weeklyNewUsers[] = $row;

    // Also fetch full-history weekly new users (no lower bound) to compute cumulative totals
    $sql2 = "SELECT DATE_TRUNC('week', \"createdAt\") AS week_start, COUNT(*) AS new_users FROM \"User\" GROUP BY week_start ORDER BY week_start ASC";
    $res2 = pg_query($dataDB, $sql2);
    if ($res2 === false) throw new RuntimeException(pg_last_error($dataDB));
    $acc = 0;
    $fullWeeks = [];
    while ($r = pg_fetch_assoc($res2)) {
        $wk = $r['week_start'];
        $count = (int)$r['new_users'];
        $acc += $count;
        $fullWeeks[$wk] = $acc; // cumulative up to and including this week
    }
    // Keep only cumulative entries that are within the requested period window (>= $dateMin)
    foreach ($fullWeeks as $wk => $cum) {
        if ($wk >= $dateMin) {
            $weeklyCumulativeUsers[] = ['week_start' => $wk, 'total_users' => $cum];
        }
    }

    // Weekly onboarded (created with a linked game)
    $sql = "SELECT DATE_TRUNC('week', \"createdAt\") AS week_start, COUNT(*) AS onboarded FROM \"User\" WHERE \"createdAt\" >= $1 AND \"currentGameId\" IS NOT NULL GROUP BY week_start ORDER BY week_start DESC";
    $res = pg_query_params($dataDB, $sql, [$dateMin]);
    if ($res === false) throw new RuntimeException(pg_last_error($dataDB));
    while ($row = pg_fetch_assoc($res)) $weeklyOnboarded[] = $row;

    // Weekly active users (lastActiveAt within week, account older than 7 days)
    $sql = "SELECT DATE_TRUNC('week', \"lastActiveAt\") AS week_start, COUNT(*) AS active_users
            FROM \"User\"
            WHERE \"lastActiveAt\" IS NOT NULL
              AND \"lastActiveAt\" >= $1
              AND \"createdAt\" <= (\"lastActiveAt\" - INTERVAL '7 days')
            GROUP BY week_start
            ORDER BY week_start DESC";
    $res = pg_query_params($dataDB, $sql, [$dateMin]);
    if ($res === false) throw new RuntimeException(pg_last_error($dataDB));
    while ($row = pg_fetch_assoc($res)) $weeklyActiveUsers[] = $row;

    // Monthly active users (for conversion denominator) - accounts older than 30 days at activity
    $sql = "SELECT TO_CHAR(DATE_TRUNC('month', \"lastActiveAt\"), 'YYYY-MM') AS month_start, COUNT(*) AS active_users
            FROM \"User\"
            WHERE \"lastActiveAt\" IS NOT NULL
              AND \"lastActiveAt\" >= $1
              AND \"createdAt\" <= (\"lastActiveAt\" - INTERVAL '30 days')
            GROUP BY month_start
            ORDER BY month_start DESC";
    $res = pg_query_params($dataDB, $sql, [$dateMin]);
    if ($res === false) throw new RuntimeException(pg_last_error($dataDB));
    while ($row = pg_fetch_assoc($res)) $monthlyActiveUsers[] = $row;

    // Weekly transactions: fetch RevenueCat transactions via local admin endpoint and group by week
    // This mirrors client-side fetchAndInitRevenue but runs server-side for deterministic bootstrap
    $txJson = @file_get_contents('http://localhost:3100/admin/revenuecat/transactions?page=1&limit=500');
    if ($txJson !== false) {
        $txObj = json_decode($txJson, true);
        $items = $txObj['items'] ?? $txObj['transactions'] ?? $txObj['data'] ?? [];
        $group = [];
        $monthlyTxSums = [];
        $monthlyPayers = []; // month => associative array of payer ids -> true
        foreach ($items as $tx) {
            $date = $tx['purchasedAt'] ?? $tx['purchased_at'] ?? null;
            if (!$date) continue;
            try { $d = new DateTime($date); } catch (Throwable $__) { continue; }
            if ($d < new DateTime($dateMin)) continue;
            // compute week start date (Monday) as Y-m-d
            $isoYear = (int)$d->format('o');
            $isoWeek = (int)$d->format('W');
            $wk = new DateTime();
            $wk->setISODate($isoYear, $isoWeek);
            $weekStart = $wk->format('Y-m-d');
            if (!isset($group[$weekStart])) $group[$weekStart] = 0;
            $group[$weekStart]++;
            // monthly aggregates
            $month = $d->format('Y-m');
            $monthlyTxSums[$month] = ($monthlyTxSums[$month] ?? 0) + 1;
            // try to extract a payer id from common fields
            $payerId = $tx['app_user_id'] ?? $tx['appUserId'] ?? $tx['purchaser_id'] ?? $tx['customer_id'] ?? null;
            if ($payerId) {
                if (!isset($monthlyPayers[$month])) $monthlyPayers[$month] = [];
                $monthlyPayers[$month][strval($payerId)] = true;
            }
        }
        foreach ($group as $wk => $count) {
            $weeklyTransactions[] = ['week_start' => $wk, 'tx_count' => $count];
        }
        // build monthly arrays for bootstrap: sums and unique payers
        $monthlyTxSumArr = [];
        foreach ($monthlyTxSums as $m => $sum) {
            $monthlyTxSumArr[] = ['month_start' => $m, 'tx_sum' => $sum];
        }
        // unique payers
        $monthlyUniquePayersArr = [];
        foreach ($monthlyPayers as $m => $set) {
            $monthlyUniquePayersArr[] = ['month_start' => $m, 'unique_payers' => count($set)];
        }
        // sort desc by week_start
        usort($weeklyTransactions, function($a,$b){ return strcmp($b['week_start'],$a['week_start']); });
    }

    // expose monthly tx sums / unique payers to the view
    if (!isset($monthlyTxSumArr)) $monthlyTxSumArr = [];
    if (!isset($monthlyUniquePayersArr)) $monthlyUniquePayersArr = [];

} catch (Throwable $e) {
    // On error, expose empty datasets and log
    error_log('Overview controller error: ' . $e->getMessage());
    $weeklyNewUsers = $weeklyOnboarded = $weeklyActiveUsers = $monthlyActiveUsers = $weeklyTransactions = [];
}

// Include view which will bootstrap the JS variables
include(dirname(__FILE__) .'/../view/templates/header.php');
include(dirname(__FILE__) .'/../view/overvieww.php');
include(dirname(__FILE__) .'/../view/templates/footer.php');