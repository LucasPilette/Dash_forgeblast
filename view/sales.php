<div class="contentSales">
            <div class="topBar">
            <div class="topBarTitle">
                <h2>Sales</h2>
            </div>
            <div class="userData">
                <h2>Admin</h2>
            </div>
        </div>
            <div class="charts">
                <div class="registrationChart">
                    <div class="registrationChartHead">
                        <button id="toggleCumulative">Basculer en mode cumul</button>
                        <label for="periodSelect">
                            <h2>Période</h2>
                        </label>
                        <select id="periodSelect" class="period-select">
                            <option value="1d">Dernier jour</option>
                            <option value="7d">7 derniers jours</option>
                            <option value="1m">Dernier mois</option>
                            <option value="3m">3 derniers mois</option>
                            <option value="6m">6 derniers mois</option>
                            <option value="1y">1 an</option>
                        </select>
                    </div>

                    <canvas id="revenueChart"></canvas>
                </div>
                <div class="premiumRepartition">
                    <div class="premiumRepartitionHead">
                        <h2>Répartition des revenus</h2>
                        <button id="toggleBillingMode">Afficher par facturation (premium)</button>
                    </div>
                    <canvas id="premiumChart"></canvas>
                </div>
            </div>
</div>
