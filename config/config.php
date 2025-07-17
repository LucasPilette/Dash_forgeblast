<?php 

$jsonUsers = file_get_contents('../config/userDataSets.json');
$userData = json_decode($jsonUsers, true);

$jsonSquads = file_get_contents('../config/squadsDataSets.json');
$squadData = json_decode($jsonSquads, true);

$jsonRegistration = file_get_contents('../config/registrationData.json');
$registrationData = json_decode($jsonRegistration, true);