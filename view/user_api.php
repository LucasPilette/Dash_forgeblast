<?php
// Simple user detail page via API. Supports readonly mode via ?readonly=1 and lookup by blast_id or id via GET.
$readonly = (!empty($_GET['readonly']) && $_GET['readonly'] === '1');
$user = null;
$error = null;

// Utiliser l'API au lieu de la DB directe
require_once __DIR__ . '/../config/ApiService.php';
$api = new ApiService();

$lookupId = $_GET['id'] ?? null;
$lookupBlast = $_GET['blast_id'] ?? null;

if ($lookupId || $lookupBlast) {
    $userId = $lookupBlast ?: $lookupId;

    try {
        $user = $api->getUserById($userId);
        if (!$user) {
            $error = 'Utilisateur introuvable.';
        }
    } catch (Throwable $e) {
        $error = 'Erreur lors de la récupération de l\'utilisateur: ' . $e->getMessage();
    }
}
?>
<div class="contentEditUser">
    <div class="topBar">
        <div class="topBarTitle">
            <h2><?php echo $readonly ? 'User (lecture seule)' : 'Edit User'; ?></h2>
        </div>
        <div class="userData">
            <h2><?php echo $_SESSION['user_role'] ?? 'User'; ?></h2>
        </div>
    </div>
    <div class="userContent">
        <?php if ($error): ?>
            <div class="card">
                <p style="color:#900;">Erreur: <?php echo htmlspecialchars($error); ?></p>
            </div>
        <?php elseif (!$user): ?>
            <div class="card">
                <p>Aucun utilisateur sélectionné.</p>
            </div>
        <?php else: ?>
            <div class="card">
                <table class="userDetail">
                    <tr>
                        <th>Blast ID</th>
                        <td><?php echo htmlspecialchars($user['blast_id'] ?? $user['blastId'] ?? ''); ?></td>
                    </tr>
                    <tr>
                        <th>ID</th>
                        <td><?php echo htmlspecialchars($user['id'] ?? ''); ?></td>
                    </tr>
                    <tr>
                        <th>Name</th>
                        <td><?php echo htmlspecialchars($user['name'] ?? ''); ?></td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td><?php echo htmlspecialchars($user['email'] ?? ''); ?></td>
                    </tr>
                    <tr>
                        <th>Platform</th>
                        <td><?php echo htmlspecialchars($user['platform'] ?? ''); ?></td>
                    </tr>
                    <tr>
                        <th>Premium</th>
                        <td><?php echo (!empty($user['premium']) ? 'oui' : 'non'); ?></td>
                    </tr>
                    <tr>
                        <th>Created</th>
                        <td><?php echo htmlspecialchars($user['createdAt'] ?? $user['created_at'] ?? ''); ?></td>
                    </tr>
                    <tr>
                        <th>Country</th>
                        <td><?php echo htmlspecialchars($user['country'] ?? ''); ?></td>
                    </tr>
                    <tr>
                        <th>City</th>
                        <td><?php echo htmlspecialchars($user['city'] ?? ''); ?></td>
                    </tr>
                    <tr>
                        <th>Balance (grapes)</th>
                        <td><?php echo htmlspecialchars($user['balance'] ?? $user['grapes'] ?? '0'); ?></td>
                    </tr>
                    <tr>
                        <th>Active</th>
                        <td><?php echo (!empty($user['active']) ? 'oui' : 'non'); ?></td>
                    </tr>
                    <tr>
                        <th>Last Active</th>
                        <td><?php echo htmlspecialchars($user['lastActiveAt'] ?? $user['last_active_at'] ?? 'N/A'); ?></td>
                    </tr>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>