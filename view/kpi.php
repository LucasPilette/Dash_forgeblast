<div class="kpiChartContainer">
    <div class="topBar">
        <div class="topBarTitle">
        <h2>Sales</h2>
    </div>
    <div class="userData">
        <h2>Admin</h2>
    </div>
</div>
</div>


<div class="kpiChartContainer">
	<div class="kpiChartFlexRow">
		<div class="kpiFlexItem">
			<div class="kpiChartHead">
                <button id="toggleCumulativeKPI">Basculer en mode cumul</button>
                <!-- Checkbox controls for merged chart visibility -->
                <label style="margin-left:12px;font-weight:normal;"> 
                    <input type="checkbox" id="chkMergedNew" checked> NEW USERS
                </label>
                <label style="margin-left:8px;font-weight:normal;"> 
                    <input type="checkbox" id="chkMergedOnboarded" checked> ONBOARDED USERS
                </label>
                <label for="periodSelectKPI"><h2>Période</h2></label>
				<select id="periodSelectKPI">
					<option value="1m" <?php if(($_GET['period']??'1m')==='1m') echo 'selected'; ?>>1 mois</option>
					<option value="3m" <?php if(($_GET['period']??'1m')==='3m') echo 'selected'; ?>>3 mois</option>
					<option value="6m" <?php if(($_GET['period']??'1m')==='6m') echo 'selected'; ?>>6 mois</option>
					<option value="1y" <?php if(($_GET['period']??'1m')==='1y') echo 'selected'; ?>>1 an</option>
				</select>
			</div>
            <div style="width:100%;">
                <!-- Merged chart showing both series with checkboxes -->
                <h2>WEEKLY NEW USERS / ONBOARDED USERS ( at least one linked game )</h2>
                <canvas id="kpiMergedChart" style="max-width:100%;min-height:360px;margin-bottom:14px;"></canvas>
            </div>
		</div>

		<div class="kpiFlexItem">
		</div>
		<div class="kpiFlexItem">
			<!-- Division 4: Ajoutez ici le contenu souhaité -->
		</div>
	</div>
</div>
<script>
// bootstrap data for external KPI script
window.weeklyUsersData = <?php echo json_encode($weeklyUsers, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
window.weeklyUsersWithGameData = <?php echo json_encode($weeklyUsersWithGame, JSON_UNESCAPED_UNICODE); ?>;
</script>