<div class="main">

    <div class="sideBar">
        <div class="sideBarLogo">
            <img src="../assets/src/logoDashboard.svg" alt="ForgeBlast Logo">
        </div>
        <div class="sideBarContent">
            <ul>
                <li><a href="/accueil"><img src="../assets/src/dashSVG.svg" alt=""><span>Dashboard</span></a></li>
                <li><a href="/play"><img src="../assets/src/controllerSVG.svg" alt=""><span>Play Management</span></a>
                </li>
                <li><a href="/game"><img src="../assets/src/gameSVG.svg" alt=""><span>Game Management</span></a></li>
                <li><a href="/user"><img src="../assets/src/headphoneSVG.svg" alt=""><span>User Support</span></a></li>
                <li><a href="/setting"><img src="../assets/src/settingSVG.svg" alt=""><span>Setting</span></a></li>
            </ul>
        </div>
    </div>
    <div class="contentDashboard">
        <div class="topBar">
            <div class="topBarTitle">
                <h2>Dashboard</h2>
            </div>
            <div class="userData">
                <h2>Admin</h2>
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
                    <div class="evolution">
                        <span id="userGrowthBadge" class="badge"></span>
                        <p>Last month</p>
                    </div>
                </div>
                <div class="contentUserItem">
                    <div class="itemTitle">
                        <h3>New Users this month</h3>
                    </div>
                    <div class="userAmount">
                        <p id="newUsersCount"></p>
                    </div>
                    <div class="evolution">
                        <span>+27%</span>
                        <p>Last month</p>
                    </div>
                </div>
                <div class="contentUserItem">
                    <div class="itemTitle">
                        <h3>Total Users</h3>
                    </div>
                    <div class="userAmount">
                        <p>150</p>
                    </div>
                    <div class="evolution">
                        <span>+27%</span>
                        <p>Last month</p>
                    </div>
                </div>
                <div class="contentUserItem">
                    <div class="itemTitle">
                        <h3>Total Users</h3>
                    </div>
                    <div class="userAmount">
                        <p>150</p>
                    </div>
                    <div class="evolution">
                        <span>+27%</span>
                        <p>Last month</p>
                    </div>
                </div>
                <div class="contentUserItem">
                    <div class="itemTitle">
                        <h3>Revenues</h3>
                    </div>
                    <div class="userAmount">
                        <p>150</p>
                    </div>
                    <div class="evolution">
                        <span>+27%</span>
                        <p>Last month</p>
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
                            <option value="1m">Dernier mois</option>
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
                        <button id="toggleBillingMode">Afficher par facturation (premium)</button>
                    </div>
                    <canvas id="premiumChart"></canvas>
                </div>
            </div>
            <div class="recent">
                <div class="recentUsers">
                    <div class="recentTitle">Recent New User</div>
                    <div class="recentUsersList">
                        <div class="search-bar-container" style="text-align:right; margin-bottom:10px;">
                            <input type="text" id="userSearchInput" placeholder="Search"
                                style="padding:6px; min-width:220px;">
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">User Name</th>
                                    <th scope="col">User ID</th>
                                    <th scope="col">BlastID</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Premium</th>
                                    <th scope="col">Billing</th>

                                </tr>
                            </thead>
                            <!-- the table is generated trough a js loop -->
                            <tbody class="userRow">
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="recentSquads">
                    <div class="recentTitle">Recent New Squad</div>
                    <div class="recentSquadsList squadTableContainer">
                        <div class="search-bar-container" style="text-align:right; margin-bottom:10px;">
                            <input type="text" id="squadSearchInput" placeholder="Search"
                                style="padding:6px; min-width:220px;">
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Squad Name</th>
                                    <th scope="col">Squad ID</th>
                                    <th scope="col">Game</th>
                                    <th scope="col">Leader</th>
                                    <th scope="col">Members</th>
                                    <th scope="col">Created Date</th>
                                    <th scope="col">Status</th>

                                </tr>
                            </thead>
                            <!-- the table is generated trough a js loop -->
                            <tbody class="squadRow">

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>