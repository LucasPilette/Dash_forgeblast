/**
 * Exemple d'utilisation des nouveaux modules
 * Ce fichier montre comment refactorer votre code existant pour utiliser les modules
 */

// ============================================
// IMPORTS DES MODULES
// ============================================
import { CONFIG, ERRORS } from './modules/constants.js';
import { fetchUsers, ApiError, showErrorMessage, showSuccessMessage } from './modules/api.js';
import { ChartRenderer, DataTransformer, DateUtils } from './modules/charts.js';
import { formatDate, formatCurrency, formatNumber, debounce, $, $$ } from './modules/utils.js';

// ============================================
// VARIABLES GLOBALES
// ============================================
let currentInterval = "1m";
let isCumulative = false;
let chart = null;
let fullData = [];
let preparedData = [];
let usersData = [];

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initialisation du dashboard...');
    
    // Initialiser les filtres et la pagination
    initUserFilters();
    setupUserPagination();
    
    // Charger les données
    await fetchAndInit();
    
    // Initialiser les event listeners
    initEventListeners();
});

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================
async function fetchAndInit() {
    try {
        // 1) Essayer de récupérer depuis window.usersData (injecté par PHP)
        if (Array.isArray(window.usersData) && window.usersData.length) {
            usersData = normalizeUsersData(window.usersData);
        } 
        // 2) Sinon récupérer depuis le DOM
        else {
            usersData = collectUsersFromDom();
        }
        
        // 3) Fallback API via le proxy sécurisé si toujours vide
        if (!usersData.length) {
            const data = await fetchUsers(1, 500);
            usersData = normalizeUsersData(data.users);
        }
        
        // 4) Préparer et afficher les graphiques
        prepareUserChart();
        renderPremiumChart();
        updateUserCounters(usersData);
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        if (error instanceof ApiError) {
            showErrorMessage(error.message);
        } else {
            showErrorMessage(ERRORS.NETWORK);
        }
    }
}

// ============================================
// NORMALISATION DES DONNÉES
// ============================================
function normalizeUsersData(users) {
    return users.map(u => ({
        createdAt: u.createdAt || u.created_at || '',
        os: (u.platform || '').toLowerCase(),
        premium: !!u.premium
    }));
}

function collectUsersFromDom() {
    const rows = $$('tbody.userRow tr[data-created]');
    return rows.map(tr => ({
        createdAt: tr.getAttribute('data-created') || '',
        os: (tr.getAttribute('data-os') || '').toLowerCase(),
        premium: tr.getAttribute('data-premium') === 'true'
    }));
}

// ============================================
// GRAPHIQUES
// ============================================
function prepareUserChart() {
    // Grouper les données par date
    const dateMap = {};
    usersData.forEach(({ createdAt, os }) => {
        if (!createdAt) return;
        if (!dateMap[createdAt]) {
            dateMap[createdAt] = { date: createdAt, ios: 0, android: 0 };
        }
        if (os === 'ios') dateMap[createdAt].ios++;
        if (os === 'android') dateMap[createdAt].android++;
    });
    
    fullData = Object.values(dateMap).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Filtrer selon la période
    const start = DateUtils.getStartDateFromPeriod(currentInterval);
    const end = new Date();
    
    let prepared;
    if (['1d', '7d', '1m'].includes(currentInterval)) {
        // Granularité jour
        const grouped = DataTransformer.groupByDay(fullData);
        const range = DateUtils.generateDateRange(start, end);
        prepared = DataTransformer.fillMissingDates(grouped, range);
    } else {
        // Granularité mois
        const grouped = DataTransformer.groupByMonth(fullData);
        const range = DateUtils.generateMonthRange(start, end);
        prepared = DataTransformer.fillMissingDates(grouped, range);
    }
    
    preparedData = prepared;
    renderChart(preparedData);
}

function renderChart(data) {
    const canvas = $('#userChart');
    if (!canvas) return;
    
    // Détruire le graphique existant
    if (chart) {
        chart.destroy();
    }
    
    // Créer le nouveau graphique
    chart = ChartRenderer.createUserChart(
        canvas,
        data,
        isCumulative,
        currentInterval
    );
}

function renderPremiumChart() {
    const canvas = $('#premiumChart');
    if (!canvas) return;
    
    // Compter premium vs gratuit
    let premiumCount = 0;
    let totalCount = 0;
    
    const rows = $$('.recentUsersList tbody.userRow tr');
    if (rows.length) {
        rows.forEach(tr => {
            totalCount++;
            const premium = tr.getAttribute('data-premium')?.toLowerCase();
            if (premium === '1' || premium === 'true') {
                premiumCount++;
            }
        });
    } else {
        totalCount = usersData.length;
        premiumCount = usersData.filter(u => u.premium).length;
    }
    
    const freeCount = totalCount - premiumCount;
    
    // Créer le graphique
    ChartRenderer.createPieChart(canvas, {
        labels: ['Premium', 'Gratuit'],
        values: [premiumCount, freeCount]
    }, {
        title: 'Premium vs Gratuit',
        colors: [CONFIG.COLORS.premium, CONFIG.COLORS.free]
    });
}

