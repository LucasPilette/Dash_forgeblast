// TEST DATABASE

fetch("../config/config.php")
    .then((response) => response.json()) // on convertit la réponse en JSON
    .then((users) => {
        users.forEach((user) => {
            if (user.name) {
                console.log(user.name);
            }
        }); // ici tu vois le résultat dans la console Chrome
    })
    .catch((error) => {
        console.error("Erreur lors du fetch :", error);
    });

// ==========================
// CONFIGURATION & VARIABLES
// ==========================
let fullData = [];
let usersData = [];
let currentInterval = "1y";
let isCumulative = true;
let billingChart = null;
let isBillingMode = false;
let chart = null;
let revenueChart = null;
let isRevenueCumulative = true; // Ajoute cette variable
let revenueRawData = []; // Stocke les données brutes

// ==========================
// FONCTIONS UTILITAIRES
// ==========================

function computeCumulative(data) {
    let ios = 0,
        android = 0;
    return data.map((item) => ({
        date: item.date,
        ios: (ios += item.ios),
        android: (android += item.android),
    }));
}

function computeRevenueCumulative(data) {
    let monthly = 0,
        yearly = 0,
        total = 0;
    return data.map((item) => ({
        date: item.date,
        monthly: (monthly += item.monthly),
        yearly: (yearly += item.yearly),
        total: (total += item.total),
    }));
}

function getDynamicTitle() {
    const labels = {
        "1d": "aujourd’hui",
        "7d": "7 derniers jours",
        "1m": "dernier mois",
        "3m": "3 derniers mois",
        "6m": "6 derniers mois",
        "1y": "depuis 1 an",
    };
    const base = isCumulative
        ? "Utilisateurs iOS / Android cumulés"
        : "Utilisateurs iOS / Android";
    return `${base} (${labels[currentInterval] || "période inconnue"})`;
}

function getRevenueDynamicTitle() {
    const labels = {
        "1d": "aujourd’hui",
        "7d": "7 derniers jours",
        "1m": "dernier mois",
        "3m": "3 derniers mois",
        "6m": "6 derniers mois",
        "1y": "depuis 1 an",
    };
    const base = isRevenueCumulative ? "Revenus cumulés " : "Revenus ";
    return `${base} (${labels[currentInterval] || "période inconnue"})`;
}

function getStartDateFromPeriod(value) {
    const now = new Date();
    const start = new Date(now);
    switch (value) {
        case "1d":
            start.setDate(now.getDate() - 1);
            break;
        case "7d":
            start.setDate(now.getDate() - 7);
            break;
        case "1m":
            start.setMonth(now.getMonth() - 1);
            break;
        case "3m":
            start.setMonth(now.getMonth() - 2);
            start.setDate(1);
            break;
        case "6m":
            start.setMonth(now.getMonth() - 5);
            start.setDate(1);
            break;
        case "1y":
            start.setFullYear(now.getFullYear() - 1);
            start.setDate(1);
            break;
        default:
            return null;
    }
    return start;
}

