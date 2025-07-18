<?php
header('Content-Type: application/json');

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Retourne une date aléatoire dans les 2 dernières années
function random_date_past_two_years() {
    $start = strtotime('-2 years');
    $end = time();
    return date('Y-m-d', mt_rand($start, $end));
}

// Génère un ID aléatoire de 8 caractères hex
function generate_hex_id($length = 8) {
    return bin2hex(random_bytes($length / 2));
}

function generate_squads($count = 10) {
    $cities = ["Reims", "Paris", "Lyon", "Nice", "Marseille", "Toulouse", "Bordeaux", "Strasbourg", "Lille", "Nantes", "Grenoble", "Rouen", "Dijon"];
    $team_suffixes = ["Champions", "Titans", "Warriors", "Avengers", "Phoenix", "Raiders", "Guardians", "Kings", "Spartans", "Dragons", "Reapers", "Rangers", "Legends"];
    $games = ["Brawl Stars", "League of Legends", "Valorant", "Fortnite", "Call of Duty", "Apex Legends", "Rainbow Six Siege", "Rocket League", "PUBG", "Overwatch"];
    $leaders = ["Kurito", "Xyloz", "SithLord", "Zephyr", "Falcon", "Vortex", "Obsidian", "Nexus", "Rogue", "Phoenix", "Shadow", "Nova", "Blaze"];
    $statuses = ["active", "inactive"];
    
    $squads = [];

    for ($i = 0; $i < $count; $i++) {
        $city = $cities[array_rand($cities)];
        $suffix = $team_suffixes[array_rand($team_suffixes)];
        $game = $games[array_rand($games)];
        $leader = $leaders[array_rand($leaders)];
        $members = rand(1, 5) . "/5";

        $squad = [
            "squad_name" => "$city $suffix",
            "squad_id" => generate_hex_id(),
            "game" => $game,
            "leader" => $leader,
            "members" => $members,
            "created_date" => random_date_past_two_years(),
            "status" => $statuses[array_rand($statuses)]
        ];

        $squads[] = $squad;
    }

    return $squads;
}

echo json_encode(generate_squads(rand(10, 30)), JSON_PRETTY_PRINT);