/**
 * Module Charts - Fonctions de gestion et rendu des graphiques
 */

import { CONFIG } from './constants.js';

/**
 * Utilitaires de dates
 */
export class DateUtils {
    /**
     * Récupère la date de début selon la période
     * @param {string} period - Période (1d, 7d, 1m, etc.)
     * @returns {Date} Date de début
     */
    static getStartDateFromPeriod(period) {
        const now = new Date();
        const start = new Date(now);
        
        switch (period) {
            case '1d':
                start.setDate(now.getDate() - 1);
                break;
            case '7d':
                start.setDate(now.getDate() - 7);
                break;
            case '1m':
                start.setMonth(now.getMonth() - 1);
                break;
            case '3m':
                start.setMonth(now.getMonth() - 2);
                start.setDate(1);
                break;
            case '6m':
                start.setMonth(now.getMonth() - 5);
                start.setDate(1);
                break;
            case '1y':
                start.setFullYear(now.getFullYear() - 1);
                start.setDate(1);
                break;
            default:
                return null;
        }
        
        return start;
    }
    
    /**
     * Génère un tableau de dates entre deux dates
     * @param {Date} start - Date de début
     * @param {Date} end - Date de fin
     * @returns {string[]} Tableau de dates au format YYYY-MM-DD
     */
    static generateDateRange(start, end) {
        const dates = [];
        const current = new Date(start);
        
        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        
        return dates;
    }
    
    /**
     * Génère un tableau de mois entre deux dates
     * @param {Date} start - Date de début
     * @param {Date} end - Date de fin
     * @returns {string[]} Tableau de mois au format YYYY-MM
     */
    static generateMonthRange(start, end) {
        const result = [];
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        
        while (current <= end) {
            result.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
            current.setMonth(current.getMonth() + 1);
        }
        
        return result;
    }
}

/**
 * Classe pour gérer les transformations de données
 */
export class DataTransformer {
    /**
     * Groupe les données par jour
     * @param {Array} data - Données à grouper
     * @returns {Object} Données groupées par date
     */
    static groupByDay(data) {
        const grouped = {};
        
        data.forEach(({ date, ios = 0, android = 0 }) => {
            if (!date) return;
            const key = String(date).slice(0, 10);
            
            if (!grouped[key]) {
                grouped[key] = { date: key, ios: 0, android: 0 };
            }
            
            grouped[key].ios += Number(ios || 0);
            grouped[key].android += Number(android || 0);
        });
        
        return grouped;
    }
    
