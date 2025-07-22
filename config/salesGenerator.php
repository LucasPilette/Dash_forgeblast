<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Génère une date aléatoire dans l'année passée
function random_date_within_last_year() {
    $start = strtotime('-1 year');
    $end = time();
    $timestamp = mt_rand($start, $end);
    return date('Y-m-d', $timestamp);
}

// Génère un montant entre 0.99 et 100.00
function random_amount() {
    return round(mt_rand(99, 10000) / 100, 2);
}

// Génère des revenus aléatoires
function generate_revenues($count = 100) {
    $billing_types = ["monthly", "yearly"];
    $revenues = [];

    for ($i = 0; $i < $count; $i++) {
        $revenue = [
            "revenue_id" => strval(200000 + $i + 1),
            "billing_type" => $billing_types[array_rand($billing_types)],
            "billing_date" => random_date_within_last_year(),
            "amount" => random_amount()
        ];
        $revenues[] = $revenue;
    }

    return $revenues;
}

// Affichage du JSON
echo json_encode(generate_revenues(rand(50, 200)), JSON_PRETTY_PRINT);