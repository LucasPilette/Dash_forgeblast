<?php
session_start();
if (!isset($_SESSION['user_role'])) {
    header('Location: ../view/login.php');
    exit;
}

include(dirname(__FILE__) .'/../view/templates/header.php');
include(dirname(__FILE__) .'/../view/sales.php');
include(dirname(__FILE__) .'/../view/templates/footer.php');