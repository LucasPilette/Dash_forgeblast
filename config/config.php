<?php
// config.php — charge .env puis expose les constantes pour la DB
// Chemin racine du projet (ex: C:\laragon\www\forgeblast)
$ROOT = dirname(__DIR__);

// 1) Charger .env s'il existe
$envPath = $ROOT . DIRECTORY_SEPARATOR . '.env';
if (is_file($envPath)) {
  // a) Si Composer est présent, utiliser vlucas/phpdotenv (recommandé)
  $autoload = $ROOT . '/vendor/autoload.php';
  if (is_file($autoload)) {
    require_once $autoload;
    if (class_exists(\Dotenv\Dotenv::class)) {
      $dotenv = Dotenv\Dotenv::createImmutable($ROOT);
      // safeLoad() n'échoue pas si des clés manquent
      $dotenv->safeLoad();
    }
  } else {
    // b) Mini chargeur maison (fallback sans Composer)
    //    - ignore les lignes vides et les commentaires (# ...)
    //    - gère les quotes simples/doubles autour des valeurs
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
      $line = trim($line);
      if ($line === '' || str_starts_with($line, '#')) continue;
      $pos = strpos($line, '=');
      if ($pos === false) continue;
      $key = trim(substr($line, 0, $pos));
      $val = trim(substr($line, $pos + 1));
      // Retire les quotes éventuelles
      if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
          (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
        $val = substr($val, 1, -1);
      }
      // Exporte dans l'environnement du process PHP
      putenv("$key=$val");
      $_ENV[$key] = $val; // utile si variables_order contient 'E'
    }
  }
}

// 2) Maintenant que .env est chargé, on peut lire nos variables
//    Priorité à l'URI complète DATABASE_URL, sinon variables séparées
$DATABASE_URL = getenv('DATABASE_URL') ?: null;

$DB_HOST     = getenv('DB_HOST')     ?: '';
$DB_PORT     = getenv('DB_PORT')     ?: '5432';
$DB_NAME     = getenv('DB_NAME')     ?: '';
$DB_USER     = getenv('DB_USER')     ?: '';
$DB_PASSWORD = getenv('DB_PASSWORD') ?: '';
$DB_SSLMODE  = getenv('DB_SSLMODE')  ?: 'require';

// 3) Exposer sous forme de constantes (comme tu faisais)
define('DATABASE_URL', $DATABASE_URL ?: null);
define('DB_HOST',     $DB_HOST);
define('DB_PORT',     $DB_PORT);
define('DB_NAME',     $DB_NAME);
define('DB_USER',     $DB_USER);
define('DB_PASSWORD', $DB_PASSWORD);
define('DB_SSLMODE',  $DB_SSLMODE);

// (Optionnel) si tu passes à verify-full, tu peux aussi définir un CA bundle RDS.
// define('DB_SSLROOTCERT', $ROOT . '/rds-combined-ca-bundle.pem');
