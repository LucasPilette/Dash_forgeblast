<?php 


$host = 'ep-polished-pine-a2zyqemx-pooler.eu-central-1.aws.neon.tech';
$db = 'neondb';
$user = 'neondb_owner';
$pass = 'npg_al0eMr3NwbEJ';
$endpoint_id = 'ep-polished-pine-a2zyqemx';

$conn_string = "host=$host port=5432 dbname=$db user=$user password=$pass sslmode=require options='endpoint=$endpoint_id'";

$dataDB = pg_connect($conn_string);