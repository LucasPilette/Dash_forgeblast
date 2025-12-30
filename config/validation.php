<?php

/**
 * Fonctions de validation des données
 */

/**
 * Valide une adresse email
 * @param string $email Email à valider
 * @return string Email validé
 * @throws InvalidArgumentException Si l'email est invalide
 */
function validateEmail(string $email): string
{
    $email = trim($email);

    if (empty($email)) {
        throw new InvalidArgumentException('Email requis');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Format email invalide');
    }

    if (strlen($email) > 255) {
        throw new InvalidArgumentException('Email trop long (max 255 caractères)');
    }

    return $email;
}

/**
 * Valide un ID utilisateur
 * @param mixed $id ID à valider
 * @return int ID validé
 * @throws InvalidArgumentException Si l'ID est invalide
 */
function validateUserId($id): int
{
    if (!is_numeric($id) || $id < 1) {
        throw new InvalidArgumentException('ID utilisateur invalide');
    }
    return (int)$id;
}

/**
 * Valide une chaîne de caractères générique
 * @param string $value Valeur à valider
 * @param int $minLength Longueur minimale
 * @param int $maxLength Longueur maximale
 * @param string $fieldName Nom du champ (pour les messages d'erreur)
 * @return string Valeur validée et nettoyée
 * @throws InvalidArgumentException Si la validation échoue
 */
function validateString(string $value, int $minLength = 1, int $maxLength = 255, string $fieldName = 'Champ'): string
{
    $value = trim($value);
    $length = mb_strlen($value);

    if ($length < $minLength) {
        throw new InvalidArgumentException("$fieldName trop court (min $minLength caractères)");
    }

    if ($length > $maxLength) {
        throw new InvalidArgumentException("$fieldName trop long (max $maxLength caractères)");
    }

    return $value;
}

/**
 * Valide un nombre entier avec plage optionnelle
 * @param mixed $value Valeur à valider
 * @param int|null $min Valeur minimale (null = pas de limite)
 * @param int|null $max Valeur maximale (null = pas de limite)
 * @param string $fieldName Nom du champ
 * @return int Valeur validée
 * @throws InvalidArgumentException Si la validation échoue
 */
function validateInteger($value, ?int $min = null, ?int $max = null, string $fieldName = 'Valeur'): int
{
    if (!is_numeric($value)) {
        throw new InvalidArgumentException("$fieldName doit être un nombre entier");
    }

    $intValue = (int)$value;

    if ($min !== null && $intValue < $min) {
        throw new InvalidArgumentException("$fieldName doit être >= $min");
    }

    if ($max !== null && $intValue > $max) {
        throw new InvalidArgumentException("$fieldName doit être <= $max");
    }

    return $intValue;
}

/**
 * Valide une date au format YYYY-MM-DD
 * @param string $date Date à valider
 * @param string $fieldName Nom du champ
 * @return string Date validée
 * @throws InvalidArgumentException Si la date est invalide
 */
function validateDate(string $date, string $fieldName = 'Date'): string
{
    $date = trim($date);

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        throw new InvalidArgumentException("$fieldName doit être au format YYYY-MM-DD");
    }

    $parts = explode('-', $date);
    if (!checkdate((int)$parts[1], (int)$parts[2], (int)$parts[0])) {
        throw new InvalidArgumentException("$fieldName invalide");
    }

    return $date;
}

/**
 * Valide un mot de passe
 * @param string $password Mot de passe à valider
 * @param int $minLength Longueur minimale (défaut: 8)
 * @return string Mot de passe validé
 * @throws InvalidArgumentException Si le mot de passe est invalide
 */
function validatePassword(string $password, int $minLength = 8): string
{
    if (strlen($password) < $minLength) {
        throw new InvalidArgumentException("Le mot de passe doit contenir au moins $minLength caractères");
    }

    return $password;
}

/**
 * Nettoie une valeur pour l'affichage HTML (protection XSS)
 * @param string $value Valeur à nettoyer
 * @return string Valeur nettoyée
 */
function sanitizeHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Valide un enum (valeur parmi une liste)
 * @param mixed $value Valeur à valider
 * @param array $allowedValues Valeurs autorisées
 * @param string $fieldName Nom du champ
 * @return mixed Valeur validée
 * @throws InvalidArgumentException Si la valeur n'est pas dans la liste
 */
function validateEnum($value, array $allowedValues, string $fieldName = 'Valeur')
{
    if (!in_array($value, $allowedValues, true)) {
        throw new InvalidArgumentException("$fieldName invalide. Valeurs autorisées: " . implode(', ', $allowedValues));
    }

    return $value;
}

/**
 * Valide un booléen
 * @param mixed $value Valeur à valider
 * @return bool Valeur booléenne
 */
function validateBoolean($value): bool
{
    return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
}
