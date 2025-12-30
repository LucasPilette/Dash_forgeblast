<?php

/**
 * Error Handler Global
 * Gère les erreurs et exceptions de manière centralisée
 */

// Mode production/développement
define('ERROR_DISPLAY', false); // false en production, true en dev

/**
 * Gestionnaire d'erreurs personnalisé
 */
function customErrorHandler($errno, $errstr, $errfile, $errline)
{
    // Ne pas gérer les erreurs supprimées par @
    if (!(error_reporting() & $errno)) {
        return false;
    }

    $errorType = match ($errno) {
        E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR => 'ERREUR',
        E_WARNING, E_CORE_WARNING, E_COMPILE_WARNING, E_USER_WARNING => 'ATTENTION',
        E_NOTICE, E_USER_NOTICE => 'NOTICE',
        E_DEPRECATED, E_USER_DEPRECATED => 'DEPRECATED',
        default => 'ERREUR INCONNUE'
    };

    // Log l'erreur
    $logMessage = sprintf(
        "[%s] %s: %s dans %s ligne %d",
        date('Y-m-d H:i:s'),
        $errorType,
        $errstr,
        $errfile,
        $errline
    );
    error_log($logMessage);

    // En production, ne pas afficher les détails
    if (!ERROR_DISPLAY && !headers_sent()) {
        http_response_code(500);
        if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Une erreur est survenue']);
        } else {
            echo "Une erreur est survenue. Veuillez réessayer plus tard.";
        }
        exit;
    }

    return true;
}

/**
 * Gestionnaire d'exceptions non capturées
 */
function customExceptionHandler($exception)
{
    $logMessage = sprintf(
        "[%s] EXCEPTION: %s dans %s ligne %d\nTrace: %s",
        date('Y-m-d H:i:s'),
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine(),
        $exception->getTraceAsString()
    );
    error_log($logMessage);

    if (!headers_sent()) {
        http_response_code(500);
        if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Une erreur est survenue']);
        } else {
            echo "Une erreur est survenue. Veuillez réessayer plus tard.";
        }
    }
    exit;
}

/**
 * Gestionnaire d'erreurs fatales
 */
function checkForFatal()
{
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        $logMessage = sprintf(
            "[%s] ERREUR FATALE: %s dans %s ligne %d",
            date('Y-m-d H:i:s'),
            $error['message'],
            $error['file'],
            $error['line']
        );
        error_log($logMessage);

        if (!headers_sent()) {
            http_response_code(500);
            echo "Une erreur critique est survenue.";
        }
    }
}

// Configurer les handlers
set_error_handler('customErrorHandler');
set_exception_handler('customExceptionHandler');
register_shutdown_function('checkForFatal');

// Configuration des erreurs
if (ERROR_DISPLAY) {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(E_ALL);
}
