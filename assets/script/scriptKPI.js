// KPI merged chart script - expects window.weeklyUsersData and window.weeklyUsersWithGameData to be set
(function(){
  if (!window.weeklyUsersData || !window.weeklyUsersWithGameData) {
    // nothing to do
    return;
  }

  function formatDateFr(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  let isCumulativeKPI = false;
  function getChartData(data, cumulative) {
    if (!cumulative) return data;
    let acc = 0;
    return data.map(v => (acc += v));
  }

  let kpiMergedChart = null;

  function renderMergedChart() {
    const weeklyUsersData = window.weeklyUsersData || [];
    const weeklyUsersWithGameData = window.weeklyUsersWithGameData || [];

    const newMap = new Map(weeklyUsersData.map(r => [String(r.week_start), Number(r.new_users)]));
    const onMap = new Map(weeklyUsersWithGameData.map(r => [String(r.week_start), Number(r.new_users_with_game)]));

    const allKeys = Array.from(new Set([...newMap.keys(), ...onMap.keys()]));
    allKeys.sort((a,b) => new Date(a) - new Date(b));

    const labels = allKeys.map(k => formatDateFr(k));
    const rawNew = allKeys.map(k => Number.isFinite(newMap.get(k)) ? newMap.get(k) : 0);
    const rawOn = allKeys.map(k => Number.isFinite(onMap.get(k)) ? onMap.get(k) : 0);

    const dataNew = isCumulativeKPI ? getChartData(rawNew.slice(), true) : rawNew;
    const dataOn = isCumulativeKPI ? getChartData(rawOn.slice(), true) : rawOn;

    const showNew = document.getElementById('chkMergedNew')?.checked ?? true;
    const showOn = document.getElementById('chkMergedOnboarded')?.checked ?? true;

    const datasets = [];
    if (showNew) datasets.push({ label: 'NEW USERS', data: dataNew, borderColor: '#f39321', backgroundColor: 'rgba(243,147,33,0.18)', fill: true, pointRadius: 3 });
    if (showOn) datasets.push({ label: 'ONBOARDED USERS', data: dataOn, borderColor: '#1e88e5', backgroundColor: 'rgba(30,136,229,0.10)', fill: true, pointRadius: 3 });

    const canvas = document.getElementById('kpiMergedChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (kpiMergedChart) kpiMergedChart.destroy();
    kpiMergedChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Weekly new users compared to onboarded users (' + (document.getElementById('periodSelectKPI')?.selectedOptions?.[0]?.text || '') + ')' }, datalabels: { display: false } },
        scales: { x: { title: { display: true, text: 'Semaine' } }, y: { beginAtZero: true, title: { display: true, text: 'Utilisateurs' } } }
      },
      plugins: window.ChartDataLabels ? [ChartDataLabels] : []
    });
  }

  // initial render
  document.addEventListener('DOMContentLoaded', () => {
    // Bootstrapped checkboxes might not exist yet in DOM if page structure changed
    // Ensure listeners
    document.getElementById('chkMergedNew')?.addEventListener('change', () => renderMergedChart());
    document.getElementById('chkMergedOnboarded')?.addEventListener('change', () => renderMergedChart());

    document.getElementById('toggleCumulativeKPI')?.addEventListener('click', function() {
      isCumulativeKPI = !isCumulativeKPI;
      this.textContent = isCumulativeKPI ? 'Désactiver le mode cumulatif' : 'Basculer en mode cumul';
      renderMergedChart();
    });

    document.getElementById('periodSelectKPI')?.addEventListener('change', function() {
      renderMergedChart();
      const val = this.value;
      window.location.search = '?period=' + val;
    });

    // finally draw
    renderMergedChart();
  });
})();
