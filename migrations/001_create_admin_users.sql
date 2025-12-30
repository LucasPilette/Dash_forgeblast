-- ==============================================
-- Migration: Système d'authentification sécurisé
-- Description: Crée la table admin_users pour gérer l'authentification
-- Date: 2025-12-26
-- ==============================================

-- Créer la table admin_users
CREATE TABLE IF NOT EXISTS "admin_users" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_admin_users_email ON "admin_users"(email);
CREATE INDEX idx_admin_users_role ON "admin_users"(role);

-- Commenter la table
COMMENT ON TABLE "admin_users" IS 'Table des utilisateurs administrateurs du dashboard';
COMMENT ON COLUMN "admin_users".email IS 'Email de l''utilisateur (unique)';
COMMENT ON COLUMN "admin_users".password_hash IS 'Hash du mot de passe (Argon2ID)';
COMMENT ON COLUMN "admin_users".role IS 'Rôle de l''utilisateur (admin, guest, etc.)';
COMMENT ON COLUMN "admin_users".last_login IS 'Date et heure de la dernière connexion';
COMMENT ON COLUMN "admin_users".is_active IS 'Indique si le compte est actif';

-- ==============================================
-- Instructions pour créer les utilisateurs
-- ==============================================

-- 1. Générer un hash de mot de passe avec PHP:
-- <?php
-- $password = 'votre_mot_de_passe_securise';
-- $hash = password_hash($password, PASSWORD_ARGON2ID);
-- echo "Hash: $hash\n";
-- ?>

-- 2. Exemple d'insertion d'un admin (remplacer le hash par le vôtre):
-- INSERT INTO "admin_users" (email, password_hash, role) 
-- VALUES ('admin@forgeblast.com', '$argon2id$v=19$m=65536,t=4,p=1$...votre_hash...', 'admin');

-- 3. Exemple d'insertion d'un guest (remplacer le hash par le vôtre):
-- INSERT INTO "admin_users" (email, password_hash, role) 
-- VALUES ('guest@forgeblast.com', '$argon2id$v=19$m=65536,t=4,p=1$...votre_hash...', 'guest');

-- ==============================================
-- Requêtes utiles
-- ==============================================

-- Voir tous les utilisateurs admin
-- SELECT id, email, role, created_at, last_login, is_active FROM "admin_users";

-- Désactiver un utilisateur
-- UPDATE "admin_users" SET is_active = false WHERE email = 'user@example.com';

-- Changer le rôle d'un utilisateur
-- UPDATE "admin_users" SET role = 'admin' WHERE email = 'user@example.com';

-- Supprimer un utilisateur
-- DELETE FROM "admin_users" WHERE email = 'user@example.com';

-- ==============================================
-- Rollback (si nécessaire)
-- ==============================================

-- Pour supprimer la table et tous ses index:
-- DROP TABLE IF EXISTS "admin_users" CASCADE;
