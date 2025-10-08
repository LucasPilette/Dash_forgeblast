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

  // Render weekly active users chart (accounts older than 7 days and active within the week)
  let kpiActiveChart = null;
  function renderActiveUsersChart() {
    const data = window.weeklyActiveUsersData || [];
    const keys = data.map(r => String(r.week_start)).sort((a,b) => new Date(a) - new Date(b));
    const labels = keys.map(k => formatDateFr(k));
    const values = keys.map(k => {
      const found = data.find(r => String(r.week_start) === k);
      return found ? Number(found.active_users) : 0;
    });

    const canvas = document.getElementById('kpiActiveUsersChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (kpiActiveChart) kpiActiveChart.destroy();
      kpiActiveChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Active users (last 7 days, account > 7d)', data: values, backgroundColor: 'rgba(243,147,33,0.6)', borderColor: '#f39321', borderWidth: 1 }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'Weekly active users (accounts older than 7 days)' } }, scales: { x: { title: { display: true, text: 'Semaine' } }, y: { beginAtZero: true } } },
        plugins: window.ChartDataLabels ? [ChartDataLabels] : []
      });
  }

    // Monthly active users (accounts older than 30 days and active within the month)
    let kpiMonthlyActiveChart = null;
    function renderMonthlyActiveChart() {
      const data = window.monthlyActiveUsersData || [];
      const keys = data.map(r => String(r.month_start)).sort((a,b) => new Date(a + '-01') - new Date(b + '-01'));
      const labels = keys.map(k => {
        // format YYYY-MM -> Month Year fr
        const parts = k.split('-');
        const d = new Date(parts[0], Number(parts[1]) - 1, 1);
        return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      });
      const values = keys.map(k => { const f = data.find(r => String(r.month_start) === k); return f ? Number(f.active_users) : 0; });

      const canvas = document.getElementById('kpiMonthlyActiveChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (kpiMonthlyActiveChart) kpiMonthlyActiveChart.destroy();
      kpiMonthlyActiveChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Monthly active users (last 30 days, account > 30d)', data: values, backgroundColor: 'rgba(243,147,33,0.45)', borderColor: '#f39321', borderWidth: 1 }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'Monthly active users (accounts older than 30 days)' } }, scales: { x: { title: { display: true, text: 'Mois' } }, y: { beginAtZero: true } } },
        plugins: window.ChartDataLabels ? [ChartDataLabels] : []
      });

      // populate table
      const tbody = document.querySelector('#monthlyActiveTable tbody');
      if (tbody) {
        tbody.innerHTML = '';
        keys.slice().reverse().forEach((k, i) => {
          const v = values[keys.indexOf(k)] || 0;
          const row = document.createElement('tr');
          row.innerHTML = '<td style="padding:6px">' + labels[keys.indexOf(k)] + '</td><td style="padding:6px;text-align:right">' + v + '</td>';
          tbody.appendChild(row);
        });
      }
    }

  // initial render
  document.addEventListener('DOMContentLoaded', () => {
    // KPI debug mode: set ?kpi_debug=1 in the URL to enable console dumps
    const params = new URLSearchParams(window.location.search);
    const kpiDebug = params.get('kpi_debug') === '1' || window.KPI_DEBUG === true;
    if (kpiDebug) {
      try {
        console.groupCollapsed('[KPI debug] Bootstrapped KPI datasets');
        console.log('weeklyUsersData (new users per week):', window.weeklyUsersData?.length || 0);
        console.table((window.weeklyUsersData || []).slice(0, 100));
        console.log('weeklyUsersWithGameData (new users with game):', window.weeklyUsersWithGameData?.length || 0);
        console.table((window.weeklyUsersWithGameData || []).slice(0, 100));
        console.log('weeklyActiveUsersData (active users per week):', window.weeklyActiveUsersData?.length || 0);
        console.table((window.weeklyActiveUsersData || []).slice(0, 100));
        console.log('monthlyActiveUsersData (active users per month):', window.monthlyActiveUsersData?.length || 0);
        console.table((window.monthlyActiveUsersData || []).slice(0, 100));

        // simple aggregates to compare with charts
        const sum = (arr, key) => (arr || []).reduce((s, r) => s + Number(r[key] || 0), 0);
        console.log('Aggregates:');
        console.log(' total weekly new users (sum new_users) =', sum(window.weeklyUsersData, 'new_users'));
        console.log(' total weekly onboarded (sum new_users_with_game) =', sum(window.weeklyUsersWithGameData, 'new_users_with_game'));
        console.log(' total weekly active (sum active_users) =', sum(window.weeklyActiveUsersData, 'active_users'));
        console.log(' total monthly active (sum active_users) =', sum(window.monthlyActiveUsersData, 'active_users'));
        console.groupEnd();
      } catch (e) { console.warn('KPI debug failed', e); }
    }
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
    renderActiveUsersChart();
    renderMonthlyActiveChart();
  });
})();
