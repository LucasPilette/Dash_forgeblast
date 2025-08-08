// TEST DATABASE
fetch("http://localhost:3100/users/list?page=1&limit=50", {
  headers: {
    "x-api-key": "fb_sk_live_3b7f29e1c4e14a509a8f4f97ae6aaf6b"
  }
})
  .then((res) => res.json())
  .then((data) => {
    console.log(data);
  });

// N'effectuer le fetch RevenueCat que si on est sur la page sales (présence de l'élément)
if (document.getElementById("revenueLast30Days")) {
  fetch("http://localhost:4000/api/revenuecat/metrics/overview")
    .then(res => res.json())
    .then(data => {
      // Cherche le metric "revenue" sur 28 jours
      const revenueMetric = Array.isArray(data.metrics)
        ? data.metrics.find(m => m.id === "revenue" && m.period === "P28D")
        : null;

      if (revenueMetric) {
        document.getElementById("revenueLast30Days").textContent =
          revenueMetric.value + " " + (revenueMetric.unit || "€");
      } else {
        document.getElementById("revenueLast30Days").textContent =
          "Donnée non disponible";
      }
    })
    .catch(() => {
      document.getElementById("revenueLast30Days").textContent =
        "Erreur lors du chargement";
    });
}

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
  fetch("http://localhost:3100/users/list?page=1&limit=100", {
    headers: {
      "x-api-key": "fb_sk_live_3b7f29e1c4e14a509a8f4f97ae6aaf6b"
    }
  })
    .then((res) => (res.ok ? res.json() : Promise.reject("Erreur fetch")))
    .then((data) => {
      // data.users ou data selon ta réponse API
      console.log("Réponse API /users/list :", data);
      const rawUsers =
        Array.isArray(data.users)
          ? data.users
          : Array.isArray(data.users?.users)
          ? data.users.users
          : data.data || [];

      if (!Array.isArray(rawUsers)) {
        console.error("Erreur : la donnée users n'est pas un tableau", rawUsers, data);
        return;
      }

      // Transforme chaque user pour matcher le format attendu par le front
      usersData = rawUsers.map((u) => ({
        user_name: u.name || "",
        user_id: u.id,
        blast_id: u.blastId,
        email: u.email,
        status: u.active ? "actif" : "inactif",
        premium: u.premium ? "yes" : "no",
        billing:
          u.premium === true
            ? u.paidFeature === true
              ? "monthly"
              : "yearly"
            : "free",
        join_date: u.createdAt ? u.createdAt.split("T")[0] : "",
        os: u.platform || "",
        createdAt: u.createdAt ? u.createdAt.split("T")[0] : "",
      }));

      prepareUserChart();
      const toggleCumulativeBtn = document.getElementById("toggleCumulative");
      if (toggleCumulativeBtn) {
        toggleCumulativeBtn.textContent = isCumulative
          ? "Désactiver le mode cumulatif"
          : "Activer le mode cumulatif";
      }
      const periodSelect = document.getElementById("periodSelect");
      if (periodSelect) {
        periodSelect.value = "1y";
      }
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
  usersData.forEach(({ createdAt, os }) => {
    if (!dateMap[createdAt])
      dateMap[createdAt] = { date: createdAt, ios: 0, android: 0 };
    if (os === "ios") dateMap[createdAt].ios++;
    if (os === "android") dateMap[createdAt].android++;
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
      datasets: [{ data: chartData, backgroundColor: ["#f39321", "#cccccc"] }],
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
  if (!tbody) return; // Protection : n'exécute rien si pas sur la page concernée

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
      // Ajoute l'écouteur de clic ici :
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        window.location.href = `user_controller.php?id=${encodeURIComponent(user.user_id)}`;
      });

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
  const userCount = document.getElementById("userCount");
  if (userCount) userCount.textContent = countAll;

  const newUsersCount = document.getElementById("newUsersCount");
  if (newUsersCount) newUsersCount.textContent = count30;

  const growthBadge = document.getElementById("userGrowthBadge");
  if (growthBadge) {
    growthBadge.textContent = `${stats.variation > 0 ? "+" : ""}${stats.variation}%`;
    growthBadge.className = `badge ${
      stats.variation > 0
        ? "badge-positive"
        : stats.variation < 0
        ? "badge-negative"
        : "badge-neutral"
    }`;
  }

  const trendBadge = document.getElementById("userGrowthTrendBadge");
  if (trendBadge) {
    trendBadge.textContent = `${trendVariation > 0 ? "+" : ""}${trendVariation}%`;
    trendBadge.classList.remove("badge-positive", "badge-negative", "badge-neutral");
    trendBadge.classList.add(
      trendVariation > 0
        ? "badge-positive"
        : trendVariation < 0
        ? "badge-negative"
        : "badge-neutral"
    );
  } else {
    // Protection contre l'erreur : l'élément n'existe pas
    console.warn("userGrowthTrendBadge introuvable dans le DOM");
  }

  const tooltip = document.getElementById("userGrowthTrendTooltip");
  if (tooltip) {
    tooltip.textContent = `One month prior : ${countPrevious30} users${countPrevious30 !== 1 ? "s" : ""}`;
  }
  const userGrowthTooltip = document.getElementById("userGrowthTooltip");
  if (userGrowthTooltip) {
    const diff = stats.currentCount - stats.previousCount;
    const variationText = `${diff > 0 ? "+" : ""}${diff} user${Math.abs(diff) !== 1 ? "s" : ""}`;
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
    if (y < lastYear || (y === lastYear && m - 1 <= lastMonth)) beforeCount++;
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

// Pour la page home
const premiumChartHome = document.getElementById("premiumChartHome");
const toggleBillingModeHome = document.getElementById("toggleBillingModeHome");

// Pour la page sales
const premiumChartSales = document.getElementById("premiumChartSales");
const toggleBillingModeSales = document.getElementById("toggleBillingModeSales");

function fetchAndInitSquads() {
  fetch("http://localhost:3100/squads/list?page=1&limit=100", {
    headers: {
      "x-api-key": "fb_sk_live_3b7f29e1c4e14a509a8f4f97ae6aaf6b"
    }
  })
    .then((res) =>
      res.ok ? res.json() : Promise.reject("Erreur chargement Squads")
    )
    .then((data) => {
      const squadsRaw = Array.isArray(data) ? data : data.squads;
      // Mapping des champs
      const squads = squadsRaw.map((s) => ({
        squad_name: s.name,
        squad_id: s.id,
        game: s.gameId, // ou adapte si tu veux le nom du jeu
        leader: s.leaderId, // ou adapte si tu veux le nom du leader
        members: s.limit, // ou un autre champ si tu as le nombre réel de membres
        created_date: s.createdAt ? s.createdAt.split("T")[0] : "",
        status: s.active ? "actif" : "inactif",
      }));
      initSquadTable(squads);
    })
    .catch((err) => console.error("Erreur API squads:", err));
}

function initSquadTable(squads) {
  const searchInput = document.getElementById("squadSearchInput");
  const squadRows = document.querySelector(".squadRow");
  if (!squadRows) return; // Protection : n'exécute rien si pas sur la page concernée

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
      squadRows.appendChild(tr); // <-- AJOUTE CETTE LIGNE
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
          (squad.squad_id && squad.squad_id.toLowerCase().includes(query)) ||
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
  document.getElementById("toggleCumulative").textContent = isRevenueCumulative
    ? "Désactiver le mode cumulatif"
    : "Activer le mode cumulatif";
  prepareRevenueChart(revenueRawData); // Utilise les données déjà chargées
});

// HOME : graphique premium
if (document.getElementById("premiumChartHome")) {
  let isBillingModeHome = false;

  function renderPremiumChartHome(data) {
    const canvas = document.getElementById("premiumChartHome");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (billingChart) billingChart.destroy();

    let labels, chartData;
    if (isBillingModeHome) {
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
        datasets: [{ data: chartData, backgroundColor: ["#f39321", "#cccccc"] }],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: isBillingModeHome
              ? "Répartition Mensuel vs Annuel"
              : "Premium vs Gratuit",
          },
          legend: { position: "bottom" },
        },
      },
    });
  }

  // Initialisation au chargement
  renderPremiumChartHome(usersData);

  document.getElementById("toggleBillingModeHome")?.addEventListener("click", () => {
    isBillingModeHome = !isBillingModeHome;
    document.getElementById("toggleBillingModeHome").textContent = isBillingModeHome
      ? "Afficher Premium vs Gratuit"
      : "Afficher par facturation (premium)";
    renderPremiumChartHome(usersData);
  });
}

