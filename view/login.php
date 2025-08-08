<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Connexion</title>
  <link rel="stylesheet" href="../assets/style/loginStyle.css">
</head>
<body>
  <div class="login-container">
    <div class="login-box">
      <h1>Connexion</h1>
      <form method="post" action="../controller/login_controller.php">
        <label>Email :</label>
        <input type="email" name="email" required>
        <label>Mot de passe :</label>
        <input type="password" name="password" required>
        <button type="submit">Se connecter</button>
      </form>
      <?php if(isset($_GET['error'])): ?>
        <p>Connexion échouée</p>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>