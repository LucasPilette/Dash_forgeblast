<?php
$conn = pg_connect("host=forgeblast.ctwoa0swq7fb.eu-west-3.rds.amazonaws.com port=5432 dbname=forgeblast user=postgres password='Qae3Q+a]ljYYg?x8%(Fuf?9pThgj~' sslmode=require");

if ($conn) {
    echo "✅ Connexion OK!";
} else {
    echo "❌ Erreur: " . pg_last_error($conn);
}
