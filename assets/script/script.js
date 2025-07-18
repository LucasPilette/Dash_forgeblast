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

// ==========================
// CHARGEMENT PRINCIPAL
// ==========================

function fetchAndInit() {
  fetch("../config/userGenerator.php")
    .then((res) => (res.ok ? res.json() : Promise.reject("Erreur fetch")))
    .then((data) => {
      usersData = data;
      prepareUserChart();
      document.getElementById("toggleCumulative").textContent = isCumulative
        ? "Désactiver le mode cumulatif"
        : "Activer le mode cumulatif";
      document.getElementById("periodSelect").value = "1y";
      renderPremiumChart(usersData);
      updateUserCounters(usersData);
      initUserTable(usersData);
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
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      filtered = data.filter(
        (u) =>
          u.user_name?.toLowerCase().includes(query) ||
          u.blast_id?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
      currentPage = 1;
      renderPage(currentPage);
      updatePagination();
    });
  }

  renderPage(currentPage);
  updatePagination();
}

// ==========================
// COMPTEURS / STATS
// ==========================

function updateUserCounters(users) {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const count30 = users.filter((user) => {
    const date = new Date(user.join_date);
    return date >= thirtyDaysAgo && date <= now;
  }).length;
  const badge = document.getElementById("userGrowthBadge");
  const countAll = users.length;
  const stats = getUserStatsByMonth(users);

  document.getElementById("userCount").textContent = countAll;
  document.getElementById("newUsersCount").textContent = count30;
  badge.textContent = `${stats.variation > 0 ? "+" : ""}${stats.variation}%`;
  badge.className = `badge ${
    stats.variation > 0
      ? "badge-positive"
      : stats.variation < 0
      ? "badge-negative"
      : "badge-neutral"
  }`;
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
