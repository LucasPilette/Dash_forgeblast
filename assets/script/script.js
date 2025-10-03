
// ==========================
// CONFIGURATION & VARIABLES (unique)
// ==========================
let currentInterval = "1m";
let isCumulative = true;
let chart = null;
let fullData = [];         // registrations grouped by date
let usersData = [];        // normalized users array for counters/charts

// Revenue (only used on sales page if elements exist)
let billingChart = null;
let isBillingMode = false;
let revenueChart = null;
let isRevenueCumulative = true;
let revenueRawData = [];

// ==========================
// UTILITAIRES DATES & AGRÉGATION (unique)
// ==========================
function computeCumulative(data) {
  let ios = 0, android = 0;
  return data.map((item) => ({
    date: item.date,
    ios: (ios += item.ios),
    android: (android += item.android),
  }));
}

function computeRevenueCumulative(data) {
  let monthly = 0, yearly = 0, total = 0;
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
    case "1d": start.setDate(now.getDate() - 1); break;
    case "7d": start.setDate(now.getDate() - 7); break;
    case "1m": start.setMonth(now.getMonth() - 1); break;
    case "3m": start.setMonth(now.getMonth() - 2); start.setDate(1); break;
    case "6m": start.setMonth(now.getMonth() - 5); start.setDate(1); break;
    case "1y": start.setFullYear(now.getFullYear() - 1); start.setDate(1); break;
    default: return null;
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
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
    result.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
    current.setMonth(current.getMonth() + 1);
  }
  return result;
}

function fillMissingMonths(grouped, range) {
  return range.map((month) => grouped[month] || { date: month, ios: 0, android: 0 });
}

// Group data by day (YYYY-MM-DD) -> { date, ios, android }
function groupDataByDay(data) {
  const grouped = {};
  data.forEach(({ date, ios = 0, android = 0 }) => {
    if (!date) return;
    const key = String(date).slice(0, 10);
    if (!grouped[key]) grouped[key] = { date: key, ios: 0, android: 0 };
    grouped[key].ios += Number(ios || 0);
    grouped[key].android += Number(android || 0);
  });
  return grouped;
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
    return fillMissingMonths(groupDataByMonth(filtered), generateMonthRange(start, end));
  }
}

// ==========================
// PAGINATION USERS + RECHERCHE/FILTRES (unique)
// ==========================
function setupUserPagination() {
  const userTbody = document.querySelector("tbody.userRow");
  const pagContainer = document.querySelector(".user-pagination");
  if (!userTbody || !pagContainer) return;

  let allRows = Array.from(userTbody.querySelectorAll("tr[data-search]"));
  let currentPage = 1;
  const perPage = 15;

  function renderUserPage(page) {
    const filtered = allRows.filter(tr => tr.dataset.filtered !== "0");
    allRows.forEach(tr => tr.style.display = "none");
    const start = (page - 1) * perPage;
    filtered.slice(start, start + perPage).forEach(tr => tr.style.display = "");
  }

  function updateUserPagination() {
    const filtered = allRows.filter(tr => tr.dataset.filtered !== "0");
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    pagContainer.innerHTML = `
      <button id="userPrevPage" ${currentPage === 1 ? "disabled" : ""}>Précédent</button>
      <span class="paginationSpan">${currentPage} / ${totalPages}</span>
      <button id="userNextPage" ${currentPage === totalPages ? "disabled" : ""}>Suivant</button>
    `;
    document.getElementById("userPrevPage")?.addEventListener("click", () => {
      if (currentPage > 1) { currentPage--; renderUserPage(currentPage); updateUserPagination(); }
    });
    document.getElementById("userNextPage")?.addEventListener("click", () => {
      const max = Math.max(1, Math.ceil(filtered.length / perPage));
      if (currentPage < max) { currentPage++; renderUserPage(currentPage); updateUserPagination(); }
    });
  }

  document.addEventListener('users-table-updated', () => {
    allRows = Array.from(userTbody.querySelectorAll("tr[data-search]"));
    currentPage = 1;
    renderUserPage(currentPage);
    updateUserPagination();
  });

  // init
  allRows.forEach(tr => tr.dataset.filtered = "1");
  renderUserPage(currentPage);
  updateUserPagination();
}

