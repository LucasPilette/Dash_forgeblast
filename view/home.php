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
            </div>
            <div class="charts">
                <div class="registrationChart">

                </div>
                <div class="userActivityChart">

                </div>
            </div>
            <div class="recent">
                <div class="recentUsers">
                    <div class="recentTitle">Recent New User</div>
                    <div class="recentUsersList">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">User Name</th>
                                    <th scope="col">User ID</th>
                                    <th scope="col">BlastID</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Join Date</th>
                                    <th scope="col">Balance</th>
                                    <th scope="col">Status</th>

                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($data as $user): ?>
                                <tr>
                                    <td><?= htmlspecialchars($user['user_name']) ?></td>
                                    <td><?= htmlspecialchars($user['user_id']) ?></td>
                                    <td><?= htmlspecialchars($user['blast_id']) ?></td>
                                    <td><?= htmlspecialchars($user['email']) ?></td>
                                    <td><?= htmlspecialchars($user['join_date']) ?></td>
                                    <td><?= htmlspecialchars($user['balance']) ?></td>
                                    <td><?= htmlspecialchars($user['status']) ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="recentSquads">
                    <div class="recentTitle">Recent New Squad</div>
                    <div class="recentSquadsList"></div>
                </div>
            </div>
        </div>
    </div>
</div>