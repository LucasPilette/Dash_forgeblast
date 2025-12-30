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

include(dirname(__FILE__) . '/../view/templates/header.php');
include(dirname(__FILE__) . '/../view/sales.php');
include(dirname(__FILE__) . '/../view/templates/footer.php');