// Recherche + filtres qui posent uniquement data-filtered puis notifient la pagination
function initUserFilters() {
  const $ = (s) => document.querySelector(s);
  const input =
    $("#userSearch") || $(".search-input") || $("#search") || $("#searchInput") ||
    document.querySelector('input[type="search"]');
  const cbPremium = $("#filterPremium") || $("#filter-premium") || $("#chkPremium");
  const cbFree = $("#filterFree") || $("#filter-free") || $("#chkFree");
  const tbody = $("#usersTbody") || document.querySelector("tbody.userRow") || document.querySelector("#usersTable tbody");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));

  const norm = (s) => (s || "").toString().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const rowIsPremium = (tr) => {
    const v = (tr.dataset.premium || "").trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "oui";
  };

  function applyFilter() {
    const q = norm(input?.value || "");
    const wantPremium = cbPremium ? cbPremium.checked : true;
    const wantFree = cbFree ? cbFree.checked : true;

    rows.forEach((tr) => {
      const isPremium = rowIsPremium(tr);
      const tierOK = (isPremium && wantPremium) || (!isPremium && wantFree);
      const hay = tr.getAttribute("data-search") || "";
      const textOK = norm(hay).includes(q);
      tr.dataset.filtered = (tierOK && textOK) ? "1" : "0";
    });
    document.dispatchEvent(new Event("users-table-updated"));
  }

  if (input) input.addEventListener("input", applyFilter);
  if (cbPremium) cbPremium.addEventListener("change", applyFilter);
  if (cbFree) cbFree.addEventListener("change", applyFilter);

  applyFilter(); // init
}

