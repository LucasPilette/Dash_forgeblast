<?php


$json = file_get_contents('../config/dataSets.json'); // ou ton URL si c'est distant
$data = json_decode($json, true);


include(dirname(__FILE__) .'/../view/templates/header.php');
include(dirname(__FILE__) .'/../view/home.php');
include(dirname(__FILE__) .'/../view/templates/footer.php');