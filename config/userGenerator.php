<!-- <?php
header('Content-Type: application/json');

// Affiche les erreurs si jamais un problème persiste (en dev uniquement)
ini_set('display_errors', 1);
error_reporting(E_ALL);


function random_date_within_last_year() {
    $start = strtotime('-1 year');
    $end = time();
    $timestamp = mt_rand($start, $end);
    return date('Y-m-d', $timestamp);
}
// Génère un tableau d'utilisateurs aléatoires
function generate_users($count = 40) {
    $first_names = [
        "alex", "bruno", "chloe", "dylan", "emma", "felix", "giselle", "hugo", "iris", "julien",
        "karim", "laura", "maxime", "nora", "olivier", "pauline", "quentin", "rachel", "simon", "tania",
        "ulysse", "valerie", "wassim", "xavier", "yasmina", "zack", "amelie", "boris", "celine", "damien",
        "elise", "fabien", "gabrielle", "helene", "ismael", "jeanne", "kevin", "lea", "marwan", "nadege"
    ];

    $statuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
    $billings = ["monthly", "yearly"];
    $users = [];

    for ($i = 0; $i < $count; $i++) {
        $name = $first_names[$i % count($first_names)];
        $premium = rand(0, 3) === 1 ? "yes" : "no";
        $os = rand(0, 1) === 1 ? "android" : "ios";

        $user = [
            "user_name" => $name,
            "user_id" => strval(100000 + $i + 1),
            "blast_id" => "BLAST-" . rand(1000, 9999),
            "email" => "$name@example.com",
            "join_date" => random_date_within_last_year(),
            "balance" => round(rand(4000, 50000) / 100, 2),
            "status" => $statuses[array_rand($statuses)],
            "premium" => $premium,
            "os" => $os,
        ];

        if ($premium === "yes") {
            $user["billing"] = $billings[array_rand($billings)];
        }

        $users[] = $user;
    }

    return $users;
}

// Afficher en JSON
// echo json_encode(generate_users(rand(100, 1000)), JSON_PRETTY_PRINT); -->