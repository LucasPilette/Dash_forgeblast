<?php

/**
 * Configuration de l'authentification
 * 
 * AUTHENTICATION_ENABLED :
 * - true  : Authentification active (production)
 * - false : Accès direct au dashboard (développement)
 */

define('AUTHENTICATION_ENABLED', false); // Mettre à true pour activer l'authentification

/**
 * Rôle par défaut quand l'authentification est désactivée
 */
define('DEFAULT_ROLE', 'admin');

/**
 * Email par défaut quand l'authentification est désactivée
 */
define('DEFAULT_EMAIL', 'dev@forgeblast.local');
