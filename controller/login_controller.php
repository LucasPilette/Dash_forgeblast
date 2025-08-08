<?php
session_start();
// À adapter selon ta logique de vérification
$email = $_POST['email'];
$password = $_POST['password'];

// Exemple : vérification simple (à remplacer par ta vraie logique)
if ($email === 'admin@site.com' && $password === 'adminpass') {
    $_SESSION['user_role'] = 'admin';
    header('Location: home_controller.php');
    exit;
} elseif ($email === 'guest@site.com' && $password === 'guestpass') {
    $_SESSION['user_role'] = 'guest';
    header('Location: home_controller.php');
    exit;
} else {
    header('Location: ../view/login.php?error=1');
    exit;
}