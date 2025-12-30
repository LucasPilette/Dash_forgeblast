/**
 * Module API - Gestion des appels API sécurisés via proxy
 */

import { CONFIG, ERRORS } from './constants.js';

/**
 * Classe pour gérer les erreurs API
 */
export class ApiError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Effectue une requête API sécurisée via le proxy
 * @param {string} endpoint - Endpoint de l'API (ex: 'users/list')
 * @param {Object} options - Options fetch
 * @returns {Promise<any>} Données de la réponse
 */
export async function apiRequest(endpoint, options = {}) {
    const { method = 'GET', params = {}, body = null, timeout = CONFIG.API_LIMITS.timeout } = options;
    
    // Construire l'URL du proxy
    let url = `${CONFIG.API_URL}?endpoint=${encodeURIComponent(endpoint)}`;
    
    // Ajouter les paramètres de query pour GET
    if (method === 'GET' && Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url += `&${queryString}`;
    }
    
    // Configuration de la requête
    const fetchOptions = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Inclure les cookies de session
    };
    
    // Ajouter le body pour POST/PATCH/PUT
    if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
        fetchOptions.body = JSON.stringify(body);
    }
    
    // Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;
    
    try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        // Gérer les codes d'erreur HTTP
        if (!response.ok) {
            let errorMessage = ERRORS.SERVER_ERROR;
            let errorDetails = null;
            
            try {
                errorDetails = await response.json();
                errorMessage = errorDetails.error || errorMessage;
            } catch (e) {
                // Réponse non-JSON
            }
            
            switch (response.status) {
                case 401:
                    errorMessage = ERRORS.UNAUTHORIZED;
                    // Rediriger vers login
                    window.location.href = '/forgeblast/view/login.php';
                    break;
                case 404:
                    errorMessage = ERRORS.NOT_FOUND;
                    break;
                case 403:
                    errorMessage = ERRORS.UNAUTHORIZED;
                    break;
                case 502:
                case 503:
                    errorMessage = ERRORS.NETWORK;
                    break;
            }
            
            throw new ApiError(errorMessage, response.status, errorDetails);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new ApiError(ERRORS.TIMEOUT, 408);
        }
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        // Erreur réseau
        console.error('API request failed:', error);
        throw new ApiError(ERRORS.NETWORK, 0, error.message);
    }
}

/**
 * Récupère la liste des utilisateurs
 * @param {number} page - Numéro de page
 * @param {number} limit - Limite par page
 * @returns {Promise<Object>} Données utilisateurs
 */
export async function fetchUsers(page = 1, limit = 500) {
    try {
        const data = await apiRequest('users/list', {
            method: 'GET',
            params: { page, limit }
        });
        
        return {
            users: data.items || data.users || [],
            total: data.total || 0,
            page: data.page || page,
            limit: data.limit || limit
        };
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
    }
}

/**
 * Récupère un utilisateur par ID
 * @param {number|string} id - ID de l'utilisateur
 * @returns {Promise<Object>} Données utilisateur
 */
export async function fetchUser(id) {
    try {
        const data = await apiRequest('users/get', {
            method: 'GET',
            params: { id }
        });
        
        return data.item || data.user || data;
    } catch (error) {
        console.error(`Failed to fetch user ${id}:`, error);
        throw error;
    }
}

/**
 * Récupère les statistiques de revenus
 * @param {string} period - Période (1m, 3m, 6m, 1y)
 * @returns {Promise<Object>} Statistiques de revenus
 */
export async function fetchRevenueStats(period = '1m') {
    try {
        const data = await apiRequest('revenue/stats', {
            method: 'GET',
            params: { period }
        });
        
        return data;
    } catch (error) {
        console.error('Failed to fetch revenue stats:', error);
        throw error;
    }
}

/**
 * Affiche un message d'erreur à l'utilisateur
 * @param {string} message - Message d'erreur
 * @param {string} containerId - ID du conteneur pour le message
 */
export function showErrorMessage(message, containerId = 'error-container') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-error">
                <span class="alert-icon">⚠️</span>
                <span>${message}</span>
            </div>
        `;
        container.style.display = 'block';
        
        // Auto-masquer après 5 secondes
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    } else {
        // Fallback: alert
        alert(message);
    }
}

/**
 * Affiche un message de succès
 * @param {string} message - Message de succès
 * @param {string} containerId - ID du conteneur
 */
export function showSuccessMessage(message, containerId = 'success-container') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-success">
                <span class="alert-icon">✓</span>
                <span>${message}</span>
            </div>
        `;
        container.style.display = 'block';
        
        setTimeout(() => {
            container.style.display = 'none';
        }, 3000);
    }
}