// SALES : graphique premium
if (document.getElementById("premiumChartSales")) {
  let isBillingModeSales = false;

  function renderPremiumChartSales(data) {
    const canvas = document.getElementById("premiumChartSales");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (billingChart) billingChart.destroy();

    let labels, chartData, chartTitle;
    if (isBillingModeSales) {
      const monthlyCount = data.filter((u) => u.billing_type === "monthly").length;
      const yearlyCount = data.filter((u) => u.billing_type === "yearly").length;
      labels = ["Mensuel", "Annuel"];
      chartData = [monthlyCount, yearlyCount];
      chartTitle = "Répartition des facturations (nombre)";
    } else {
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
        datasets: [{ data: chartData, backgroundColor: ["#f39321", "#d87b0c"] }],
      },
      options: {
        plugins: {
          title: { display: true, text: chartTitle },
          legend: { position: "bottom" },
        },
      },
    });
  }

  // Initialisation au chargement
  fetch("../config/salesGenerator.php")
    .then((res) => res.ok ? res.json() : Promise.reject("Erreur fetch revenus"))
    .then((data) => {
      revenueRawData = data;
      renderPremiumChartSales(filterRevenueByPeriod(revenueRawData, currentInterval));
    })
    .catch((err) => console.error(err));

  document.getElementById("toggleBillingModeSales")?.addEventListener("click", () => {
    isBillingModeSales = !isBillingModeSales;
    document.getElementById("toggleBillingModeSales").textContent = isBillingModeSales
      ? "Afficher la répartition des revenus (€)"
      : "Afficher la répartition en nombre";
    renderPremiumChartSales(filterRevenueByPeriod(revenueRawData, currentInterval));
  });

  document.getElementById("periodSelect")?.addEventListener("change", (e) => {
    currentInterval = e.target.value;
    renderPremiumChartSales(filterRevenueByPeriod(revenueRawData, currentInterval));
  });
}
