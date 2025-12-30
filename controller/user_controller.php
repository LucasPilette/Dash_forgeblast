<?php

declare(strict_types=1);

// API JSON pour l'entité User (lecture seule)
header('Content-Type: application/json; charset=utf-8');

// CORS retiré pour usage interne uniquement
// Si besoin d'accès externe, spécifier les domaines autorisés

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once __DIR__ . '/dbConnect.php'; // ouvre $dataDB (RDS)

// helpers
function jserr(int $code, string $msg)
{
  http_response_code($code);
  echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}
function jsok(array $data)
{
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

$action = $_GET['action'] ?? 'list';

switch ($action) {
  case 'get': {
      $id = $_GET['id'] ?? '';
      $blastId = $_GET['blast_id'] ?? '';
      if ($id === '' && $blastId === '') jserr(400, 'Missing id or blast_id');

      // Prefer blast_id when provided
      if ($blastId !== '') {
        $sql = 'SELECT * FROM "User" WHERE blast_id = $1 LIMIT 1';
        $res = pg_query_params($dataDB, $sql, [$blastId]);
      } else {
        // Requête paramétrée (évite l’injection SQL)
        $sql = 'SELECT * FROM "User" WHERE id = $1 LIMIT 1';
        $res = pg_query_params($dataDB, $sql, [$id]);
      }
      if (!$res) jserr(500, 'Query failed: ' . pg_last_error($dataDB));

      $row = pg_fetch_assoc($res);
      if (!$row) jserr(404, 'User not found');

      jsok(['item' => $row]);
    }

  case 'list': {
      // Pagination simple
      $page  = max(1, intval($_GET['page']  ?? '1'));
      $limit = max(1, min(200, intval($_GET['limit'] ?? '50')));
      $offset = ($page - 1) * $limit;

      // Compte total
      $resCount = pg_query($dataDB, 'SELECT COUNT(*)::int AS n FROM "User"');
      if (!$resCount) {
        error_log('User count failed: ' . pg_last_error($dataDB));
        jserr(500, 'Erreur de base de données');
      }
      $total = (int)(pg_fetch_assoc($resCount)['n'] ?? 0);

      // Liste (on ordonne par id pour rester agnostique au schéma)
      $sql = 'SELECT * FROM "User" ORDER BY "id" DESC OFFSET $1 LIMIT $2';
      $res = pg_query_params($dataDB, $sql, [$offset, $limit]);
      if (!$res) {
        error_log('User list query failed: ' . pg_last_error($dataDB));
        jserr(500, 'Erreur de base de données');
      }

      $items = [];
      while ($row = pg_fetch_assoc($res)) $items[] = $row;

      jsok([
        'items' => $items,
        'total' => $total,
        'page'  => $page,
        'limit' => $limit,
      ]);
    }

  default:
    jserr(400, 'Unknown action');
}
