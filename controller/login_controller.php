<?php

/**
 * Login Controller - Authentification sécurisée
 * 
 * NOTE: Pour utiliser ce système d'authentification sécurisé, vous devez d'abord créer
 * une table admin_users dans votre base de données:
 * 
 * CREATE TABLE IF NOT EXISTS "admin_users" (
 *     id SERIAL PRIMARY KEY,
 *     email VARCHAR(255) UNIQUE NOT NULL,
 *     password_hash VARCHAR(255) NOT NULL,
 *     role VARCHAR(50) NOT NULL DEFAULT 'guest',
 *     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *     last_login TIMESTAMP
 * );
 * 
 * Puis créer un utilisateur admin:
 * INSERT INTO "admin_users" (email, password_hash, role) 
 * VALUES ('admin@site.com', '$argon2id$v=19$m=65536,t=4,p=1$...', 'admin');
 * 
 * Pour générer un hash, utilisez: password_hash('votre_mot_de_passe', PASSWORD_ARGON2ID)
 * 
 * En attendant la migration, le système utilise les credentials hardcodés pour compatibilité.
 */

session_start();

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/validation.php';

// Mode de fonctionnement
$USE_DATABASE_AUTH = false; // Passer à true après avoir créé la table admin_users

try {
    // Récupérer et valider les données
    $email = isset($_POST['email']) ? validateEmail($_POST['email']) : '';
    $password = isset($_POST['password']) ? validatePassword($_POST['password'], 6) : '';

    if (empty($email) || empty($password)) {
        throw new InvalidArgumentException('Email et mot de passe requis');
    }

    if ($USE_DATABASE_AUTH) {
        // Authentification avec base de données (sécurisé)
        require_once __DIR__ . '/../config/dbConnect.php';

        $sql = 'SELECT id, email, password_hash, role, last_login FROM "admin_users" WHERE email = $1 LIMIT 1';
        $res = pg_query_params($dataDB, $sql, [$email]);

        if (!$res) {
            throw new RuntimeException('Erreur base de données');
        }

        $user = pg_fetch_assoc($res);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            // Ne pas révéler si l'email existe ou non
            throw new InvalidArgumentException('Identifiants incorrects');
        }

        // Authentification réussie
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];

        // Mettre à jour la date de dernière connexion
        $updateSql = 'UPDATE "admin_users" SET last_login = NOW() WHERE id = $1';
        pg_query_params($dataDB, $updateSql, [$user['id']]);
    } else {
        // Authentification hardcodée (temporaire - à migrer vers la DB)
        // TODO: Migrer vers l'authentification par base de données

        if ($email === 'admin@site.com' && $password === 'adminpass') {
            $_SESSION['user_role'] = 'admin';
            $_SESSION['user_email'] = $email;
        } elseif ($email === 'guest@site.com' && $password === 'guestpass') {
            $_SESSION['user_role'] = 'guest';
            $_SESSION['user_email'] = $email;
        } else {
            throw new InvalidArgumentException('Identifiants incorrects');
        }
    }

    // Redirection vers la page d'accueil
    header('Location: home_controller.php');
    exit;
} catch (InvalidArgumentException $e) {
    // Erreur de validation - rediriger avec message d'erreur
    error_log('Login failed: ' . $e->getMessage() . ' for email: ' . ($email ?? 'unknown'));
    header('Location: ../view/login.php?error=1&message=' . urlencode($e->getMessage()));
    exit;
} catch (Exception $e) {
    // Erreur système
    error_log('Login system error: ' . $e->getMessage());
    header('Location: ../view/login.php?error=1&message=Erreur+système');
    exit;
}
