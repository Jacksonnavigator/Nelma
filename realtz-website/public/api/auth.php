<?php
// Admin sign-in.
//   GET  ?action=status      → is the dashboard set up, is the visitor signed in
//   POST ?action=setup       → first run only: create the admin account
//   POST ?action=login       → sign in
//   POST ?action=logout      → sign out
//   POST ?action=password    → change password (signed in)
require __DIR__ . '/_lib.php';

rtz_session();
$action = (string) ($_GET['action'] ?? 'status');
$admin = rtz_admin();

function rtz_status(?array $admin): void
{
    rtz_json([
        'ok' => true,
        'setup' => $admin !== null,
        'loggedIn' => !empty($_SESSION['rtz_user']),
        'user' => $_SESSION['rtz_user'] ?? null,
        'csrf' => $_SESSION['rtz_csrf'],
        'php' => PHP_VERSION,
        'writable' => is_writable(dirname(RTZ_DATA_DIR)) || is_writable(RTZ_DATA_DIR),
    ]);
}

function rtz_check_password(string $password): void
{
    if (strlen($password) < 10) {
        rtz_fail('Use a password of at least 10 characters.');
    }
}

if ($action === 'status') {
    rtz_status($admin);
}

if (rtz_method() !== 'POST') {
    rtz_fail('Method not allowed', 405);
}

$body = rtz_body();

if ($action === 'setup') {
    if ($admin !== null) {
        rtz_fail('The dashboard is already set up. Please sign in.', 403);
    }
    if (!rtz_rate_limit('setup', 10, 3600)) {
        rtz_fail('Too many attempts. Try again later.', 429);
    }
    $user = rtz_clean((string) ($body['username'] ?? ''), 60);
    $password = (string) ($body['password'] ?? '');
    if ($user === '') {
        rtz_fail('Choose a username.');
    }
    rtz_check_password($password);
    rtz_write('admin.json', [
        'username' => $user,
        'hash' => password_hash($password, PASSWORD_DEFAULT),
        'created' => gmdate('c'),
    ]);
    session_regenerate_id(true);
    $_SESSION['rtz_user'] = $user;
    $_SESSION['rtz_csrf'] = bin2hex(random_bytes(32));
    rtz_status(rtz_admin());
}

if ($action === 'login') {
    if ($admin === null) {
        rtz_fail('The dashboard has not been set up yet.', 409);
    }
    if (!rtz_rate_limit('login', 8, 900)) {
        rtz_fail('Too many sign-in attempts. Wait 15 minutes and try again.', 429);
    }
    $user = (string) ($body['username'] ?? '');
    $password = (string) ($body['password'] ?? '');
    $okUser = hash_equals(strtolower($admin['username']), strtolower(trim($user)));
    $okPass = password_verify($password, $admin['hash']);
    if (!$okUser || !$okPass) {
        usleep(400000);
        rtz_fail('Wrong username or password.', 401);
    }
    if (password_needs_rehash($admin['hash'], PASSWORD_DEFAULT)) {
        $admin['hash'] = password_hash($password, PASSWORD_DEFAULT);
        rtz_write('admin.json', $admin);
    }
    session_regenerate_id(true);
    $_SESSION['rtz_user'] = $admin['username'];
    $_SESSION['rtz_csrf'] = bin2hex(random_bytes(32));
    rtz_status($admin);
}

if ($action === 'logout') {
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['rtz_csrf'] = bin2hex(random_bytes(32));
    rtz_json(['ok' => true]);
}

if ($action === 'password') {
    rtz_require_auth();
    if (!password_verify((string) ($body['current'] ?? ''), $admin['hash'])) {
        rtz_fail('Your current password is not correct.', 401);
    }
    $new = (string) ($body['password'] ?? '');
    rtz_check_password($new);
    $admin['hash'] = password_hash($new, PASSWORD_DEFAULT);
    if (!empty($body['username'])) {
        $admin['username'] = rtz_clean((string) $body['username'], 60);
        $_SESSION['rtz_user'] = $admin['username'];
    }
    rtz_write('admin.json', $admin);
    rtz_json(['ok' => true]);
}

rtz_fail('Unknown action', 404);