// ==========================
// EXTRA : recherche SQUADS simple (si présent sur la page)
// ==========================
function initSquadSearch() {
  const squadSearch = document.getElementById("squadSearchInput");
  const squadTbody = document.querySelector("tbody.squadRow");
  if (!squadSearch || !squadTbody) return;
  squadSearch.addEventListener("input", () => {
    const q = squadSearch.value.trim().toLowerCase();
    Array.from(squadTbody.querySelectorAll("tr")).forEach(tr => {
      const hay = tr.getAttribute("data-search") || "";
      tr.style.display = hay.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

// ==========================
// COMPTEURS / STATS (unique)
// ==========================
function updateUserCounters(users) {
  // Total users
  const total = users.length;
  const totalElt = document.getElementById('userCount');
  if (totalElt) totalElt.textContent = total;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo  = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Counts over sliding windows: last 30 days vs previous 30 days
  const newUsersCount = users.filter(u => {
    const d = new Date(u.created_at || u.createdAt);
    return d >= thirtyDaysAgo && d <= now;
  }).length;

  const prev30Count = users.filter(u => {
    const d = new Date(u.created_at || u.createdAt);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  }).length;

  // Growth: percentage change between the two 30-day windows.
  // If prev30Count === 0 we display '—' to avoid misleading huge percentages.
  let growth = null;
  if (prev30Count > 0) {
    growth = ((newUsersCount - prev30Count) / prev30Count) * 100;
  } else if (newUsersCount === 0) {
    growth = 0; // no change
  }

  const growthBadge = document.getElementById('userGrowthBadge');
  if (growthBadge) {
    if (growth === null) {
      growthBadge.textContent = '—';
      growthBadge.className = 'badge badge-neutral';
    } else {
      growthBadge.textContent = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
      growthBadge.className = 'badge ' + (growth > 0 ? 'badge-positive' : growth < 0 ? 'badge-negative' : 'badge-neutral');
    }
  }
  const newUsersElt = document.getElementById('newUsersCount');
  if (newUsersElt) newUsersElt.textContent = newUsersCount;

  // For trend badge use the same sliding-window logic
  let trendVariation = null;
  if (prev30Count > 0) trendVariation = ((newUsersCount - prev30Count) / prev30Count) * 100;
  else if (newUsersCount === 0) trendVariation = 0;

  const trendBadge = document.getElementById('userGrowthTrendBadge');
  if (trendBadge) {
    if (trendVariation === null) {
      trendBadge.textContent = '—';
      trendBadge.className = 'badge badge-neutral';
    } else {
      trendBadge.textContent = `${trendVariation >= 0 ? '+' : ''}${trendVariation.toFixed(1)}%`;
      trendBadge.className = 'badge ' + (trendVariation > 0 ? 'badge-positive' : trendVariation < 0 ? 'badge-negative' : 'badge-neutral');
    }
  }
}

// ==========================
// DONNÉES UTILISATEURS (unique)
// ==========================
function collectUsersFromDom() {
  const rows = document.querySelectorAll('tbody.userRow tr[data-created]');
  const users = [];
  rows.forEach((tr) => {
    const createdAt = tr.getAttribute('data-created') || ''; // "YYYY-MM-DD"
    const os = (tr.getAttribute('data-os') || '').toLowerCase(); // ios / android
    const premium = tr.getAttribute('data-premium') === 'true';
    users.push({ createdAt, os, premium });
  });
  return users;
}

async function fetchAndInit() {
  // 1) Données injectées par PHP
  if (Array.isArray(window.usersData) && window.usersData.length) {
    usersData = window.usersData.map(u => ({
      createdAt: u.createdAt || u.created_at || '',
      os: (u.platform || '').toLowerCase(),
      premium: !!u.premium
    }));
  } else {
    // 2) Sinon, DOM
    usersData = collectUsersFromDom();
  }

  // 3) Fallback API si toujours vide
  if (!usersData.length) {
    try {
      const API = "http://localhost:3100/users/list";
      const HEADERS = { method: "GET", headers: { "x-api-key": "fb_sk_live_3b7f29e1c4e14a509a8f4f97ae6aaf6b" } };
      const res = await fetch(`${API}?page=1&limit=500`, HEADERS);
      const json = await res.json();
      const list = Array.isArray(json?.users) ? json.users :
                   Array.isArray(json?.data)  ? json.data  :
                   Array.isArray(json)        ? json       : [];
      const normPlatform = (p) => (p || "").toString().trim().toLowerCase();
      const toYmd = (d) => {
        const dt = d ? new Date(d) : null;
        return dt && !isNaN(dt) ? dt.toISOString().slice(0, 10) : "";
      };
      usersData = list.map(u => ({
        createdAt: toYmd(u.createdAt),
        os: normPlatform(u.platform),
        premium: !!u.premium,
      }));
    } catch (e) {
      console.error("Fallback API users fetch failed", e);
      usersData = [];
    }
  }

  // 4) Graph + compteurs
  prepareUserChart();
  renderPremiumChart();
  updateUserCounters(usersData);
}

// ==========================
// CHART UTILISATEURS (unique)
// ==========================
function prepareUserChart() {
  // Normalize usersData into daily rows (date, ios, android)
  const dateMap = {};
  usersData.forEach(({ createdAt, os }) => {
    if (!createdAt) return;
    if (!dateMap[createdAt]) dateMap[createdAt] = { date: createdAt, ios: 0, android: 0 };
    if (os === "ios") dateMap[createdAt].ios++;
    if (os === "android") dateMap[createdAt].android++;
  });
  fullData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Prepare chart data according to currentInterval (daily granularity for short ranges)
  const start = getStartDateFromPeriod(currentInterval);
  const end = new Date();
  let prepared = [];
  // Diagnostic logging to help debug empty daily ranges
  console.debug('[prepareUserChart] currentInterval=', currentInterval, 'start=', start && start.toISOString(), 'end=', end.toISOString(), 'usersData.length=', usersData.length, 'fullData.length=', fullData.length);
  if (["1d", "7d", "1m"].includes(currentInterval)) {
    // day granularity
  const grouped = groupDataByDay(fullData);
  console.debug('[prepareUserChart] grouped daily keys sample=', Object.keys(grouped).slice(0,10));
    const range = generateDateRange(start, end);
  prepared = range.map(date => grouped[date] || { date, ios: 0, android: 0 });
  console.debug('[prepareUserChart] range length=', range.length, 'prepared sample=', prepared.slice(0,10));
  } else {
    // month granularity
    const grouped = groupDataByMonth(fullData);
    const mrange = generateMonthRange(start, end);
    prepared = mrange.map(month => grouped[month] || { date: month, ios: 0, android: 0 });
  }

  renderChart(prepared);
}

// Renders premium vs free repartition using usersData or DOM fallback
function renderPremiumChart() {
  const canvas = document.getElementById("premiumChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (billingChart) billingChart.destroy();

  // Try to read counts from the recent users table first
  let rows = Array.from(document.querySelectorAll('.recentUsersList tbody.userRow tr'));
  if (!rows.length) {
    // fallback to any tbody.userRow
    rows = Array.from(document.querySelectorAll('tbody.userRow tr'));
  }

  let premiumCount = 0;
  if (rows.length) {
    rows.forEach(tr => {
      const v = (tr.getAttribute('data-premium') || tr.dataset.premium || '').toString().trim().toLowerCase();
      if (v === '1' || v === 'true' || v === 'oui' || v === 'yes') premiumCount++;
    });
  } else if (Array.isArray(usersData) && usersData.length) {
    premiumCount = usersData.filter(u => u.premium === true || u.premium === '1' || u.premium === 1).length;
  }

  const freeCount = Math.max(0, (rows.length || usersData.length) - premiumCount);

  billingChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Premium", "Gratuit"],
      datasets: [{ data: [premiumCount, freeCount], backgroundColor: ["#f39321", "#cccccc"] }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Premium vs Gratuit" },
        legend: { position: "bottom" },
        datalabels: {
          color: '#111',
          font: { weight: 'bold', size: 12 },
          formatter: function(value, context) {
            return value;
          }
        }
      },
    },
    plugins: window.ChartDataLabels ? [ChartDataLabels] : []
  });
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
        y: { beginAtZero: true, title: { display: true, text: "Utilisateurs" } },
      },
    },
  });
}