// ============================================
// COMPTEURS ET STATS
// ============================================
function updateUserCounters(users) {
    const total = users.length;
    const totalElt = $('#userCount');
    if (totalElt) totalElt.textContent = formatNumber(total);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // Nouveaux utilisateurs (30 derniers jours)
    const newUsersCount = users.filter(u => {
        const d = new Date(u.createdAt);
        return d >= thirtyDaysAgo && d <= now;
    }).length;
    
    // Utilisateurs période précédente
    const prev30Count = users.filter(u => {
        const d = new Date(u.createdAt);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;
    
    // Calculer la croissance
    let growth = null;
    if (prev30Count > 0) {
        growth = ((newUsersCount - prev30Count) / prev30Count) * 100;
    } else if (newUsersCount === 0) {
        growth = 0;
    }
    
    // Afficher les compteurs
    const newUsersElt = $('#newUsersCount');
    if (newUsersElt) newUsersElt.textContent = formatNumber(newUsersCount);
    
    const growthBadge = $('#userGrowthBadge');
    if (growthBadge) {
        if (growth === null) {
            growthBadge.textContent = '—';
            growthBadge.className = 'badge badge-neutral';
        } else {
            growthBadge.textContent = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
            growthBadge.className = `badge ${
                growth > 0 ? 'badge-positive' : 
                growth < 0 ? 'badge-negative' : 
                'badge-neutral'
            }`;
        }
    }
}

// ============================================
// FILTRES ET RECHERCHE
// ============================================
function initUserFilters() {
    const input = $('#userSearch') || $('.search-input');
    const cbPremium = $('#filterPremium');
    const cbFree = $('#filterFree');
    const tbody = $('tbody.userRow');
    
    if (!tbody) return;
    
    const rows = $$('tr', tbody);
    
    // Fonction de filtrage avec debounce
    const applyFilter = debounce(() => {
        const query = input?.value || '';
        const wantPremium = cbPremium?.checked ?? true;
        const wantFree = cbFree?.checked ?? true;
        
        rows.forEach(tr => {
            const isPremium = tr.getAttribute('data-premium') === 'true';
            const tierOK = (isPremium && wantPremium) || (!isPremium && wantFree);
            const text = tr.getAttribute('data-search') || '';
            const textOK = text.toLowerCase().includes(query.toLowerCase());
            
            tr.dataset.filtered = (tierOK && textOK) ? '1' : '0';
        });
        
        // Notifier la pagination
        document.dispatchEvent(new Event('users-table-updated'));
    }, 300);
    
    // Event listeners
    if (input) input.addEventListener('input', applyFilter);
    if (cbPremium) cbPremium.addEventListener('change', applyFilter);
    if (cbFree) cbFree.addEventListener('change', applyFilter);
    
    // Initialiser
    applyFilter();
}

// ============================================
// PAGINATION
// ============================================
function setupUserPagination() {
    const tbody = $('tbody.userRow');
    const pagContainer = $('.user-pagination');
    
    if (!tbody || !pagContainer) return;
    
    let allRows = $$('tr[data-search]', tbody);
    let currentPage = 1;
    const perPage = CONFIG.PAGINATION.usersPerPage;
    
    function renderUserPage(page) {
        const filtered = allRows.filter(tr => tr.dataset.filtered !== '0');
        allRows.forEach(tr => tr.style.display = 'none');
        
        const start = (page - 1) * perPage;
        filtered.slice(start, start + perPage).forEach(tr => {
            tr.style.display = '';
        });
    }
    
    function updateUserPagination() {
        const filtered = allRows.filter(tr => tr.dataset.filtered !== '0');
        const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
        
        pagContainer.innerHTML = `
            <button id="userPrevPage" ${currentPage === 1 ? 'disabled' : ''}>
                Précédent
            </button>
            <span class="paginationSpan">${currentPage} / ${totalPages}</span>
            <button id="userNextPage" ${currentPage === totalPages ? 'disabled' : ''}>
                Suivant
            </button>
        `;
        
        $('#userPrevPage')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderUserPage(currentPage);
                updateUserPagination();
            }
        });
        
        $('#userNextPage')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderUserPage(currentPage);
                updateUserPagination();
            }
        });
    }
    
    // Réagir aux changements de filtres
    document.addEventListener('users-table-updated', () => {
        allRows = $$('tr[data-search]', tbody);
        currentPage = 1;
        renderUserPage(currentPage);
        updateUserPagination();
    });
    
    // Initialiser
    allRows.forEach(tr => tr.dataset.filtered = '1');
    renderUserPage(currentPage);
    updateUserPagination();
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
    // Sélecteur de période
    const periodSelector = $('#periodSelect');
    if (periodSelector) {
        periodSelector.addEventListener('change', (e) => {
            currentInterval = e.target.value;
            prepareUserChart();
        });
    }
    
    // Toggle cumulatif
    const cumulativeToggle = $('#cumulativeToggle');
    if (cumulativeToggle) {
        cumulativeToggle.addEventListener('change', (e) => {
            isCumulative = e.target.checked;
            renderChart(preparedData);
        });
    }
    
    // Export CSV
    const exportBtn = $('#exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToCSV(usersData, 'users_export.csv');
            showSuccessMessage('Export réussi !');
        });
    }
}

// ============================================
// EXPORTS (si nécessaire pour d'autres scripts)
// ============================================
export {
    fetchAndInit,
    updateUserCounters,
    renderChart,
    initUserFilters,
    setupUserPagination
};
