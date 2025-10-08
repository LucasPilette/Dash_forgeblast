<?php
// Simple user detail page. Supports readonly mode via ?readonly=1 and lookup by blast_id or id via GET.
$readonly = (!empty($_GET['readonly']) && $_GET['readonly'] === '1');
$user = null;
$error = null;
// Try to retrieve user using controller API internally
require_once __DIR__ . '/../controller/dbConnect.php'; // provides $dataDB
$lookupId = $_GET['id'] ?? null;
$lookupBlast = $_GET['blast_id'] ?? null;
if ($lookupId || $lookupBlast) {
    if ($lookupBlast) {
        $sql = 'SELECT * FROM "User" WHERE blast_id = $1 LIMIT 1';
        $res = pg_query_params($dataDB, $sql, [$lookupBlast]);
    } else {
        $sql = 'SELECT * FROM "User" WHERE id = $1 LIMIT 1';
        $res = pg_query_params($dataDB, $sql, [$lookupId]);
    }
    if (!$res) {
        $error = 'Erreur de base de données: ' . pg_last_error($dataDB);
    } else {
        $row = pg_fetch_assoc($res);
        if (!$row) $error = 'Utilisateur introuvable.';
        else $user = $row;
    }
}
?>
<div class="contentEditUser">
    <div class="topBar">
        <div class="topBarTitle">
            <h2><?php echo $readonly ? 'User (lecture seule)' : 'Edit User'; ?></h2>
        </div>
        <div class="userData">
            <h2><?php echo $_SESSION['user_role']; ?></h2>
        </div>
    </div>
    <div class="userContent">
        <?php if ($error): ?>
            <div class="card"><p style="color:#900;">Erreur: <?php echo htmlspecialchars($error); ?></p></div>
        <?php elseif (!$user): ?>
            <div class="card"><p>Aucun utilisateur sélectionné.</p></div>
        <?php else: ?>
            <div class="card">
                <table class="userDetail">
                    <tr><th>Blast ID</th><td><?php echo htmlspecialchars($user['blast_id'] ?? ''); ?></td></tr>
                    <tr><th>ID</th><td><?php echo htmlspecialchars($user['id'] ?? ''); ?></td></tr>
                    <tr><th>Name</th><td><?php echo htmlspecialchars($user['name'] ?? ''); ?></td></tr>
                    <tr><th>Email</th><td><?php echo htmlspecialchars($user['email'] ?? ''); ?></td></tr>
                    <tr><th>Platform</th><td><?php echo htmlspecialchars($user['platform'] ?? ''); ?></td></tr>
                    <tr><th>Premium</th><td><?php echo (!empty($user['premium']) ? 'oui' : 'non'); ?></td></tr>
                    <tr><th>Created</th><td><?php echo htmlspecialchars($user['createdAt'] ?? $user['created_at'] ?? ''); ?></td></tr>
                </table>
                <?php if (!$readonly): ?>
                    <div style="margin-top:12px;">
                        <a href="edit_user_form.php?id=<?php echo rawurlencode($user['id']); ?>">Modifier</a>
                    </div>
                <?php else: ?>
                    <div style="margin-top:12px;color:#666;">Mode lecture seule — modifications désactivées</div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