// ==========================
// CHART PREMIUM (unique)
// ==========================
// -------- RevenueCat: mapping produits -> libellé + type + plateforme --------
function parseRevenueCatProduct(pid) {
  const s = String(pid || "");
  // Cas précis demandés
  if (s === "rc_4999_1y") return { label: "Annuel - Apple", period: "yearly", platform: "Apple" };
  if (s === "rc_499_1m" || s === "rc_4999_1m") return { label: "Mensuel - Apple", period: "monthly", platform: "Apple" };
  if (s.startsWith("rc_4999_1y:") || s.startsWith("rc-4999-1y") || s.includes(":rc-4999-1y"))
    return { label: "Annuel - Android", period: "yearly", platform: "Android" };
  if (s.startsWith("rc_499_1m:") || s.includes(":rc_499_1m"))
    return { label: "Mensuel - Android", period: "monthly", platform: "Android" };

  // Fallback générique si d’autres variantes apparaissent
  const period = /1y/i.test(s) ? "yearly" : "monthly";
  const platform = s.includes(":") ? "Android" : "Apple";
  const label = (period === "yearly" ? "Annuel" : "Mensuel") + " - " + platform;
  return { label, period, platform };
}

// ==========================
// REVENUE (unique; uniquement si éléments présents)
// ==========================
function fetchAndInitRevenue() {
  const btnCumul = document.getElementById("toggleRevenueCumulative");
  if (btnCumul) btnCumul.disabled = true;
  fetch("http://localhost:3100/admin/revenuecat/transactions?page=1&limit=500")
    .then(res => res.json())
    .then(json => {
      const items = json.items || json.transactions || json.data || [];
      revenueRawData = items.map(tx => ({
        billing_date: tx.purchasedAt ? tx.purchasedAt.split('T')[0] : '',
        billing_type: parseRevenueCatProduct(tx.productId).period,
        amount: typeof tx.priceEur === 'number' ? tx.priceEur
          : (typeof tx.price_eur === 'number' ? tx.price_eur
          : (typeof tx.price === 'number' && tx.currency === 'EUR' ? tx.price
          : (typeof tx.priceUsd === 'number' && tx.currency === 'USD' ? tx.priceUsd * 0.92 : 0)))
      }));
      prepareRevenueChart(filterRevenueByPeriod(revenueRawData, currentInterval));
      if (btnCumul) btnCumul.disabled = false;
    })
    .catch(err => {
      console.error(err);
      if (btnCumul) btnCumul.disabled = false;
    });
}

function filterRevenueByPeriod(data, period) {
  const start = getStartDateFromPeriod(period);
  const end = new Date();
  return data.filter(({ billing_date }) => {
    const d = new Date(billing_date);
    return d >= start && d <= end;
  });
}

