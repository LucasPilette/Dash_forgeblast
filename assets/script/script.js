let checkPremium = document.querySelectorAll(".userPremium");

checkPremium.forEach((user) => {
  if (user) {
    if (user.textContent === "yes") {
      user.parentElement.classList.add("premium");
    }
  }
  user.classList;
});

let chart;
let fullData = [];
let currentInterval = "all";
let isCumulative = false; // mode par défaut = non cumulatif
document.getElementById("toggleCumulative").textContent =
  "Activer le mode cumulatif";

// Fonction pour calculer les données cumulatives
function computeCumulative(data) {
  let cumulativeIos = 0;
  let cumulativeAndroid = 0;

  return data.map((item) => {
    cumulativeIos += item.ios;
    cumulativeAndroid += item.android;

    return {
      date: item.date,
      ios: cumulativeIos,
      android: cumulativeAndroid,
    };
  });
}

// Fonction pour dessiner ou mettre à jour le graphique
function renderChart(data) {
  // Trier les données chronologiquement
  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = data.map((item) => item.date); // Garder les vraies dates (ISO)

  let preparedData = [...data];

  if (isCumulative) {
    preparedData = computeCumulative(preparedData);
  }

  const iosData = preparedData.map((item) => item.ios);
  const androidData = preparedData.map((item) => item.android);
  const totalData = preparedData.map((item) => item.ios + item.android);

  const ctx = document.getElementById("userChart").getContext("2d");

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "iOS",
          data: iosData,
          borderColor: "#f39321",
          backgroundColor: "rgba(243, 147, 33, 0.2)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Android",
          data: androidData,
          borderColor: "#d87b0c",
          backgroundColor: "rgba(216, 123, 12, 0.2)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Total",
          data: totalData,
          borderColor: "#000000",
          fill: false,
          tension: 0,
          pointBackgroundColor: "#000000",
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Utilisateurs iOS / Android + Total",
        },
      },
      scales: {
        x: {
          ticks: {
            callback: function (value, index, ticks) {
              const rawDate = this.getLabelForValue(value);
              const dateObj = new Date(rawDate);
              return ["1d", "7d", "1m"].includes(currentInterval)
                ? dateObj.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                  }) // ex: 17/07
                : dateObj.toLocaleDateString("fr-FR", {
                    month: "2-digit",
                    year: "numeric",
                  }); // ex: 07/2025
            },
          },
          title: {
            display: true,
            text: ["1d", "7d", "1m"].includes(currentInterval)
              ? "Jour"
              : "Mois",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Nombre d’utilisateurs",
          },
        },
      },
    },
  });
}

// Fonction pour déterminer la date de début en fonction de la période
function getStartDateFromPeriod(value) {
  const today = new Date();
  let startDate = new Date(today);

  switch (value) {
    case "1d":
      startDate.setDate(today.getDate() - 1);
      break;
    case "7d":
      startDate.setDate(today.getDate() - 7);
      break;
    case "1m":
      startDate.setMonth(today.getMonth() - 1);
      break;
    case "3m":
      startDate.setMonth(today.getMonth() - 2); // ← seulement 2 mois en arrière pour inclure 3 mois (en cours + 2 avant)
      startDate.setDate(1);
      break;
    case "6m":
      startDate.setMonth(today.getMonth() - 5);
      startDate.setDate(1);
      break;
    case "1y":
      startDate.setFullYear(today.getFullYear() - 1);
      startDate.setMonth(today.getMonth()); // garder mois actuel l’an passé
      startDate.setDate(1);
      break;
    case "all":
    default:
      return null;
  }

  return startDate;
}

// Générer une liste de dates entre deux dates
function generateDateRange(startDate, endDate) {
  const dates = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    const iso = current.toISOString().split("T")[0]; // YYYY-MM-DD
    dates.push(iso);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Remplir les dates manquantes avec des zéros
function fillMissingDates(data, dateRange) {
  const dataMap = {};
  data.forEach((item) => (dataMap[item.date] = item));

  return dateRange.map((date) => {
    if (dataMap[date]) {
      return dataMap[date];
    } else {
      return { date: date, ios: 0, android: 0 };
    }
  });
}

// Générer une liste de mois entre deux dates
function generateMonthRange(startDate, endDate) {
  const months = [];
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (current <= endDate) {
    const key = `${current.getFullYear()}-${String(
      current.getMonth() + 1
    ).padStart(2, "0")}`; // ex: "2025-07"
    months.push(key);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

// Regrouper les données par mois
function groupDataByMonth(data) {
  const grouped = {};

  data.forEach((item) => {
    const date = new Date(item.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    if (!grouped[key]) {
      grouped[key] = { date: key, ios: 0, android: 0 };
    }

    grouped[key].ios += item.ios;
    grouped[key].android += item.android;
  });

  return grouped;
}

// Remplir les mois manquants avec des zéros
function fillMissingMonths(groupedData, monthRange) {
  const filled = [];

  monthRange.forEach((month) => {
    if (groupedData[month]) {
      filled.push(groupedData[month]);
    } else {
      filled.push({ date: month, ios: 0, android: 0 });
    }
  });

  return filled;
}

// Filtrer les données selon la période choisie
function filterDataByPeriod(periodValue) {
  const startDate = getStartDateFromPeriod(periodValue);
  if (!startDate) return fullData;

  const endDate = new Date();
  const filtered = fullData.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate && itemDate <= endDate;
  });

  if (["1d", "7d", "1m"].includes(periodValue)) {
    const dateRange = generateDateRange(startDate, endDate);
    return fillMissingDates(filtered, dateRange);
  }

  // Pour les longues périodes (regroupement par mois)
  if (["3m", "6m", "1y"].includes(periodValue)) {
    const monthRange = generateMonthRange(startDate, endDate);
    const grouped = groupDataByMonth(filtered);
    return fillMissingMonths(grouped, monthRange);
  }

  return filtered;
}

// Chargement initial depuis le fichier JSON
fetch("../config/registrationData.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Erreur lors du chargement du JSON");
    }
    return response.json();
  })
  .then((data) => {
    fullData = data;
    renderChart(fullData); // affichage initial (tout)
  })
  .catch((error) => {
    console.error("Erreur de chargement :", error);
  });

// Gestion du menu déroulant
document.getElementById("periodSelect").addEventListener("change", (e) => {
  currentInterval = e.target.value;
  const filtered = filterDataByPeriod(currentInterval);
  renderChart(filtered);
});

// Gestion du bouton cumulatif

const toggleButton = document.getElementById("toggleCumulative");

toggleButton.addEventListener("click", () => {
  isCumulative = !isCumulative;

  // mettre à jour le texte du bouton
  toggleButton.textContent = isCumulative
    ? "Désactiver le mode cumulatif"
    : "Activer le mode cumulatif";

  // rafraîchir le graphique avec les données courantes
  const filtered = filterDataByPeriod(currentInterval);
  renderChart(filtered);
});