function generateDateRange(start, end) {
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
        dates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

function fillMissingDates(data, range) {
    const map = Object.fromEntries(data.map((d) => [d.date, d]));
    return range.map((date) => map[date] || { date, ios: 0, android: 0 });
}

function groupDataByMonth(data) {
    const grouped = {};
    data.forEach(({ date, ios, android }) => {
        const d = new Date(date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
        )}`;
        grouped[key] = grouped[key] || { date: key, ios: 0, android: 0 };
        grouped[key].ios += ios;
        grouped[key].android += android;
    });
    return grouped;
}

function generateMonthRange(start, end) {
    const result = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
        result.push(
            `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
                2,
                "0"
            )}`
        );
        current.setMonth(current.getMonth() + 1);
    }
    return result;
}

function fillMissingMonths(grouped, range) {
    return range.map(
        (month) => grouped[month] || { date: month, ios: 0, android: 0 }
    );
}

function filterDataByPeriod(period) {
    const start = getStartDateFromPeriod(period);
    const end = new Date();
    const filtered = fullData.filter(({ date }) => {
        const d = new Date(date);
        return d >= start && d <= end;
    });
    if (["1d", "7d", "1m"].includes(period)) {
        return fillMissingDates(filtered, generateDateRange(start, end));
    } else {
        return fillMissingMonths(
            groupDataByMonth(filtered),
            generateMonthRange(start, end)
        );
    }
}

function filterRevenueByPeriod(data, period) {
    const start = getStartDateFromPeriod(period);
    const end = new Date();
    return data.filter(({ billing_date }) => {
        const d = new Date(billing_date);
        return d >= start && d <= end;
    });
}

// ==========================
// CHARGEMENT PRINCIPAL
// ==========================

function fetchAndInit() {
    fetch("../config/userGenerator.php")
        .then((res) => (res.ok ? res.json() : Promise.reject("Erreur fetch")))
        .then((data) => {
            usersData = data;
            prepareUserChart();
            document.getElementById("toggleCumulative").textContent =
                isCumulative
                    ? "Désactiver le mode cumulatif"
                    : "Activer le mode cumulatif";
            document.getElementById("periodSelect").value = "1y";
            renderPremiumChart(usersData);
            updateUserCounters(usersData);
            initUserTable(usersData);
        })
        .catch((err) => console.error(err));
}

function fetchAndInitRevenue() {
    fetch("../config/salesGenerator.php")
        .then((res) =>
            res.ok ? res.json() : Promise.reject("Erreur fetch revenus")
        )
        .then((data) => {
            revenueRawData = data; // Stocke les données une fois
            prepareRevenueChart(revenueRawData);
        })
        .catch((err) => console.error(err));
}

// ==========================
// CHART UTILISATEURS
// ==========================

function prepareUserChart() {
    const dateMap = {};
    usersData.forEach(({ join_date, os }) => {
        if (!dateMap[join_date])
            dateMap[join_date] = { date: join_date, ios: 0, android: 0 };
        if (os === "ios") dateMap[join_date].ios++;
        if (os === "android") dateMap[join_date].android++;
    });
    fullData = Object.values(dateMap).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );
    renderChart(filterDataByPeriod(currentInterval));
}

function renderChart(data) {
    const ctx = document.getElementById("userChart")?.getContext("2d");
    if (!ctx) return;
    if (chart) chart.destroy();
    const prepared = isCumulative ? computeCumulative(data) : data;

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: prepared.map((d) => d.date),
            datasets: [
                {
                    label: "iOS",
                    data: prepared.map((d) => d.ios),
                    borderColor: "#f39321",
                    backgroundColor: "rgba(243,147,33,0.2)",
                    fill: true,
                },
                {
                    label: "Android",
                    data: prepared.map((d) => d.android),
                    borderColor: "#d87b0c",
                    backgroundColor: "rgba(216,123,12,0.2)",
                    fill: true,
                },
                {
                    label: "Total",
                    data: prepared.map((d) => d.ios + d.android),
                    borderColor: "#000000",
                    fill: false,
                    pointRadius: 3,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: getDynamicTitle() } },
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Utilisateurs" },
                },
            },
        },
    });
}

// ==========================
// CHART PREMIUM
// ==========================

function renderPremiumChart(data) {
    const canvas = document.getElementById("premiumChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (billingChart) billingChart.destroy();

    let labels, chartData;
    if (isBillingMode) {
        const filtered = data.filter((u) => u.premium === "yes");
        const monthly = filtered.filter((u) => u.billing === "monthly").length;
        const yearly = filtered.filter((u) => u.billing === "yearly").length;
        labels = ["Mensuel", "Annuel"];
        chartData = [monthly, yearly];
    } else {
        const yes = data.filter((u) => u.premium === "yes").length;
        const no = data.filter((u) => u.premium === "no").length;
        labels = ["Premium", "Gratuit"];
        chartData = [yes, no];
    }

    billingChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [
                { data: chartData, backgroundColor: ["#f39321", "#cccccc"] },
            ],
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: isBillingMode
                        ? "Répartition Mensuel vs Annuel"
                        : "Premium vs Gratuit",
                },
                legend: { position: "bottom" },
            },
        },
    });
}

// ==========================
// TABLEAU UTILISATEURS
// ==========================

function initUserTable(data) {
    const searchInput = document.getElementById("userSearchInput");
    const tbody = document.querySelector(".userRow");
    const paginationContainer =
        document.querySelector(".recentUsersList .pagination-controls") ||
        document.createElement("div");
    paginationContainer.className = "pagination-controls";
    if (!paginationContainer.parentNode)
        document
            .querySelector(".recentUsersList")
            ?.appendChild(paginationContainer);

    let currentPage = 1;
    const perPage = 15;
    let filtered = [...data];

    function getTotalPages() {
        return Math.ceil(filtered.length / perPage);
    }

    function renderPage(page) {
        tbody.innerHTML = "";
        const start = (page - 1) * perPage;
        filtered.slice(start, start + perPage).forEach((user) => {
            const tr = document.createElement("tr");
            if (user.premium === "yes") {
                tr.classList.add("premium");
            }
            [
                "user_name",
                "user_id",
                "blast_id",
                "email",
                "status",
                "premium",
                "billing",
            ].forEach((key) => {
                const td = document.createElement("td");
                td.textContent = user[key] || "";
                if (key === "premium" && user[key] === "yes")
                    td.classList.add("userPremium");
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    function updatePagination() {
        paginationContainer.innerHTML = `
      <button id="prevPage" ${
          currentPage === 1 ? "disabled" : ""
      }>Précédent</button>
      <span class="paginationSpan">${currentPage} / ${getTotalPages()}</span>
      <button id="nextPage" ${
          currentPage === getTotalPages() ? "disabled" : ""
      }>Suivant</button>
    `;
        document.getElementById("prevPage").onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
                updatePagination();
            }
        };
        document.getElementById("nextPage").onclick = () => {
            if (currentPage < getTotalPages()) {
                currentPage++;
                renderPage(currentPage);
                updatePagination();
            }
        };
    }

    if (searchInput) {
        // Ajout des filtres premium/free
        const filterPremium = document.getElementById("filterPremium");
        const filterFree = document.getElementById("filterFree");

        function applyFilters() {
            const query = searchInput.value.trim().toLowerCase();
            filtered = data.filter((u) => {
                // Filtre texte
                const matchesText =
                    u.user_name?.toLowerCase().includes(query) ||
                    u.blast_id?.toLowerCase().includes(query) ||
                    u.email?.toLowerCase().includes(query);

                // Filtre premium/free
                const isPremium = u.premium === "yes";
                const isFree = u.premium === "no";
                const showPremium = filterPremium?.checked;
                const showFree = filterFree?.checked;

                const matchesPremium =
                    (isPremium && showPremium) || (isFree && showFree);

                return matchesText && matchesPremium;
            });
            currentPage = 1;
            renderPage(currentPage);
            updatePagination();
        }

        searchInput.addEventListener("input", applyFilters);
        filterPremium?.addEventListener("change", applyFilters);
        filterFree?.addEventListener("change", applyFilters);
        applyFilters();
    } else {
        renderPage(currentPage);
        updatePagination();
    }
}

// ==========================
// COMPTEURS / STATS
// ==========================

function updateUserCounters(users) {
    const now = new Date();

    // Périodes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // Nouveaux utilisateurs sur les 30 derniers jours
    const count30 = users.filter((user) => {
        const date = new Date(user.join_date);
        return date >= thirtyDaysAgo && date <= now;
    }).length;

    // Nouveaux utilisateurs entre -60 et -30 jours
    const countPrevious30 = users.filter((user) => {
        const date = new Date(user.join_date);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    }).length;

    //  Total utilisateurs
    const countAll = users.length;

    // Variation sur 30 jours glissants
    let trendVariation = 0;
    if (countPrevious30 === 0) {
        trendVariation = count30 > 0 ? 100 : 0;
    } else {
        trendVariation = (
            ((count30 - countPrevious30) / countPrevious30) *
            100
        ).toFixed(1);
    }

    // Variation mensuelle (déjà existante)
    const stats = getUserStatsByMonth(users);

    // Mise à jour du DOM
    document.getElementById("userCount").textContent = countAll;
    document.getElementById("newUsersCount").textContent = count30;

    const growthBadge = document.getElementById("userGrowthBadge");
    growthBadge.textContent = `${stats.variation > 0 ? "+" : ""}${
        stats.variation
    }%`;
    growthBadge.className = `badge ${
        stats.variation > 0
            ? "badge-positive"
            : stats.variation < 0
            ? "badge-negative"
            : "badge-neutral"
    }`;

    // Badge de tendance glissante 30 jours
    const trendBadge = document.getElementById("userGrowthTrendBadge");
    if (trendBadge) {
        trendBadge.textContent = `${
            trendVariation > 0 ? "+" : ""
        }${trendVariation}%`;
        trendBadge.classList.remove(
            "badge-positive",
            "badge-negative",
            "badge-neutral"
        );
        trendBadge.classList.add(
            trendVariation > 0
                ? "badge-positive"
                : trendVariation < 0
                ? "badge-negative"
                : "badge-neutral"
        );
    }

    const tooltip = document.getElementById("userGrowthTrendTooltip");
    if (tooltip) {
        tooltip.textContent = `One month prior : ${countPrevious30} users${
            countPrevious30 !== 1 ? "s" : ""
        }`;
    }
    const userGrowthTooltip = document.getElementById("userGrowthTooltip");
    if (userGrowthTooltip) {
        const diff = stats.currentCount - stats.previousCount;
        const variationText = `${diff > 0 ? "+" : ""}${diff} user${
            Math.abs(diff) !== 1 ? "s" : ""
        }`;
        userGrowthTooltip.textContent = `Last month : ${variationText}`;
    }
}

function getUserStatsByMonth(users) {
    const now = new Date();
    const thisMonth = now.getMonth(),
        thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let nowCount = 0,
        beforeCount = 0;
    users.forEach(({ join_date }) => {
        const [y, m] = join_date.split("-").map(Number);
        if (y < thisYear || (y === thisYear && m - 1 <= thisMonth)) nowCount++;
        if (y < lastYear || (y === lastYear && m - 1 <= lastMonth))
            beforeCount++;
    });

    const variation =
        beforeCount === 0
            ? nowCount > 0
                ? 100
                : 0
            : (((nowCount - beforeCount) / beforeCount) * 100).toFixed(1);
    return {
        currentCount: nowCount,
        previousCount: beforeCount,
        variation: parseFloat(variation),
    };
}

// ==========================
// LISTENERS
// ==========================

document.getElementById("toggleCumulative")?.addEventListener("click", () => {
    isCumulative = !isCumulative;
    document.getElementById("toggleCumulative").textContent = isCumulative
        ? "Désactiver le mode cumulatif"
        : "Activer le mode cumulatif";
    renderChart(filterDataByPeriod(currentInterval));
});

document.getElementById("toggleBillingMode")?.addEventListener("click", () => {
    isBillingMode = !isBillingMode;
    document.getElementById("toggleBillingMode").textContent = isBillingMode
        ? "Afficher Premium vs Gratuit"
        : "Afficher par facturation (premium)";
    renderPremiumChart(usersData);
});

document.getElementById("periodSelect")?.addEventListener("change", (e) => {
    currentInterval = e.target.value;
    renderChart(filterDataByPeriod(currentInterval));
});

function fetchAndInitSquads() {
    fetch("../config/squadGenerator.php")
        .then((res) =>
            res.ok ? res.json() : Promise.reject("Erreur chargement Squads")
        )
        .then((squadData) => {
            initSquadTable(squadData);
        })
        .catch((err) => console.error("Erreur squadGenerator:", err));
}

function initSquadTable(squads) {
    const searchInput = document.getElementById("squadSearchInput");
    const squadRows = document.querySelector(".squadRow");
    const paginationContainer =
        document.querySelector(".squadTableContainer .pagination-controls") ||
        document.createElement("div");
    paginationContainer.className = "pagination-controls";
    if (!paginationContainer.parentNode) {
        document
            .querySelector(".squadTableContainer")
            ?.appendChild(paginationContainer);
    }

    let currentPage = 1;
    const perPage = 10;
    let filtered = [...squads];

    function getTotalPages() {
        return Math.ceil(filtered.length / perPage);
    }

    function renderSquadTable(page) {
        squadRows.innerHTML = "";
        const start = (page - 1) * perPage;
        const pageData = filtered.slice(start, start + perPage);

        pageData.forEach((squad) => {
            const tr = document.createElement("tr");
            const fields = [
                "squad_name",
                "squad_id",
                "game",
                "leader",
                "members",
                "created_date",
                "status",
            ];
            fields.forEach((key) => {
                const td = document.createElement("td");
                td.textContent = squad[key] || "";
                tr.appendChild(td);
            });
            squadRows.appendChild(tr);
        });
    }

    function updatePagination() {
        paginationContainer.innerHTML = `
      <button id="prevPageSquad" ${
          currentPage === 1 ? "disabled" : ""
      }>Précédent</button>
      <span class="paginationSpan">${currentPage} / ${getTotalPages()}</span>
      <button id="nextPageSquad" ${
          currentPage === getTotalPages() ? "disabled" : ""
      }>Suivant</button>
    `;
        document.getElementById("prevPageSquad").onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderSquadTable(currentPage);
                updatePagination();
            }
        };
        document.getElementById("nextPageSquad").onclick = () => {
            if (currentPage < getTotalPages()) {
                currentPage++;
                renderSquadTable(currentPage);
                updatePagination();
            }
        };
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            filtered = squads.filter(
                (squad) =>
                    (squad.squad_name &&
                        squad.squad_name.toLowerCase().includes(query)) ||
                    (squad.squad_id &&
                        squad.squad_id.toLowerCase().includes(query)) ||
                    (squad.game && squad.game.toLowerCase().includes(query)) ||
                    (squad.leader && squad.leader.toLowerCase().includes(query))
            );
            currentPage = 1;
            renderSquadTable(currentPage);
            updatePagination();
        });
    }

    renderSquadTable(currentPage);
    updatePagination();
}

// ==========================
// LANCEMENT
// ==========================
fetchAndInit();
fetchAndInitSquads();

if (document.getElementById("revenueChart")) {
    fetchAndInitRevenue();
    document.getElementById("periodSelect")?.addEventListener("change", (e) => {
        currentInterval = e.target.value;
        fetchAndInitRevenue();
    });
}

function prepareRevenueChart(revenueData) {
    // Regroupe par date (jour/mois/année selon la période)
    const start = getStartDateFromPeriod(currentInterval);
    const end = new Date();
    let grouped = {};

    if (["1d", "7d", "1m"].includes(currentInterval)) {
        // Par jour
        revenueData.forEach(({ billing_date, billing_type, amount }) => {
            if (!grouped[billing_date]) {
                grouped[billing_date] = {
                    date: billing_date,
                    monthly: 0,
                    yearly: 0,
                    total: 0,
                };
            }
            grouped[billing_date][billing_type] += amount;
            grouped[billing_date].total += amount;
        });
        // Remplir les dates manquantes
        const range = generateDateRange(start, end);
        var chartData = range.map(
            (date) => grouped[date] || { date, monthly: 0, yearly: 0, total: 0 }
        );
    } else {
        // Par mois
        revenueData.forEach(({ billing_date, billing_type, amount }) => {
            const d = new Date(billing_date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
                2,
                "0"
            )}`;
            if (!grouped[key]) {
                grouped[key] = { date: key, monthly: 0, yearly: 0, total: 0 };
            }
            grouped[key][billing_type] += amount;
            grouped[key].total += amount;
        });
        const range = generateMonthRange(start, end);
        var chartData = range.map(
            (month) =>
                grouped[month] || {
                    date: month,
                    monthly: 0,
                    yearly: 0,
                    total: 0,
                }
        );
    }

    // Ajoute le cumulatif si activé
    const preparedData = isRevenueCumulative
        ? computeRevenueCumulative(chartData)
        : chartData;

    renderRevenueChart(preparedData);
}