function prepareRevenueChart(revenueData) {
  const start = getStartDateFromPeriod(currentInterval);
  const end = new Date();
  let grouped = {};

  if (["1d", "7d", "1m"].includes(currentInterval)) {
    revenueData.forEach(({ billing_date, billing_type, amount }) => {
      if (!grouped[billing_date]) grouped[billing_date] = { date: billing_date, monthly: 0, yearly: 0, total: 0 };
      grouped[billing_date][billing_type] += amount;
      grouped[billing_date].total += amount;
    });
    var chartData = generateDateRange(start, end).map((date) => grouped[date] || { date, monthly: 0, yearly: 0, total: 0 });
  } else {
    revenueData.forEach(({ billing_date, billing_type, amount }) => {
      const d = new Date(billing_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = { date: key, monthly: 0, yearly: 0, total: 0 };
      grouped[key][billing_type] += amount;
      grouped[key].total += amount;
    });
    var chartData = generateMonthRange(start, end).map((month) => grouped[month] || { date: month, monthly: 0, yearly: 0, total: 0 });
  }

  const preparedData = isRevenueCumulative ? computeRevenueCumulative(chartData) : chartData;
  renderRevenueChart(preparedData);
  // Also render revenue split pie on sales page (monthly vs yearly totals)
  renderRevenueSplitPie(preparedData);
}

function renderRevenueSplitPie(data) {
  const canvas = document.getElementById('premiumChartSales');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Prefer explicit totals from the transactions table if available
  // (#rcTxBody: the transactions listing below the chart). This avoids
  // double-summing when the chart data is cumulative.
  let monthly = 0, yearly = 0;
  const txBody = document.getElementById('rcTxBody');
  if (txBody) {
    // Try to compute totals by reading the rows: product period -> monthly/yearly
    try {
      Array.from(txBody.querySelectorAll('tr')).forEach(tr => {
        const prodCell = tr.children[2]; // product label cell as built in fetchAndRenderRcTx
        const eurCell = tr.children[5]; // computed EUR amount
        if (!prodCell) return;
        const prodText = (prodCell.textContent || '').toLowerCase();
        const amountText = eurCell ? (eurCell.textContent || '').replace(/[^0-9,\.\-]/g, '').replace(',', '.') : '';
        const amount = parseFloat(amountText);
        if (!isFinite(amount)) return;
        if (prodText.includes('mensuel')) monthly += amount;
        else if (prodText.includes('annuel')) yearly += amount;
        else {
          // fallback: if the product cell contains 'mens' or '1m' etc
          if (/1m|mensu|mens/i.test(prodText)) monthly += amount;
          else if (/1y|anne|annuel|year/i.test(prodText)) yearly += amount;
          else monthly += amount; // default to monthly when unclear
        }
      });
    } catch (e) {
      console.error('Could not compute revenue split from table', e);
      monthly = yearly = 0;
    }
  } else if (Array.isArray(data) && data.length) {
    // If chart data is cumulative, use the last point to avoid double-summing
    if (isRevenueCumulative) {
      const last = data[data.length - 1] || { monthly: 0, yearly: 0 };
      monthly = Number(last.monthly || 0);
      yearly = Number(last.yearly || 0);
    } else {
      // Non cumulative: sum values across the dataset
      const totals = data.reduce((acc, d) => {
        acc.monthly += Number(d.monthly || 0);
        acc.yearly += Number(d.yearly || 0);
        return acc;
      }, { monthly: 0, yearly: 0 });
      monthly = totals.monthly;
      yearly = totals.yearly;
    }
  }

  // destroy previous if exists
  if (window._revenueSplitChart) window._revenueSplitChart.destroy();

  window._revenueSplitChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Mensuel', 'Annuel'],
      datasets: [{ data: [monthly, yearly], backgroundColor: ['#f39321', '#d87b0c'] }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Répartition des revenus' },
        legend: { position: 'bottom' },
        datalabels: {
          color: '#111',
          font: { weight: 'bold', size: 12 },
          formatter: function(val, ctx) {
            const sum = (monthly + yearly) || 1;
            const pct = Math.round((val / sum) * 100);
            const amt = Math.round(val * 100) / 100;
            return amt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "\n(" + pct + "% )";
          }
        }
      }
    },
    plugins: window.ChartDataLabels ? [ChartDataLabels] : []
  });
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
    plugins: window.ChartDataLabels ? [ChartDataLabels] : [],
  });
}

