<?php
$ROOT = dirname(__DIR__);

// Charger le gestionnaire d'erreurs global
require_once __DIR__ . '/error_handler.php';

$envPath = $ROOT . DIRECTORY_SEPARATOR . '.env';
if (is_file($envPath)) {

  $autoload = $ROOT . '/vendor/autoload.php';
  if (is_file($autoload)) {
    require_once $autoload;
    if (class_exists(\Dotenv\Dotenv::class)) {
      $dotenv = Dotenv\Dotenv::createImmutable($ROOT);

      $dotenv->safeLoad();
    }
  } else {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
      $line = trim($line);
      if ($line === '' || str_starts_with($line, '#')) continue;
      $pos = strpos($line, '=');
      if ($pos === false) continue;
      $key = trim(substr($line, 0, $pos));
      $val = trim(substr($line, $pos + 1));

      if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
        (str_starts_with($val, "'") && str_ends_with($val, "'"))
      ) {
        $val = substr($val, 1, -1);
      }

      putenv("$key=$val");
      $_ENV[$key] = $val;
    }
  }
}

$DATABASE_URL = getenv('DATABASE_URL') ?: null;

$DB_HOST     = getenv('DB_HOST')     ?: '';
$DB_PORT     = getenv('DB_PORT')     ?: '5432';
$DB_NAME     = getenv('DB_NAME')     ?: '';
$DB_USER     = getenv('DB_USER')     ?: '';
$DB_PASSWORD = getenv('DB_PASSWORD') ?: '';
$DB_SSLMODE  = getenv('DB_SSLMODE')  ?: 'require';


define('DATABASE_URL', $DATABASE_URL ?: null);
define('DB_HOST',     $DB_HOST);
define('DB_PORT',     $DB_PORT);
define('DB_NAME',     $DB_NAME);
define('DB_USER',     $DB_USER);
define('DB_PASSWORD', $DB_PASSWORD);
define('DB_SSLMODE',  $DB_SSLMODE);