function renderRevenueChart(data) {
    const ctx = document.getElementById("revenueChart")?.getContext("2d");
    if (!ctx) return;
    if (revenueChart) revenueChart.destroy();

    revenueChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map((d) => d.date),
            datasets: [
                {
                    label: "Mensuel",
                    data: data.map((d) => d.monthly),
                    borderColor: "#f39321",
                    backgroundColor: "rgba(243,147,33,0.2)",
                    fill: true,
                },
                {
                    label: "Annuel",
                    data: data.map((d) => d.yearly),
                    borderColor: "#d87b0c",
                    backgroundColor: "rgba(216,123,12,0.2)",
                    fill: true,
                },
                {
                    label: "Total",
                    data: data.map((d) => d.total),
                    borderColor: "#000000",
                    fill: false,
                    pointRadius: 3,
                    datalabels: {
                        align: "top",
                        anchor: "end",
                        formatter: function (value) {
                            return value.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                            });
                        },
                        color: "#000",
                        font: { weight: "bold" },
                    },
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: getRevenueDynamicTitle() },
                datalabels: {
                    display: function (context) {
                        // Affiche seulement pour la série "Total"
                        if (context.dataset.label !== "Total") return false;
                        const index = context.dataIndex;
                        const value = context.dataset.data[index];
                        // Affiche si premier point ou valeur différente du précédent
                        if (index === 0) return true;
                        const prevValue = context.dataset.data[index - 1];
                        return value !== prevValue;
                    },
                },
            },
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Montant (€)" },
                },
            },
        },
        plugins: [ChartDataLabels],
    });
}

