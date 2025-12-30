// Minimal overview renderer using Chart.js
(function(){
    // Toggleable debug: set to true to log sample date computations in console
    const OVERVIEW_DEBUG = false; // set to true for extra logging
    const OVERVIEW_DEBUG_DATE = '2025-07-21';
    function toMap(arr, keyName, valName){
        const m = new Map();
        (arr||[]).forEach(r => {
            let k = r.week_start || r.month_start || r.week || null;
            const v = r[valName] || r.new_users || r.onboarded || r.active_users || r.tx_count || 0;
            if (!k) return;
            // normalize key to YYYY-MM-DD (strip time or variations)
            try{
                k = String(k).split('T')[0].split(' ')[0];
            }catch(e){ k = String(k); }
            if (k) m.set(k, Number(v));
        });
        return m;
    }

    function sortedKeys(map){
        return Array.from(map.keys()).sort();
    }

    const newUsersMap = toMap(window._overview_weeklyNewUsers, 'week_start', 'new_users');
    const onboardedMap = toMap(window._overview_weeklyOnboarded, 'week_start', 'onboarded');
    const activeWeeklyMap = toMap(window._overview_weeklyActiveUsers, 'week_start', 'active_users');
    const txMap = toMap(window._overview_weeklyTransactions, 'week_start', 'tx_count');

    // union of weeks
    let weeks = Array.from(new Set([...
        Array.from(newUsersMap.keys()),
        Array.from(onboardedMap.keys()),
        Array.from(activeWeeklyMap.keys()),
        Array.from(txMap.keys())
    ].flat())).sort();
    // ensure keys are strings (avoid Date or numeric tick types)
    weeks = weeks.map(w => w == null ? '' : String(w));

    function valuesFor(map, keys){ return keys.map(k => map.get(k) || 0); }

    // Build total users per week (cumulative). Prefer server-provided cumulative series when available
    const newUsersSeries = valuesFor(newUsersMap, weeks);
    let totalUsersSeries = [];
    try{
        const boot = (window._overview_weeklyCumulativeUsers || []);
        if (boot && boot.length){
            // boot is array of {week_start, total_users}
            const bootMap = new Map();
            boot.forEach(r=>{ let k = String(r.week_start).split('T')[0].split(' ')[0]; bootMap.set(k, Number(r.total_users)); });
            totalUsersSeries = weeks.map(w=> bootMap.get(w) || 0 );
        }
    }catch(e){ totalUsersSeries = []; }
    if (!totalUsersSeries || totalUsersSeries.length === 0){
        // fallback: compute cumulative from newUsersSeries
        totalUsersSeries = (function(){
            const out = [];
            let acc = 0;
            for (let i=0;i<newUsersSeries.length;i++){
                acc += Number(newUsersSeries[i] || 0);
                out.push(acc);
            }
            return out;
        })();
    }

    // Debug output for a single sample date to verify denominators
    if (typeof OVERVIEW_DEBUG !== 'undefined' && OVERVIEW_DEBUG){
        try{
            const idx = weeks.indexOf(OVERVIEW_DEBUG_DATE);
            if (idx >= 0){
                const onboarded = onboardedMap.get(OVERVIEW_DEBUG_DATE) || 0;
                const total = totalUsersSeries[idx] || 0;
                const pct = total ? Math.round((onboarded/total)*1000)/10 : 0;
                console.debug('OV_DEBUG', OVERVIEW_DEBUG_DATE, { onboarded, total, pct, idx });
            } else {
                console.debug('OV_DEBUG', 'debug date not in weeks array', OVERVIEW_DEBUG_DATE, { weeksCount: weeks.length });
            }
        }catch(e){ console.debug('OV_DEBUG error', e); }
    }

    function pctOfTotal(n, idx){ const tot = totalUsersSeries[idx] || 0; if (!tot) return 0; return Math.round((Number(n)/tot)*1000)/10; }

    // Helper to format ISO date string 'YYYY-MM-DD' to 'DD/MM/YY'
    // Accepts strings or numeric indices (index into weeks array)
    function formatDateShort(isoOrIndex){
        if (isoOrIndex === null || isoOrIndex === undefined) return '';
        let iso = isoOrIndex;
        // if it's a numeric tick index, map to weeks array
        if (typeof isoOrIndex === 'number') {
            iso = weeks[isoOrIndex] ?? String(isoOrIndex);
        }
        // if Chart.js passes an object, try to extract label
        if (typeof isoOrIndex === 'object' && isoOrIndex !== null) {
            iso = isoOrIndex.label ?? isoOrIndex.x ?? isoOrIndex.y ?? '';
        }
        iso = String(iso);
    // accept 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SS' or 'YYYY-MM-DD HH:MM:SS'
    const base = iso.split('T')[0].split(' ')[0];
        const parts = base.split('-');
        if (parts.length < 3) return iso;
        const [y, m, d] = parts;
        return `${d}/${m}/${y.slice(2)}`;
    }

    // Keep chart instances so we can destroy them if needed
    let _chartComms = null;
    let _chartUX = null;
    let _chartTech = null;
    let _chartValue = null;

    // Comms chart (line with points)
        (function(){
            const el = document.getElementById('chartComms');
            if (!el) return;
            const ctxComms = el.getContext('2d');
            try {
                if (_chartComms) try{ _chartComms.destroy(); } catch(e){}
                _chartComms = new Chart(ctxComms, {
                    type: 'line',
                    data: { labels: weeks, datasets:[{ label:'New users', data: valuesFor(newUsersMap, weeks), borderColor:'#4caf50', backgroundColor:'rgba(76,175,80,0.08)', tension:0.3, pointRadius:4, pointHoverRadius:8, pointHitRadius:8 }] },
                    options:{
                        responsive:true,
                        maintainAspectRatio:false,
                        interaction: { mode: 'index', intersect: false },
                        plugins:{
                            legend:{display:false},
                            tooltip:{
                                callbacks:{
                                    title: function(items){ try{ if(!items || !items[0]) return ''; return formatDateShort(items[0].label); }catch(e){ return ''; } },
                                    label: function(ctx){ try{ const v = (ctx.parsed && ctx.parsed.y !== undefined) ? ctx.parsed.y : ctx.raw; return ctx.dataset.label + ': ' + v; }catch(e){ return ''; } }
                                }
                            }
                        },
                        scales:{
                            x:{display:true,ticks:{maxRotation:0,callback:function(v){ try{ return formatDateShort(v); }catch(e){ return v; } }}},
                            y:{beginAtZero:true}
                        }
                    }
                });
            } catch (e) { console.error('Comms chart error', e); }
        })();

    // UX chart (percentage of total users)
        (function(){
            const el = document.getElementById('chartUX');
            if (!el) return;
            const ctxUX = el.getContext('2d');
            try {
                // Compute onboarded percent as onboarded_this_week / new_users_this_week (1 decimal)
                // Only show percentage when new_users >= 5, otherwise show 0
                const onboardedSeries = valuesFor(onboardedMap, weeks);
                const newUsersSeriesLocal = valuesFor(newUsersMap, weeks);
                const onboardedPct = weeks.map((_,i)=>{
                    const onboarded = Number(onboardedSeries[i] || 0);
                    const newUsers = Number(newUsersSeriesLocal[i] || 0);
                    // Only calculate percentage if we have at least 5 new users
                    if (newUsers < 5) return 0;
                    if (!newUsers) return 0;
                    return Math.round((onboarded / newUsers) * 1000) / 10;
                });
                if (_chartUX) try{ _chartUX.destroy(); } catch(e){}
                _chartUX = new Chart(ctxUX, {
                    type: 'line',
                    data: { labels: weeks, datasets:[{ label:'Onboarded (%)', data: onboardedPct, borderColor:'#2196f3', backgroundColor:'rgba(33,150,243,0.08)', tension:0.3, pointRadius:4, pointHoverRadius:8, pointHitRadius:8 }] },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: {
                                title: function(items){ try{ if(!items || !items[0]) return ''; return formatDateShort(items[0].label); }catch(e){ return ''; } },
                                label: function(ctx){ try{
                                    const idx = (typeof ctx.dataIndex === 'number') ? ctx.dataIndex : (ctx.datasetIndex || 0);
                                    const pct = (ctx.parsed && ctx.parsed.y !== undefined) ? ctx.parsed.y : ctx.raw;
                                    const onboard = (typeof onboardedSeries !== 'undefined') ? (onboardedSeries[idx] || 0) : 0;
                                    const newUsers = (typeof newUsersSeriesLocal !== 'undefined') ? (newUsersSeriesLocal[idx] || 0) : 0;
                                    // Show "N/A" in tooltip when < 5 new users
                                    if (newUsers < 5) {
                                        return ctx.dataset.label + ': N/A (< 5 new users)';
                                    }
                                    return ctx.dataset.label + ': ' + pct + '% (' + onboard + ' / ' + newUsers + ')';
                                }catch(e){ return ''; } }
                            }}
                        },
                        scales: {
                            x: { display: true, ticks: { maxRotation: 0, callback: function(v){ try{ return formatDateShort(v); }catch(e){ return v; } } } },
                            y: { beginAtZero: true, suggestedMax: 100, max: 100, ticks: { callback: function(val){ return val + '%'; } } }
                        }
                    }
                });
            } catch (e) { console.error('UX chart error', e); }
        })();

    // helper: Map each week to the month of its Monday
    function weekToMonth(weekStr){ // weekStr expected YYYY-MM-DD (monday)
        const d = new Date(weekStr + 'T00:00:00');
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    }

    // build monthly active map (used by tech chart)
    const monthlyMap = new Map((window._overview_monthlyActiveUsers||[]).map(r=>[r.month_start, Number(r.active_users)]));
    // monthly tx sums and unique payers (bootstrapped by controller)
    const monthlyTxSumMap = new Map((window._overview_monthlyTxSums||[]).map(r=>[r.month_start, Number(r.tx_sum)]));
    const monthlyUniquePayersMap = new Map((window._overview_monthlyUniquePayers||[]).map(r=>[r.month_start, Number(r.unique_payers)]));

    // Tech chart (percentage of total users)
        (function(){
            const el = document.getElementById('chartTech');
            if (!el) return;
            const ctxTech = el.getContext('2d');
            try {
                const weeklyActiveSeries = valuesFor(activeWeeklyMap, weeks);
                const weeklyActivePct = weeklyActiveSeries.map((v,i)=>pctOfTotal(v,i));
                const monthlyActiveSeries = weeks.map(w=>{ const m = weekToMonth(w); return monthlyMap.get(m)||0; });
                const monthlyActivePct = monthlyActiveSeries.map((v,i)=>pctOfTotal(v,i));
                if (_chartTech) try{ _chartTech.destroy(); } catch(e){}
                _chartTech = new Chart(ctxTech, {
                    type: 'line',
                    data: {
                        labels: weeks,
                        datasets: [
                            { label: 'Weekly active (%)', data: weeklyActivePct, borderColor:'#f39321', backgroundColor:'rgba(243,147,33,0.08)', tension:0.3, pointRadius:4, pointHoverRadius:8, pointHitRadius:8 }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { display: true },
                            tooltip: {
                                callbacks: {
                                    title: function(items){ try{ if(!items||!items[0]) return ''; return formatDateShort(items[0].label);}catch(e){return ''; } },
                                    label: function(ctx){ try{
                                        const idx = (typeof ctx.dataIndex === 'number') ? ctx.dataIndex : 0;
                                        const pct = (ctx.parsed && ctx.parsed.y !== undefined) ? ctx.parsed.y : ctx.raw;
                                        const active = (typeof weeklyActiveSeries !== 'undefined') ? (weeklyActiveSeries[idx] || 0) : 0;
                                        const total = (typeof totalUsersSeries !== 'undefined') ? (totalUsersSeries[idx] || 0) : 0;
                                        return ctx.dataset.label + ': ' + pct + '% (' + active + ' / ' + total + ')';
                                    }catch(e){ return ''; } }
                                }
                            }
                        },
                        scales: {
                            x: { display: true, ticks: { maxRotation: 0, callback: function(v){ try{ return formatDateShort(v); }catch(e){ return v; } } } },
                            y: { beginAtZero: true, suggestedMax:100, max:100, ticks: { callback: function(val){ return val + '%'; } } }
                        }
                    }
                });
            } catch (e) { console.error('Tech chart error', e); }
        })();

    // Value chart: transactions / monthly active users mapping (simple heuristic)
    // Map each week to the month of its Monday
    function weekToMonth(weekStr){ // weekStr expected YYYY-MM-DD (monday)
        const d = new Date(weekStr + 'T00:00:00');
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    }

    // Compute value as percentage of total users at that week: (tx / totalUsers) * 100
    // NOTE: kept for fallback/legacy uses; primary monthly computation below uses monthly sums and monthly MAU
    const valuePercent = weeks.map((w,i) => {
        const tx = txMap.get(w) || 0;
        const tot = totalUsersSeries[i] || 0;
        if (!tot) return 0;
        return Math.round((tx / tot) * 1000) / 10; // one decimal percentage
    });

    // Value chart: period-aware
    (function(){
        const el = document.getElementById('chartValue');
        if (!el) return;
        const parent = el.parentElement || el.parentNode;
        const ctxValue = el.getContext('2d');
        try {
            const qs = new URLSearchParams(window.location.search || '');
            const period = (qs.get('period') || '3m').toLowerCase();

            if (period === '1m'){
                if (_chartValue) try{ _chartValue.destroy(); } catch(e){}
                el.style.display = 'none';
                let sum = document.getElementById('chartValueSummary');
                if (!sum){ sum = document.createElement('div'); sum.id = 'chartValueSummary'; sum.style.padding = '24px'; sum.style.fontSize = '20px'; sum.style.fontWeight = '600'; }
                // compute for the latest month: sum(tx in month) / cumulative_users_at_month_end
                const monthsAll = Array.from(new Set(weeks.map(w=>weekToMonth(w)))).sort();
                let value = 0; let lastTx = 0; let lastCumUsers = 0; if (monthsAll.length){
                    const m = monthsAll[monthsAll.length-1];
                    // weeks in that month
                    const idxs = weeks.map((w,idx)=> weekToMonth(w) === m ? idx : -1).filter(i=>i>=0);
                    const sumTx = monthlyTxSumMap.get(m) || idxs.reduce((s,i)=> s + (txMap.get(weeks[i]) || 0), 0);
                    // cumulative users at month end: take the last week's totalUsersSeries value inside the month
                    const cumUsers = (idxs.length ? (totalUsersSeries[idxs[idxs.length-1]] || 0) : 0);
                    lastTx = sumTx; lastCumUsers = cumUsers;
                    value = (cumUsers && sumTx) ? Math.round((sumTx / cumUsers) * 1000) / 10 : 0;
                }
                sum.innerText = (value ? value + '% (' + lastTx + ' tx / ' + lastCumUsers + ' cumulative users)' : '0%');
                if (!parent.querySelector('#chartValueSummary')) parent.appendChild(sum);
                return;
            }

            // aggregate weekly valuePercent per month
            const months = Array.from(new Set(weeks.map(w=>weekToMonth(w)))).sort();
            const monthLabels = months.map(m => { const parts = m.split('-'); return parts[1] + '/' + parts[0].slice(2); });
            // For each month use the last week's cumulative users as denominator
            const monthlyVals = [];
            const monthlyTxCounts = [];
            const monthlyActiveCounts = []; // will hold cumulative users at month end for tooltip
            months.forEach(m => {
                const idxs = weeks.map((w,idx)=> weekToMonth(w) === m ? idx : -1).filter(i=>i>=0);
                if (idxs.length === 0) {
                    monthlyVals.push(0);
                    monthlyTxCounts.push(0);
                    monthlyActiveCounts.push(0);
                    return;
                }
                // get server-provided tx sums or sum weekly tx as fallback
                const sumTx = monthlyTxSumMap.get(m) || idxs.reduce((s,i)=> s + (txMap.get(weeks[i]) || 0), 0);
                // cumulative users at month end: take the last week's totalUsersSeries value inside the month
                const cumUsers = totalUsersSeries[idxs[idxs.length-1]] || 0;
                monthlyTxCounts.push(sumTx);
                monthlyActiveCounts.push(cumUsers);
                // percent = sumTx / cumulativeUsersAtMonthEnd * 100
                const pct = (cumUsers && sumTx) ? Math.round((sumTx / cumUsers) * 1000) / 10 : 0;
                monthlyVals.push(pct);
            });

            if (_chartValue) try{ _chartValue.destroy(); } catch(e){}
            const existingSum = parent.querySelector('#chartValueSummary'); if (existingSum) existingSum.remove();
            el.style.display = '';
                _chartValue = new Chart(ctxValue, {
                type: 'line',
                data: { labels: monthLabels, datasets:[{ label:'Tx per cumulative users (%)', data: monthlyVals, borderColor:'#9c27b0', backgroundColor:'rgba(156,39,176,0.08)', tension:0.2, pointRadius:5, pointHoverRadius:8, pointHitRadius:8 }] },
                options: { responsive:true, maintainAspectRatio:false, interaction: { mode: 'index', intersect: false }, plugins:{ legend:{display:false}, tooltip:{ callbacks:{ title:function(items){ try{ if(!items||!items[0]) return ''; return items[0].label; }catch(e){ return ''; } }, label:function(ctx){ try{ const idx = (typeof ctx.dataIndex === 'number') ? ctx.dataIndex : 0; const v = (ctx.parsed && ctx.parsed.y !== undefined) ? ctx.parsed.y : ctx.raw; const tx = monthlyTxCounts[idx] || 0; const cumUsers = monthlyActiveCounts[idx] || 0; return ctx.dataset.label + ': ' + v + '% (' + tx + ' tx / ' + cumUsers + ' cumulative users)'; }catch(e){ return ''; } } } } }, scales:{ x:{ display:true, ticks:{ maxRotation:0 } }, y:{ beginAtZero:true, suggestedMax:30, max:30, ticks:{ callback:function(v){ return v + '%'; } } } } }
            });
        } catch (e) { console.error('Value chart error', e); }
    })();

})();
