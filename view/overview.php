<?php
// Bootstrapped arrays from controller: $weeklyNewUsers, $weeklyOnboarded, $weeklyActiveUsers, $monthlyActiveUsers, $weeklyTransactions
?>
<div class="contentOverview">
    <div class="topBar">
        <div class="topBarTitle">
            <h2>Overview</h2>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-right:20px;">
            <label for="overview-period" style="font-weight:600;margin-right:6px;">Période</label>
            <select id="overview-period" class="period-select">
                <option value="1m" <?php if (($period ?? '3m') == '1m') echo 'selected'; ?>>1 mois</option>
                <option value="3m" <?php if (($period ?? '3m') == '3m') echo 'selected'; ?>>3 mois</option>
                <option value="6m" <?php if (($period ?? '3m') == '6m') echo 'selected'; ?>>6 mois</option>
                <option value="1y" <?php if (($period ?? '3m') == '1y') echo 'selected'; ?>>1 an</option>
            </select>
        </div>
    </div>

    <div class="contentOverviewMain" style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px; align-items:start;">
        <div class="overviewGraph">
            <h3>Acquisition (nouveaux users / semaine)</h3>
            <canvas id="chartComms" width="600" height="280"></canvas>
        </div>
        <div class="overviewGraph">
            <h3>Activation (users avec jeu / nouveaux users)</h3>
            <canvas id="chartUX" width="600" height="280"></canvas>
        </div>
        <div class="overviewGraph">
            <h3>Conversion (transactions / total users)</h3>
            <canvas id="chartValue" width="600" height="280"></canvas>
        </div>
        <div class="overviewGraph">
            <h3>Retention (users actifs / semaine)</h3>
            <canvas id="chartTech" width="600" height="280"></canvas>
        </div>
    </div>

    <script>
        document.getElementById('overview-period').addEventListener('change', function(e) {
            const p = e.target.value;
            const url = new URL(window.location.href);
            url.searchParams.set('period', p);
            window.location.href = url.toString();
        });
        // Bootstrap JS variables from PHP
        window._overview_weeklyNewUsers = <?php echo json_encode($weeklyNewUsers); ?>;
        window._overview_weeklyOnboarded = <?php echo json_encode($weeklyOnboarded); ?>;
        window._overview_weeklyActiveUsers = <?php echo json_encode($weeklyActiveUsers); ?>;
        window._overview_monthlyActiveUsers = <?php echo json_encode($monthlyActiveUsers); ?>;
        window._overview_weeklyTransactions = <?php echo json_encode($weeklyTransactions); ?>;
        // cumulative total users per week (week_start => total_users)
        window._overview_weeklyCumulativeUsers = <?php echo json_encode($weeklyCumulativeUsers); ?>;
        // monthly tx sums and unique payers
        window._overview_monthlyTxSums = <?php echo json_encode($monthlyTxSumArr); ?>;
        window._overview_monthlyUniquePayers = <?php echo json_encode($monthlyUniquePayersArr); ?>;
    </script>
    <script src="/forgeblast/assets/script/script_overview.js"></script>

</div>