document.getElementById("toggleCumulative")?.addEventListener("click", () => {
  isRevenueCumulative = !isRevenueCumulative;
  document.getElementById("toggleCumulative").textContent = isRevenueCumulative
    ? "Désactiver le mode cumulatif"
    : "Activer le mode cumulatif";
  prepareRevenueChart(revenueRawData); // Utilise les données déjà chargées
});

// Helper: compute sum of the EUR column from the transaction table (if present)
function computeTotalFromRcTable() {
  const tbody = document.getElementById('rcTxBody');
  if (!tbody) return null;
  let sum = 0;
  let parsed = 0, totalRows = 0, unparsed = 0;
  const problematic = [];
  Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
    totalRows++;
    const eurCell = tr.children[5]; // matches fetchAndRenderRcTx column layout
    if (!eurCell) { unparsed++; problematic.push({row: totalRows, reason: 'no eur cell'}); return; }
    const txtRaw = (eurCell.textContent || '').trim();
    const txt = txtRaw.replace(/[^0-9,\.\-]/g, '').replace(',', '.');
    const v = parseFloat(txt);
    if (Number.isFinite(v)) { sum += v; parsed++; }
    else { unparsed++; problematic.push({row: totalRows, raw: txtRaw}); }
  });
  return { sum, parsed, totalRows, unparsed, problematic };
}

if (document.getElementById("totalRevenueAllTime")) {
  fetch("http://localhost:3100/admin/revenuecat/revenue/total")
    .then(res => res.json())
    .then(data => {
      const el = document.getElementById("totalRevenueAllTime");
      let eurTotal = null;
      // Prefer explicit EUR total from the endpoint
      if (data.totalRevenueEur !== undefined) eurTotal = Number(data.totalRevenueEur);
      // Fallback: convert USD -> EUR using the page rate
      else if (data.totalRevenueUsd !== undefined) eurTotal = Number(data.totalRevenueUsd) * getUsdToEurRate();

      if (el) {
        el.textContent = (eurTotal != null && Number.isFinite(eurTotal)) ? fmtMoney(eurTotal, 'EUR') : 'Donnée non disponible';
      }

      // If transaction table exists, compute its total and log a comparison to help debug
      const tableInfo = computeTotalFromRcTable();
      if (tableInfo != null) {
        console.info('Revenue check: endpoint EUR total=', eurTotal, 'tableSum EUR=', tableInfo.sum, tableInfo);
        // show a small inline summary next to totalRevenueAllTime for quick visual comparison
        const el = document.getElementById('totalRevenueAllTime');
        if (el) {
          let infoEl = document.getElementById('totalRevenueTableInfo');
          if (!infoEl) {
            infoEl = document.createElement('div');
            infoEl.id = 'totalRevenueTableInfo';
            infoEl.style.fontSize = '0.85em';
            infoEl.style.color = '#666';
            el.parentNode && el.parentNode.insertBefore(infoEl, el.nextSibling);
          }
          infoEl.textContent = `Table: ${fmtMoney(tableInfo.sum, 'EUR')} (${tableInfo.parsed}/${tableInfo.totalRows} lignes parsées)`;
        }
      }
    })
    .catch(err => console.error('Could not fetch total revenue', err));
}

// ========= RevenueCat - Tableau des transactions =========

// Taux USD -> EUR configurable (fallback 0.92). Tu peux surcharger via data-usd-eur sur #rcTxTable.
function getUsdToEurRate() {
  const tbl = document.getElementById("rcTxTable");
  const v = tbl?.dataset?.usdEur;
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0.92;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }));
}

function fmtMoney(val, cur) {
  if (val == null || !Number.isFinite(val)) return "—";
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: cur }).format(val);
  } catch {
    return `${val.toFixed(2)} ${cur}`;
  }
}

function computeEuro(row) {
  const currency = (row.currency || "").toUpperCase();
  const price = typeof row.price === "number" ? row.price : null;
  const priceUsd = typeof row.priceUsd === "number" ? row.priceUsd : null;

  // Si déjà en EUR -> on garde le prix original
  if (currency === "EUR" && price != null) return price;

  // Sinon, on convertit depuis USD si on l’a
  if (priceUsd != null) return priceUsd * getUsdToEurRate();

  // Pas de donnée fiable
  return null;
}