document.getElementById("toggleCumulative")?.addEventListener("click", () => {
    isRevenueCumulative = !isRevenueCumulative;
    document.getElementById("toggleCumulative").textContent =
        isRevenueCumulative
            ? "Désactiver le mode cumulatif"
            : "Activer le mode cumulatif";
    prepareRevenueChart(revenueRawData); // Utilise les données déjà chargées
});

if (document.getElementById("premiumChart") && document.getElementById("revenueChart")) {
    let isBillingModeSales = false;

    function renderPremiumChartSales(data) {
        const canvas = document.getElementById("premiumChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (billingChart) billingChart.destroy();

        let labels, chartData, chartTitle;
        if (isBillingModeSales) {
            // Répartition en nombre de billing
            const monthlyCount = data.filter((u) => u.billing_type === "monthly").length;
            const yearlyCount = data.filter((u) => u.billing_type === "yearly").length;
            labels = ["Mensuel", "Annuel"];
            chartData = [monthlyCount, yearlyCount];
            chartTitle = "Répartition des facturations (nombre)";
        } else {
            // Répartition des revenus en euros
            const monthlyRevenue = data
                .filter((u) => u.billing_type === "monthly")
                .reduce((sum, u) => sum + (parseFloat(u.amount) || 0), 0);
            const yearlyRevenue = data
                .filter((u) => u.billing_type === "yearly")
                .reduce((sum, u) => sum + (parseFloat(u.amount) || 0), 0);
            labels = ["Mensuel (€)", "Annuel (€)"];
            chartData = [monthlyRevenue, yearlyRevenue];
            chartTitle = "Répartition des revenus (€)";
        }

        billingChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [
                    { data: chartData, backgroundColor: ["#f39321", "#d87b0c"] },
                ],
            },
            options: {
                plugins: {
                    title: { display: true, text: chartTitle },
                    legend: { position: "bottom" },
                    datalabels: {
                        formatter: function(value, context) {
                            if (!isBillingModeSales) {
                                return value.toLocaleString("fr-FR", {
                                    style: "currency",
                                    currency: "EUR",
                                    minimumFractionDigits: 2,
                                });
                            }
                            return value;
                        },
                        color: "#000",
                        font: { weight: "bold" },
                    },
                },
            },
            plugins: [ChartDataLabels],
        });
    }

    // Un seul fetch pour les deux graphiques
    fetch("../config/salesGenerator.php")
        .then((res) => res.ok ? res.json() : Promise.reject("Erreur fetch revenus"))
        .then((data) => {
            revenueRawData = data;
            prepareRevenueChart(revenueRawData); // graphique principal
            renderPremiumChartSales(filterRevenueByPeriod(revenueRawData, currentInterval)); // graphique premium filtré
        })
        .catch((err) => console.error(err));

    document.getElementById("toggleBillingMode")?.addEventListener("click", () => {
        isBillingModeSales = !isBillingModeSales;
        document.getElementById("toggleBillingMode").textContent = isBillingModeSales
            ? "Afficher la répartition des revenus (€)"
            : "Afficher la répartition en nombre";
        renderPremiumChartSales(filterRevenueByPeriod(revenueRawData, currentInterval));
    });

    document.getElementById("periodSelect")?.addEventListener("change", (e) => {
        currentInterval = e.target.value;
        prepareRevenueChart(revenueRawData);
        renderPremiumChartSales(filterRevenueByPeriod(revenueRawData, currentInterval));
    });
}
