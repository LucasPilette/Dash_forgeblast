/**
 * Module Utils - Fonctions utilitaires générales
 */

/**
 * Normalise une chaîne pour la recherche (retire accents, minuscules)
 * @param {string} str - Chaîne à normaliser
 * @returns {string} Chaîne normalisée
 */
export function normalizeString(str) {
    return (str || '')
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

/**
 * Formate une date au format local
 * @param {string|Date} date - Date à formater
 * @param {Object} options - Options de formatage
 * @returns {string} Date formatée
 */
export function formatDate(date, options = {}) {
    const {
        locale = 'fr-FR',
        dateStyle = 'medium'
    } = options;
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d)) return '';
        
        return d.toLocaleDateString(locale, { dateStyle });
    } catch (e) {
        console.error('Invalid date format:', date);
        return '';
    }
}

/**
 * Formate un nombre avec séparateurs
 * @param {number} value - Nombre à formater
 * @param {Object} options - Options
 * @returns {string} Nombre formaté
 */
export function formatNumber(value, options = {}) {
    const {
        locale = 'fr-FR',
        minimumFractionDigits = 0,
        maximumFractionDigits = 2
    } = options;
    
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits
    }).format(value);
}

/**
 * Formate une devise
 * @param {number} value - Montant
 * @param {string} currency - Code devise (EUR, USD, etc.)
 * @returns {string} Montant formaté
 */
export function formatCurrency(value, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(value);
}

/**
 * Debounce une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction debouncée
 */
export function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle une fonction
 * @param {Function} func - Fonction à throttler
 * @param {number} limit - Limite en ms
 * @returns {Function} Fonction throttlée
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Sélecteur DOM simplifié avec gestion d'erreur
 * @param {string} selector - Sélecteur CSS
 * @param {HTMLElement} parent - Élément parent (défaut: document)
 * @returns {HTMLElement|null} Élément trouvé ou null
 */
export function $(selector, parent = document) {
    try {
        return parent.querySelector(selector);
    } catch (e) {
        console.error(`Invalid selector: ${selector}`, e);
        return null;
    }
}

/**
 * Sélecteur DOM multiple
 * @param {string} selector - Sélecteur CSS
 * @param {HTMLElement} parent - Élément parent
 * @returns {Array<HTMLElement>} Tableau d'éléments
 */
export function $$(selector, parent = document) {
    try {
        return Array.from(parent.querySelectorAll(selector));
    } catch (e) {
        console.error(`Invalid selector: ${selector}`, e);
        return [];
    }
}

/**
 * Vérifie si un élément est visible dans le viewport
 * @param {HTMLElement} element - Élément à vérifier
 * @returns {boolean} True si visible
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Copie du texte dans le presse-papier
 * @param {string} text - Texte à copier
 * @returns {Promise<boolean>} True si succès
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        // Fallback pour navigateurs anciens
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (e) {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

/**
 * Crée un élément HTML depuis une chaîne
 * @param {string} html - HTML à parser
 * @returns {HTMLElement} Élément créé
 */
export function createElementFromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

/**
 * Vérifie si une valeur est un booléen vrai
 * @param {any} value - Valeur à vérifier
 * @returns {boolean} True si la valeur est vraie
 */
export function isTrue(value) {
    const v = String(value).trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'oui';
}

/**
 * Génère un ID unique
 * @returns {string} ID unique
 */
export function generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Affiche un loader
 * @param {HTMLElement} container - Conteneur
 * @param {string} message - Message optionnel
 */
export function showLoader(container, message = 'Chargement...') {
    if (!container) return;
    
    container.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Masque un loader
 * @param {HTMLElement} container - Conteneur
 */
export function hideLoader(container) {
    if (!container) return;
    
    const loader = container.querySelector('.loader-container');
    if (loader) {
        loader.remove();
    }
}

/**
 * Scroll smooth vers un élément
 * @param {HTMLElement|string} target - Élément ou sélecteur
 * @param {Object} options - Options de scroll
 */
export function scrollTo(target, options = {}) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;
    
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
    });
}

/**
 * Vérifie si on est sur mobile
 * @returns {boolean} True si mobile
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Exporte des données en CSV
 * @param {Array<Object>} data - Données à exporter
 * @param {string} filename - Nom du fichier
 */
export function exportToCSV(data, filename = 'export.csv') {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }
    
    // Extraire les en-têtes
    const headers = Object.keys(data[0]);
    
    // Créer le CSV
    const csv = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Échapper les guillemets et entourer de guillemets si nécessaire
                return typeof value === 'string' && value.includes(',') 
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
            }).join(',')
        )
    ].join('\n');
    
    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
