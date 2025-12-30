<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link rel="stylesheet" href="../assets/style/style.css">
    <link href="https://api.fontshare.com/v2/css?f[]=author@400,500,600,700&display=swap" rel="stylesheet">
    <script>
        window.currentUserRole = "<?php echo $_SESSION['user_role'] ?? 'guest'; ?>";
    </script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
</head>

<body>

    <div class="sideBar">
        <div class="sideBarLogo">
            <img src="../assets/src/logoDashboard.svg" alt="ForgeBlast Logo">
        </div>
        <div class="sideBarContent">
            <ul>
                <li><a href="../controller/overview_controller.php"
                        class="<?php echo strpos($_SERVER['REQUEST_URI'], 'overview_controller.php') !== false ? 'active' : ''; ?>">
                        <img src="../assets/src/dashSVG.svg" alt="">
                        <span>Overview</span>
                    </a>
                </li>
                <li><a href="../controller/home_controller.php"
                        class="<?php echo strpos($_SERVER['REQUEST_URI'], 'home_controller.php') !== false ? 'active' : ''; ?>">
                        <img src="../assets/src/dashSVG.svg" alt="">
                        <span>Users / Squads</span>
                    </a>
                </li>
                <li>
                    <a href="../controller/kpi_controller.php"
                        class="<?php echo strpos($_SERVER['REQUEST_URI'], 'kpi_controller.php') !== false ? 'active' : ''; ?>">
                        <img src="../assets/src/dashSVG.svg" alt="">
                        <span>KPI</span>
                    </a>
                </li>
                <li>
                    <a href="../controller/sales_controller.php"
                        class="<?php echo strpos($_SERVER['REQUEST_URI'], 'sales_controller.php') !== false ? 'active' : ''; ?>">
                        <img src="../assets/src/gameSVG.svg" alt="">
                        <span>Sales</span>
                    </a>
                </li>

                <!-- <li><a href="/game"><img src="../assets/src/controllerSVG.svg" alt=""><span>Game Management</span></a></li>
                <li><a href="/user"><img src="../assets/src/headphoneSVG.svg" alt=""><span>User Support</span></a></li>
                <li><a href="/setting"><img src="../assets/src/settingSVG.svg" alt=""><span>Setting</span></a></li> -->
            </ul>
            <div class="logout">
                <a href="../controller/logout_controller.php">Déconnexion</a>
            </div>
        </div>

    </div>