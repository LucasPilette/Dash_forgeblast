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
                            <option value="6m" selected>6 derniers mois</option>
                            <option value="1y">1 an</option>
                        </select>
                    </div>

                    <canvas id="revenueChart"></canvas>
                </div>
                <div class="premiumRepartition">
                    <div class="premiumRepartitionHead">
                        <h2>Répartition des revenus</h2>                    </div>
                    <canvas id="premiumChartSales"></canvas>
                </div>
            </div>
            <div class="revenueDiv">
                <p>Revenus totaux : <span id="totalRevenueAllTime">Chargement...</span></p>
            </div>
            <section class="card">
    <h2>Transactions RevenueCat</h2>

    <!-- Optionnel: fixe le taux USD→EUR via data-usd-eur (par défaut 0.92) -->
    <table id="rcTxTable" data-usd-eur="0.92" class="table">
        <thead>
        <tr>
            <th>Customer ID</th>
            <th>Store</th>
            <th>Product</th>
            <th>Purchased at</th>
            <th>Montant (origine)</th>
            <th>Montant (€)</th>
        </tr>
        </thead>
        <tbody id="rcTxBody"></tbody>
    </table>

    <div id="rcTxPagination" class="pagination-controls"></div>
</section>

</div>