async function fetchAndRenderRcTx(page = 1, limit = 50) {
  const tbody = document.getElementById("rcTxBody");
  const pag   = document.getElementById("rcTxPagination");
  if (!tbody) return;

  // NOTE: ajoute 'headers' si ton endpoint exige x-api-key.
  const res  = await fetch(`http://localhost:3100/admin/revenuecat/transactions?page=${page}&limit=${limit}`);
  const json = await res.json();
  const items = json.items || json.transactions || json.data || [];
  const total = json.total ?? items.length;

  tbody.innerHTML = "";
  items.forEach(tx => {
    const orig = (typeof tx.price === "number" && tx.currency)
      ? fmtMoney(tx.price, tx.currency)
      : (typeof tx.priceUsd === "number" ? fmtMoney(tx.priceUsd, "USD") : "—");

    const eur = computeEuro(tx);
    const eurStr = eur != null ? fmtMoney(eur, "EUR") : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(tx.appUserId)}</td>
      <td>${escapeHtml(tx.store)}</td>
      <td>${escapeHtml(parseRevenueCatProduct(tx.productId).label)}</td>
      <td>${tx.purchasedAt ? new Date(tx.purchasedAt).toLocaleString("fr-FR") : ""}</td>
      <td>${orig}</td>
      <td>${eurStr}</td>
    `;
    tbody.appendChild(tr);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / limit));
  pag.innerHTML = `
    <button ${page <= 1 ? "disabled" : ""} id="rcPrev">Précédent</button>
    <span class="paginationSpan">${page} / ${totalPages}</span>
    <button ${page >= totalPages ? "disabled" : ""} id="rcNext">Suivant</button>
  `;
  document.getElementById("rcPrev")?.addEventListener("click", () => fetchAndRenderRcTx(page - 1, limit));
  document.getElementById("rcNext")?.addEventListener("click", () => fetchAndRenderRcTx(page + 1, limit));
}

// Au chargement de la page sales
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("rcTxBody")) {
    fetchAndRenderRcTx();
  }
});

  if (document.getElementById('transactionList')) {
    fetch('http://localhost:3100/api/revenuecat/transactions')
      .then(res => res.json())
      .then(data => {
        // Remplir la liste des transactions
        const list = document.getElementById('transactionList');
        list.innerHTML = '';
        data.forEach(tx => {
          const li = document.createElement('li');
          li.textContent = `${tx.date} - ${tx.amount}€ - ${tx.type}`;
          list.appendChild(li);
        });
      });
  }
;

// ==========================
// LANCEMENT GLOBAL (unique)
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // tables
  setupUserPagination();
  initUserFilters();
  initSquadSearch();

  // data + charts
  // Initialize currentInterval from the period select if present (keeps JS in sync with UI)
  const periodSelectEl = document.getElementById("periodSelect");
  if (periodSelectEl && periodSelectEl.value) {
    currentInterval = periodSelectEl.value;
  }
  fetchAndInit();

  // events (user chart)
  document.getElementById("toggleCumulative")?.addEventListener("click", () => {
    isCumulative = !isCumulative;
    document.getElementById("toggleCumulative").textContent = isCumulative
      ? "Désactiver le mode cumulatif"
      : "Activer le mode cumulatif";
    renderChart(filterDataByPeriod(currentInterval));
  });

  document.getElementById("periodSelect")?.addEventListener("change", (e) => {
    const val = e.target.value;
    currentInterval = val;
    // Re-fetch/init to ensure usersData and diagnostics are up-to-date for the new period
    fetchAndInit();
  });

  // revenue (only if present)
  if (document.getElementById("revenueChart")) {
    fetchAndInitRevenue();
    document.getElementById("periodSelect")?.addEventListener("change", (e) => {
      currentInterval = e.target.value;
      prepareRevenueChart(filterRevenueByPeriod(revenueRawData, currentInterval));
    });
    document.getElementById('toggleRevenueCumulative')?.addEventListener('click', () => {
  isRevenueCumulative = !isRevenueCumulative;
  // recalcul + rerendu du graphe revenus
  prepareRevenueChart(filterRevenueByPeriod(revenueRawData, currentInterval));
  // maj libellé bouton
  const b = document.getElementById('toggleRevenueCumulative');
  if (b) b.textContent = isRevenueCumulative ? 'Désactiver le mode cumulatif' : 'Activer le mode cumulatif';
});
  }
});
