#!/usr/bin/env php
<?php
/**
 * Générateur de hash de mot de passe pour l'authentification
 * 
 * Usage:
 *   php generate_password_hash.php
 *   
 * Ou via navigateur:
 *   http://localhost/forgeblast/scripts/generate_password_hash.php
 */

// Vérifier si on est en ligne de commande ou via navigateur
$isCLI = php_sapi_name() === 'cli';

if (!$isCLI) {
    // Mode navigateur - afficher un formulaire
?>
    <!DOCTYPE html>
    <html lang="fr">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Générateur de Hash - ForgeBlast</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #f5f5f5;
                padding: 40px 20px;
            }

            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            h1 {
                color: #f39321;
                margin-bottom: 10px;
            }

            .subtitle {
                color: #666;
                margin-bottom: 30px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
            }

            input[type="password"],
            input[type="text"],
            select {
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 15px;
            }

            input[type="password"]:focus,
            input[type="text"]:focus,
            select:focus {
                outline: none;
                border-color: #f39321;
            }

            button {
                background: #f39321;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
            }

            button:hover {
                background: #d87b0c;
            }

            .result {
                margin-top: 20px;
                padding: 20px;
                background: #f0f9ff;
                border-left: 4px solid #2196f3;
                border-radius: 6px;
            }

            .result h3 {
                color: #1976d2;
                margin-bottom: 10px;
            }

            .hash {
                background: #263238;
                color: #aed581;
                padding: 15px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 13px;
                word-break: break-all;
                margin: 10px 0;
            }

            .sql {
                background: #263238;
                color: #80cbc4;
                padding: 15px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 13px;
                margin: 10px 0;
                overflow-x: auto;
            }

            .info {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 20px;
            }

            .copy-btn {
                background: #2196f3;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 10px;
            }

            .copy-btn:hover {
                background: #1976d2;
            }
        </style>
    </head>

    <body>
        <div class="container">
            <h1>🔐 Générateur de Hash</h1>
            <p class="subtitle">ForgeBlast Dashboard - Authentification sécurisée</p>

            <div class="info">
                <strong>⚠️ Sécurité :</strong>
                Ce script doit être supprimé ou protégé en production !
            </div>

            <form method="POST">
                <div class="form-group">
                    <label for="email">Email de l'utilisateur</label>
                    <input type="text" id="email" name="email"
                        placeholder="admin@forgeblast.com"
                        value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
                        required>
                </div>

                <div class="form-group">
                    <label for="password">Mot de passe</label>
                    <input type="password" id="password" name="password"
                        placeholder="Entrez un mot de passe sécurisé"
                        required>
                </div>

                <div class="form-group">
                    <label for="role">Rôle</label>
                    <select id="role" name="role">
                        <option value="admin" <?= ($_POST['role'] ?? '') === 'admin' ? 'selected' : '' ?>>Admin</option>
                        <option value="guest" <?= ($_POST['role'] ?? '') === 'guest' ? 'selected' : '' ?>>Guest</option>
                    </select>
                </div>

                <button type="submit">Générer le Hash</button>
            </form>

            <?php
            if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['password'])) {
                $password = $_POST['password'];
                $email = $_POST['email'] ?? 'admin@forgeblast.com';
                $role = $_POST['role'] ?? 'admin';

                // Générer le hash avec Argon2ID (le plus sécurisé)
                $hash = password_hash($password, PASSWORD_ARGON2ID);

                // Requête SQL d'insertion
                $sql = sprintf(
                    "INSERT INTO \"admin_users\" (email, password_hash, role) \nVALUES ('%s', '%s', '%s');",
                    addslashes($email),
                    addslashes($hash),
                    addslashes($role)
                );

                echo '<div class="result">';
                echo '<h3>✓ Hash généré avec succès !</h3>';
                echo '<p><strong>Algorithme :</strong> Argon2ID (recommandé)</p>';
                echo '<p><strong>Email :</strong> ' . htmlspecialchars($email) . '</p>';
                echo '<p><strong>Rôle :</strong> ' . htmlspecialchars($role) . '</p>';
                echo '<p><strong>Hash :</strong></p>';
                echo '<div class="hash">' . htmlspecialchars($hash) . '</div>';
                echo '<button class="copy-btn" onclick="copyToClipboard(\'' . htmlspecialchars($hash, ENT_QUOTES) . '\')">Copier le Hash</button>';
                echo '<p style="margin-top: 20px;"><strong>Requête SQL complète :</strong></p>';
                echo '<div class="sql">' . htmlspecialchars($sql) . '</div>';
                echo '<button class="copy-btn" onclick="copyToClipboard(\'' . htmlspecialchars($sql, ENT_QUOTES) . '\')">Copier la requête SQL</button>';
                echo '</div>';
            }
            ?>
        </div>

        <script>
            function copyToClipboard(text) {
                const textarea = document.createElement('textarea');
                textarea.value = text.replace(/&quot;/g, '"').replace(/&#039;/g, "'");
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('Copié dans le presse-papier !');
            }
        </script>
    </body>

    </html>
<?php
    exit;
}

// ============================================
// MODE LIGNE DE COMMANDE
// ============================================

echo "╔════════════════════════════════════════╗\n";
echo "║  Générateur de Hash - ForgeBlast      ║\n";
echo "╚════════════════════════════════════════╝\n\n";

// Demander l'email
echo "Email de l'utilisateur : ";
$email = trim(fgets(STDIN));
if (empty($email)) {
    $email = 'admin@forgeblast.com';
    echo "  → Utilisation par défaut: $email\n";
}

// Demander le mot de passe
echo "Mot de passe : ";
// Désactiver l'écho pour masquer le mot de passe
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    $password = trim(fgets(STDIN)); // Windows n'a pas de solution simple
} else {
    system('stty -echo');
    $password = trim(fgets(STDIN));
    system('stty echo');
    echo "\n";
}

if (empty($password)) {
    echo "❌ Erreur: Le mot de passe ne peut pas être vide\n";
    exit(1);
}

// Demander le rôle
echo "Rôle (admin/guest) [admin] : ";
$role = trim(fgets(STDIN));
if (empty($role)) {
    $role = 'admin';
}

// Générer le hash
echo "\n🔐 Génération du hash...\n";
$hash = password_hash($password, PASSWORD_ARGON2ID);

// Afficher les résultats
echo "\n╔════════════════════════════════════════╗\n";
echo "║  Résultat                              ║\n";
echo "╚════════════════════════════════════════╝\n\n";
echo "Email      : $email\n";
echo "Rôle       : $role\n";
echo "Algorithme : Argon2ID\n";
echo "Hash       : $hash\n\n";

// Requête SQL
echo "╔════════════════════════════════════════╗\n";
echo "║  Requête SQL                           ║\n";
echo "╚════════════════════════════════════════╝\n\n";

$sql = sprintf(
    "INSERT INTO \"admin_users\" (email, password_hash, role)\nVALUES ('%s', '%s', '%s');",
    addslashes($email),
    addslashes($hash),
    addslashes($role)
);

echo "$sql\n\n";

echo "✅ Hash généré avec succès !\n";
echo "⚠️  Pensez à exécuter la requête SQL dans votre base de données.\n\n";
