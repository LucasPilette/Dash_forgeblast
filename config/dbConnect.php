<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Classe Database avec pattern Singleton
 * Gère une connexion PostgreSQL unique et réutilisable
 */
class Database
{
  private static ?Database $instance = null;
  private $connection = null;

  /**
   * Constructeur privé pour empêcher l'instanciation directe
   */
  private function __construct()
  {
    $this->connection = $this->connect();
  }

  /**
   * Empêche le clonage de l'instance
   */
  private function __clone() {}

  /**
   * Récupère l'instance unique de Database
   * @return Database Instance unique
   */
  public static function getInstance(): Database
  {
    if (self::$instance === null) {
      self::$instance = new self();
    }
    return self::$instance;
  }

  /**
   * Établit la connexion à la base de données
   * @return resource Connexion PostgreSQL
   * @throws RuntimeException Si la connexion échoue
   */
  private function connect()
  {
    $connString = $this->buildConnectionString();
    $conn = pg_connect($connString);

    if (!$conn) {
      error_log('DB connect failed. Connection string: ' . $this->buildConnectionString(true));
      throw new RuntimeException('Impossible de se connecter à la base de données');
    }

    return $conn;
  }

  /**
   * Construit la chaîne de connexion PostgreSQL
   * @param bool $maskPassword Masquer le mot de passe pour les logs
   * @return string Chaîne de connexion
   */
  private function buildConnectionString(bool $maskPassword = false): string
  {
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
    } else {
      $host = DB_HOST;
      $port = DB_PORT ?: '5432';
      $db   = DB_NAME;
      $user = DB_USER;
      $pass = DB_PASSWORD;
      $ssl  = DB_SSLMODE ?: 'require';

      if (!$host || !$db || !$user) {
        throw new RuntimeException('Config DB incomplète : renseigne DATABASE_URL ou DB_HOST/DB_NAME/DB_USER.');
      }
    }

    if ($maskPassword) {
      $pass = '***';
    }

    $parts = [
      $this->pgConnKv('host', $host),
      $this->pgConnKv('port', $port),
      $this->pgConnKv('dbname', $db),
      $this->pgConnKv('user', $user),
      $this->pgConnKv('password', $pass),
      $this->pgConnKv('sslmode', $ssl),
    ];

    return implode(' ', $parts);
  }

  /**
   * Formate une paire clé-valeur pour la chaîne de connexion
   * @param string $k Clé
   * @param string $v Valeur
   * @return string Paire formatée
   */
  private function pgConnKv(string $k, string $v): string
  {
    $v = str_replace("'", "\\'", $v);
    return sprintf("%s='%s'", $k, $v);
  }

  /**
   * Récupère la connexion à la base de données
   * @return resource Connexion PostgreSQL
   */
  public function getConnection()
  {
    if (!$this->connection || pg_connection_status($this->connection) !== PGSQL_CONNECTION_OK) {
      $this->connection = $this->connect();
    }
    return $this->connection;
  }

  /**
   * Vérifie si la connexion est active
   * @return bool True si active
   */
  public function isConnected(): bool
  {
    return $this->connection && pg_connection_status($this->connection) === PGSQL_CONNECTION_OK;
  }

  /**
   * Ferme la connexion (appelé automatiquement à la fin du script)
   */
  public function __destruct()
  {
    if ($this->connection && is_resource($this->connection)) {
      pg_close($this->connection);
    }
  }
}

// Pour compatibilité avec le code existant, on maintient la variable globale $dataDB
$dataDB = Database::getInstance()->getConnection();
