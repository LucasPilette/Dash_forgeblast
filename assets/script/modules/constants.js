/**
 * Configuration et constantes globales
 */

export const CONFIG = {
    // URLs API (sera remplacé par le proxy sécurisé)
    API_URL: '/forgeblast/controller/api_proxy.php',
    API_FALLBACK: 'http://localhost:3100', // Uniquement pour dev local
    
    // Couleurs des graphiques
    COLORS: {
        iOS: '#f39321',
        iOSLight: 'rgba(243,147,33,0.2)',
        android: '#d87b0c',
        androidLight: 'rgba(216,123,12,0.2)',
        total: '#000000',
        totalLight: 'rgba(0,0,0,0.1)',
        premium: '#f39321',
        free: '#cccccc',
        monthly: '#f39321',
        yearly: '#d87b0c',
        revenueTotal: '#000000',
    },
    
    // Périodes disponibles
    PERIODS: {
        '1d': "aujourd'hui",
        '7d': '7 derniers jours',
        '1m': 'dernier mois',
        '3m': '3 derniers mois',
        '6m': '6 derniers mois',
        '1y': 'depuis 1 an'
    },
    
    // Pagination
    PAGINATION: {
        usersPerPage: 15,
        squadsPerPage: 20
    },
    
    // Limites API
    API_LIMITS: {
        maxUsers: 500,
        timeout: 30000 // 30 secondes
    }
};

/**
 * Messages d'erreur standardisés
 */
export const ERRORS = {
    NETWORK: 'Erreur de connexion au serveur',
    API_KEY: 'Clé API invalide ou manquante',
    NOT_FOUND: 'Ressource introuvable',
    UNAUTHORIZED: 'Non autorisé',
    SERVER_ERROR: 'Erreur serveur, veuillez réessayer',
    VALIDATION: 'Données invalides',
    TIMEOUT: 'Délai d\'attente dépassé'
};

/**
 * États de l'application
 */
export const STATES = {
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    IDLE: 'idle'
};
