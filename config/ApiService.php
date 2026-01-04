<?php

declare(strict_types=1);

/**
 * Service centralisé pour communiquer avec l'API NestJS
 * Remplace les requêtes SQL directes par des appels API
 */
class ApiService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = getenv('API_BASE') ?: 'http://127.0.0.1:3100';
        $this->apiKey = getenv('API_KEY') ?: '';
    }

    /**
     * Effectue une requête HTTP vers l'API
     */
    private function request(string $endpoint, string $method = 'GET', ?array $data = null): ?array
    {
        $url = rtrim($this->baseUrl, '/') . '/' . ltrim($endpoint, '/');

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        if ($data !== null && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode >= 400) {
            error_log("API Error: $endpoint returned $httpCode");
            return null;
        }

        return json_decode($response, true);
    }

    // ==================== USERS ====================

    /**
     * Récupère le nombre total d'utilisateurs
     */
    public function getUserCount(): int
    {
        $result = $this->request('/users/count');
        return $result['total'] ?? 0;
    }

    /**
     * Récupère la liste des utilisateurs (paginée)
     * @return array ['users' => [...], 'total' => int, 'page' => int, 'limit' => int]
     */
    public function getUsers(int $page = 1, int $limit = 20): array
    {
        $result = $this->request("/users/list?page=$page&limit=$limit");

        if (!$result || !isset($result['users'])) {
            return ['users' => [], 'total' => 0, 'page' => $page, 'limit' => $limit];
        }

        return [
            'users' => $result['users']['users'] ?? $result['users'] ?? [],
            'total' => $result['users']['total'] ?? 0,
            'page' => $result['users']['page'] ?? $page,
            'limit' => $result['users']['limit'] ?? $limit,
        ];
    }

    /**
     * Récupère un utilisateur par ID
     */
    public function getUserById(string $id): ?array
    {
        $result = $this->request("/users/$id");
        return $result['user'] ?? $result ?? null;
    }

    /**
     * Recherche des utilisateurs par nom
     */
    public function searchUsers(string $query): array
    {
        $result = $this->request("/users/search?q=" . urlencode($query));
        return $result ?? [];
    }

    // ==================== SQUADS ====================

    /**
     * Récupère la liste des squads (paginée)
     * @return array ['squads' => [...], 'total' => int]
     */
    public function getSquads(int $page = 1, int $limit = 20): array
    {
        $result = $this->request("/squads/list?page=$page&limit=$limit");

        if (!$result) {
            return ['squads' => [], 'total' => 0];
        }

        return [
            'squads' => $result['squads'] ?? [],
            'total' => $result['total'] ?? 0,
        ];
    }

    /**
     * Récupère un squad par ID
     */
    public function getSquadById(string $id): ?array
    {
        $result = $this->request("/squads/$id");
        return $result ?? null;
    }

    // ==================== METRICS ====================

    /**
     * Récupère l'ARPU
     */
    public function getArpu(int $days = 30, string $denom = 'logged_in'): ?array
    {
        $result = $this->request("/metrics/arpu?days=$days&denom=$denom");
        return $result;
    }

    /**
     * Récupère l'ARPU des payeurs
     */
    public function getArpuPayers(int $days = 30): ?array
    {
        $result = $this->request("/metrics/arpu/payers?days=$days");
        return $result;
    }

    /**
     * Récupère les revenus journaliers
     */
    public function getRevenueDaily(int $days = 30): ?array
    {
        $result = $this->request("/metrics/revenue/daily?days=$days");
        return $result;
    }

    /**
     * Récupère le taux de rétention
     */
    public function getRetention(int $days = 30): ?array
    {
        $result = $this->request("/metrics/retention?days=$days");
        return $result;
    }

    /**
     * Récupère le taux de churn
     */
    public function getChurn(int $days = 30): ?array
    {
        $result = $this->request("/metrics/churn?days=$days");
        return $result;
    }

    // ==================== TRANSACTIONS ====================

    /**
     * Récupère les transactions
     */
    public function getTransactions(int $page = 1, int $limit = 500): ?array
    {
        $result = $this->request("/transactions?page=$page&limit=$limit");
        return $result;
    }

    // ==================== ADMIN / REVENUECAT ====================

    /**
     * Récupère le total des revenus RevenueCat
     */
    public function getRevenueCatTotal(): ?array
    {
        $result = $this->request("/admin/revenuecat/revenue/total");
        return $result;
    }

    /**
     * Récupère les transactions RevenueCat
     */
    public function getRevenueCatTransactions(int $page = 1, int $limit = 500): ?array
    {
        $result = $this->request("/admin/revenuecat/transactions?page=$page&limit=$limit");
        return $result;
    }
}
