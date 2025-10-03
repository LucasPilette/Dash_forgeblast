<?php
// dbConnect.php — crée une connexion PostgreSQL ($dataDB) utilisable par tes contrôleurs

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Construit une chaîne de connexion libpq sûre (avec quoting simple).
 * NB: libpq accepte param='valeur' ; on échappe juste les quotes simples.
 */
function pg_conn_kv(string $k, string $v): string {
  $v = str_replace("'", "\\'", $v);
  return sprintf("%s='%s'", $k, $v);
}

/** Retourne la chaîne de connexion en lisant DATABASE_URL ou les variables séparées. */
function build_pg_conn_string(): string {
  // 1) DATABASE_URL prioritaire
  if (defined('DATABASE_URL') && DATABASE_URL) {
    $u = parse_url(DATABASE_URL);
    if ($u === false) {
      throw new RuntimeException('DATABASE_URL invalide.');
    }
    $host = $u['host'] ?? 'localhost';
    $port = strval($u['port'] ?? 5432);
    $db   = ltrim($u['path'] ?? '', '/');
    $user = isset($u['user']) ? urldecode($u['user']) : '';
    $pass = isset($u['pass']) ? urldecode($u['pass']) : '';
    $ssl  = defined('DB_SSLMODE') ? DB_SSLMODE : 'require';

    $parts = [
      pg_conn_kv('host', $host),
      pg_conn_kv('port', $port),
      pg_conn_kv('dbname', $db),
      pg_conn_kv('user', $user),
      pg_conn_kv('password', $pass),
      pg_conn_kv('sslmode', $ssl),
    ];

    // Si tu passes en verify-full, décommente et pointe vers le CA bundle :
    // if (defined('DB_SSLROOTCERT') && DB_SSLROOTCERT) {
    //   $parts[] = pg_conn_kv('sslrootcert', DB_SSLROOTCERT);
    // }

    return implode(' ', $parts);
  }

  // 2) Fallback : variables séparées
  $host = DB_HOST;
  $port = DB_PORT ?: '5432';
  $db   = DB_NAME;
  $user = DB_USER;
  $pass = DB_PASSWORD;
  $ssl  = DB_SSLMODE ?: 'require';

  if (!$host || !$db || !$user) {
    throw new RuntimeException('Config DB incomplète : renseigne DATABASE_URL ou DB_HOST/DB_NAME/DB_USER.');
  }

  $parts = [
    pg_conn_kv('host', $host),
    pg_conn_kv('port', $port),
    pg_conn_kv('dbname', $db),
    pg_conn_kv('user', $user),
    pg_conn_kv('password', $pass),
    pg_conn_kv('sslmode', $ssl),
  ];

  return implode(' ', $parts);
}

/** Ouvre la connexion globale. */
function open_pg_connection() {
  $connString = build_pg_conn_string();
  $conn = @pg_connect($connString);
  if (!$conn) {
    // Log serveur (error_log) + réponse JSON 500 utile côté front
    error_log('DB connect failed: ' . pg_last_error());
    if (!headers_sent()) {
      header('Content-Type: application/json; charset=utf-8');
      http_response_code(500);
    }
    echo json_encode(['error' => 'DB connection error']);
    exit;
  }
  return $conn;
}

// --- Ouverture immédiate pour le reste de l’app ---
$dataDB = open_pg_connection();