    /**
     * Groupe les données par mois
     * @param {Array} data - Données à grouper
     * @returns {Object} Données groupées par mois
     */
    static groupByMonth(data) {
        const grouped = {};
        
        data.forEach(({ date, ios, android }) => {
            const d = new Date(date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            
            if (!grouped[key]) {
                grouped[key] = { date: key, ios: 0, android: 0 };
            }
            
            grouped[key].ios += ios;
            grouped[key].android += android;
        });
        
        return grouped;
    }
    
    /**
     * Remplit les dates manquantes avec des valeurs à zéro
     * @param {Object} grouped - Données groupées
     * @param {string[]} range - Plage de dates
     * @returns {Array} Données complètes
     */
    static fillMissingDates(grouped, range) {
        return range.map(date => grouped[date] || { date, ios: 0, android: 0 });
    }
    
    /**
     * Calcule les valeurs cumulatives
     * @param {Array} data - Données à cumuler
     * @returns {Array} Données cumulées
     */
    static computeCumulative(data) {
        let ios = 0, android = 0;
        
        return data.map((item) => {
            ios += (Number(item.ios) || 0);
            android += (Number(item.android) || 0);
            
            return {
                date: item.date,
                ios: ios,
                android: android,
            };
        });
    }
    
    /**
     * Calcule les revenus cumulatifs
     * @param {Array} data - Données de revenus
     * @returns {Array} Revenus cumulés
     */
    static computeRevenueCumulative(data) {
        let monthly = 0, yearly = 0, total = 0;
        
        return data.map((item) => ({
            date: item.date,
            monthly: (monthly += item.monthly),
            yearly: (yearly += item.yearly),
            total: (total += item.total),
        }));
    }
}

/**
 * Classe pour créer et gérer les graphiques
 */
export class ChartRenderer {
    /**
     * Crée un graphique en ligne
     * @param {HTMLCanvasElement} canvas - Canvas où dessiner
     * @param {Array} data - Données à afficher
     * @param {Object} options - Options du graphique
     * @returns {Chart} Instance Chart.js
     */
    static createLineChart(canvas, data, options = {}) {
        const {
            title = 'Graphique',
            datasets = [],
            isCumulative = false
        } = options;
        
        const ctx = canvas.getContext('2d');
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: isCumulative ? 'Total cumulé' : 'Nombre'
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
    
    /**
     * Crée un graphique utilisateurs iOS/Android
     * @param {HTMLCanvasElement} canvas - Canvas
     * @param {Array} data - Données
     * @param {boolean} isCumulative - Mode cumulatif
     * @param {string} period - Période
     * @returns {Chart} Instance Chart.js
     */
    static createUserChart(canvas, data, isCumulative, period) {
        const prepared = isCumulative ? DataTransformer.computeCumulative(data) : data;
        const periodLabel = CONFIG.PERIODS[period] || 'période inconnue';
        const baseTitle = isCumulative 
            ? 'Utilisateurs iOS / Android cumulés'
            : 'Utilisateurs iOS / Android';
        
        const datasets = [
            {
                label: 'iOS',
                data: prepared.map(d => d.ios),
                borderColor: CONFIG.COLORS.iOS,
                backgroundColor: CONFIG.COLORS.iOSLight,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Android',
                data: prepared.map(d => d.android),
                borderColor: CONFIG.COLORS.android,
                backgroundColor: CONFIG.COLORS.androidLight,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Total',
                data: prepared.map(d => d.ios + d.android),
                borderColor: CONFIG.COLORS.total,
                backgroundColor: CONFIG.COLORS.totalLight,
                fill: false,
                borderDash: [5, 5],
                tension: 0.4
            }
        ];
        
        return ChartRenderer.createLineChart(canvas, prepared, {
            title: `${baseTitle} (${periodLabel})`,
            datasets,
            isCumulative
        });
    }
    
    /**
     * Crée un graphique en camembert (pie chart)
     * @param {HTMLCanvasElement} canvas - Canvas
     * @param {Object} data - Données {labels: [], values: []}
     * @param {Object} options - Options
     * @returns {Chart} Instance Chart.js
     */
    static createPieChart(canvas, data, options = {}) {
        const {
            title = 'Répartition',
            colors = [CONFIG.COLORS.premium, CONFIG.COLORS.free]
        } = options;
        
        const ctx = canvas.getContext('2d');
        
        const chartConfig = {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        position: 'bottom'
                    },
                    datalabels: {
                        color: '#111',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value) => value
                    }
                }
            }
        };
        
        // Ajouter le plugin DataLabels si disponible
        if (window.ChartDataLabels) {
            chartConfig.plugins = [ChartDataLabels];
        }
        
        return new Chart(ctx, chartConfig);
    }
}

/**
 * Titre dynamique pour graphique utilisateurs
 * @param {boolean} isCumulative - Mode cumulatif
 * @param {string} period - Période
 * @returns {string} Titre formaté
 */
export function getDynamicTitle(isCumulative, period) {
    const periodLabel = CONFIG.PERIODS[period] || 'période inconnue';
    const base = isCumulative
        ? 'Utilisateurs iOS / Android cumulés'
        : 'Utilisateurs iOS / Android';
    return `${base} (${periodLabel})`;
}

/**
 * Titre dynamique pour graphique de revenus
 * @param {boolean} isCumulative - Mode cumulatif
 * @param {string} period - Période
 * @returns {string} Titre formaté
 */
export function getRevenueDynamicTitle(isCumulative, period) {
    const periodLabel = CONFIG.PERIODS[period] || 'période inconnue';
    const base = isCumulative ? 'Revenus cumulés' : 'Revenus';
    return `${base} (${periodLabel})`;
}
