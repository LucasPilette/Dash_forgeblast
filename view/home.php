<script>
window.usersData = <?php echo json_encode($users, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
document.addEventListener('DOMContentLoaded', function() {
  if (window.usersData && Array.isArray(window.usersData)) {
    updateUserCounters(window.usersData);
    prepareUserChart();
  }
});
</script>
<div class="main">
    <div class="contentDashboard">
        <div class="topBar">
            <div class="topBarTitle">
                <h2>Dashboard</h2>
            </div>
            <div class="userData">
                <h2><?php echo $_SESSION['user_role']; ?></h2>
            </div>
        </div>
        <div class="content">
            <div class="contentUser">
                <div class="contentUserItem">
                    <div class="itemTitle">
                        <h3>Total Users</h3>
                    </div>
                    <div class="userAmount">
                        <p id="userCount"></p>
                    </div>
                    <div class="badge-wrapper">
                        <div id="userGrowthBadge" class="badge badge-neutral">0%</div>
                        <div id="userGrowthTooltip" class="tooltip"></div>
                    </div>
                </div>
                <div class="contentUserItem">
                    <div class="itemTitle">
                        <h3>New Users this month</h3>
                    </div>
                    <div class="userAmount">
                        <p id="newUsersCount"></p>
                    </div>
                    <div class="badge-wrapper">
                        <div id="userGrowthTrendBadge" class="badge badge-neutral">+0%</div>
                        <div id="userGrowthTrendTooltip" class="tooltip"></div>
                    </div>
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
                            <option value="1m" selected>Dernier mois</option>
                            <option value="3m">3 derniers mois</option>
                            <option value="6m">6 derniers mois</option>
                            <option value="1y">1 an</option>
                        </select>
                    </div>

                    <canvas id="userChart"></canvas>
                </div>
                <div class="premiumRepartition">
                    <div class="premiumRepartitionHead">
                        <h2>Répartition des utilisateurs <span>Premium</span></h2>
                    </div>
                    <canvas id="premiumChart"></canvas>
                </div>
            </div>
            <div class="recent">
                <div class="recentUsers">
                    <div class="recentTitle">Recent New User</div>
                    <div class="recentUsersList">
                        <div class="userListHead">
                            <div>
                                <label class="filterCheckbox">
                                    <input type="checkbox" id="filterPremium" checked />
                                    Premium
                                </label>
                                <label class="filterCheckbox">
                                    <input type="checkbox" id="filterFree" checked />
                                    Gratuit
                                </label>
                            </div>
                            <div class="search-bar-container" style="text-align:right; margin-bottom:10px;">
                                <input type="text" id="userSearch" placeholder="Search"
                                    style="padding:6px; min-width:220px;">
                            </div>
                        </div>

                        <table>
                        <thead>
                        <tr>
                            <th>User Name</th>
                            <th>User ID</th>
                            <th>BlastID</th>
                            <th>Email</th>
                            <th>Join Date</th>  <!-- (remplace "Status") -->
                            <th>Premium</th>    <!-- ✅ nouvelle colonne, avant Grapes -->
                            <th>Grapes</th>
                            <th>Pays</th>       <!-- (remplace "Billing") -->
                            <th>Ville</th>
                            <th>Platform</th>      <!-- nouvelle -->
                        </tr>
                        </thead>

<tbody class="userRow">
<?php
$e = fn($v) => htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');
if (!empty($users)) {
foreach ($users as $u) {
        $name     = $u['name']      ?? '';
        $id       = $u['id']        ?? '';
    $blastId  = $u['blast_id']  ?? '';
        $email    = $u['email']     ?? '';
        $country  = $u['country']   ?? '';
        $city     = $u['city']      ?? '';
        $premium  = !empty($u['premium']);
        $grapes   = (int)($u['grapes'] ?? 0);
        $platform = $u['platform']  ?? '';
        $os = strtolower((string)($u['platform'] ?? ''));
        if ($os !== 'ios' && $os !== 'android') {
                $os = 'unknown';
        }
        $createdIso = '';
                if (!empty($u['createdAt'])) {
                        if ($u['createdAt'] instanceof DateTimeInterface) {
                                $createdIso = $u['createdAt']->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d');
                        } else {
                                $ts = strtotime((string)$u['createdAt']);
                                if ($ts) $createdIso = gmdate('Y-m-d', $ts);
                        }
                }
        $joinDate = !empty($u['created_at'])
                ? (new DateTime($u['created_at']))->format('d/m/Y')
                : '—';
        $rowClass = $premium ? 'premium' : '';
    $search = trim(($name.' '.$id.' '.$email));
    // prefer blastId for lookup; fallback to numeric id when missing
    $targetBlast = $blastId !== '' ? $blastId : $id;
    echo '<tr class="'.$rowClass.'"'
        .' data-premium="'.($premium ? 'true' : 'false').'"'
        .' data-os="'.htmlspecialchars($os, ENT_QUOTES).'"'
        .' data-created="'.htmlspecialchars($createdIso, ENT_QUOTES).'"'
        .' data-search="'.htmlspecialchars($search, ENT_QUOTES).'"'
        .' style="cursor:pointer"'
        .' onclick="window.location.href=\'user.php?blast_id='.rawurlencode($targetBlast).'&readonly=1\'">'
                        .'<td>'.htmlspecialchars($name).'</td>'
                        .'<td>'.htmlspecialchars($id).'</td>'
                        .'<td>'.htmlspecialchars($blastId).'</td>'
                        .'<td>'.htmlspecialchars($email).'</td>'
                        .'<td>'.$joinDate.'</td>'
                        .'<td>'.($premium ? 'oui' : 'non').'</td>'
                        .'<td>'.$grapes.'</td>'
                        .'<td>'.htmlspecialchars($country ?: '—').'</td>'
                        .'<td>'.htmlspecialchars($city ?: '—').'</td>'
                        .'<td>'.htmlspecialchars($platform ?: '—').'</td>'
                .'</tr>';
}
} else {
    echo '<tr><td colspan="9" class="muted">Aucun utilisateur trouvé.</td></tr>';
}
?>
</tbody>
                            </tbody>
                        </table>
<div class="pagination-controls user-pagination"></div>

<!-- ===== Squads ===== -->
<div class="contentUserItem" style="margin-top:24px;">
    <div class="itemTitle">
        <h3>Squads</h3>
    </div>
    <div class="search-bar-container" style="text-align:right; margin-bottom:10px;">
        <input type="text" id="squadSearchInput" placeholder="Rechercher une squad"
                     style="padding:6px; min-width:220px;">
    </div>
    <div class="recentUsersList">
        <div class="tableScrollX">
            <table class="squadsTable">
                <colgroup>
                    <col style="width:20%">  <!-- Nom -->
                    <col style="width:26%">  <!-- ID (UUID long) -->
                    <col style="width:14%">  <!-- Leader -->
                    <col style="width:10%">  <!-- Créée le -->
                    <col style="width:12%">  <!-- But -->
                    <col style="width:10%">  <!-- Ville -->
                    <col style="width:8%">   <!-- Jeu -->
                </colgroup>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>ID</th>
                        <th>Leader</th>
                        <th>Créée le</th>
                        <th>But</th>
                        <th>Ville</th>
                        <th>Jeu</th>
                    </tr>
                </thead>
                <tbody class="squadRow">
                <?php
                    $e = fn($v) => htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');
                    if (!empty($squads)) {
                        foreach ($squads as $s) {
                            $name       = $s['name']        ?? '';
                            $id         = $s['id']          ?? '';
                            $leaderName = $s['leader_name'] ?? '';
                            $leaderId   = $s['leaderId']    ?? '';
                            $goal       = $s['goal']        ?? '';
                            $city       = $s['city']        ?? '';
                            $createdDisp = '—';
                            if (!empty($s['createdAt'])) {
                                try {
                                    $dt = new DateTime((string)$s['createdAt']);
                                    $createdDisp = $dt->format('d/m/Y');
                                } catch (Throwable $__) { /* laisse "—" */ }
                            }
                            $gameLabel = '';
                            if (!empty($s['game_description'])) {
                                    $gameLabel = (string)$s['game_description'];
                            } elseif (!empty($s['gameId'])) {
                                    $gameLabel = (string)$s['gameId'];
                            }
                            $search = trim("$name $id $leaderName $leaderId $goal $city $gameLabel");
                            echo '<tr data-search="'.$e($search).'">'
                                 .   '<td class="cell-wrap"              title="'.$e($name).'">'.$e($name).'</td>'
                                 .   '<td class="cell-wrap cell-mono"     title="'.$e($id).'">'.$e($id).'</td>'
                                 .   '<td class="cell-wrap"               title="'.$e($leaderName ?: $leaderId).'">'
                                 .        ($leaderName !== '' ? $e($leaderName) : '—')
                                 .     '</td>'
                                 .   '<td class="cell-nowrap"             title="'.$e($s['createdAt'] ?? '').'">'.$e($createdDisp).'</td>'
                                 .   '<td class="cell-wrap"               title="'.$e($goal).'">'.$e($goal).'</td>'
                                 .   '<td class="cell-wrap"               title="'.$e($city).'">'.$e($city).'</td>'
                                 .   '<td class="cell-wrap"               title="'.$e($gameLabel).'">'.$e($gameLabel).'</td>'
                                 . '</tr>';
                        }
                    } else {
                        echo '<tr><td colspan="7" style="text-align:center;color:#888;">Aucune squad</td></tr>';
                    }
                ?>
                </tbody>
            </table>
        </div>
        <div class="pagination-controls squad-pagination"></div>
    </div>
</div>

<!-- Styles ciblés (non intrusifs) -->
<style>
  .tableScrollX { overflow-x: auto; }
  .squadsTable { width: 100%; table-layout: fixed; border-collapse: collapse; }
  .squadsTable th, .squadsTable td { padding: 8px 10px; vertical-align: middle; }
  .cell-wrap   { word-break: break-word; }
  .cell-nowrap { white-space: nowrap; }
  .cell-mono   { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
</style>

                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="card" style="height: 360px;">
  <div style="height:100%;padding:12px;">
    <canvas id="usersPerMonthChart"></canvas>
  </div>
</div>

                </php>
