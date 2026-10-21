<?php
// Shared helpers for the website's small backend. Works on PHP 7.4+ (Namecheap
// shared hosting) with no database: everything is stored as JSON files in /data.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === '_lib.php') {
    http_response_code(404);
    exit;
}

// Where content, submissions, backups and the admin login are stored. The
// folder ships with an .htaccess that blocks web access. To keep the data
// outside public_html instead, create api/config.php with:
//   <?php define('RTZ_DATA_DIR', '/home/youruser/realtz-data');
if (is_file(__DIR__ . '/config.php')) {
    require __DIR__ . '/config.php';
}
if (!defined('RTZ_DATA_DIR')) {
    define('RTZ_DATA_DIR', dirname(__DIR__) . '/data');
}
define('RTZ_UPLOAD_DIR', dirname(__DIR__) . '/uploads');
define('RTZ_UPLOAD_URL', '/uploads');
define('RTZ_MAX_CONTENT_BYTES', 8 * 1024 * 1024);
define('RTZ_MAX_UPLOAD_BYTES', 12 * 1024 * 1024);
define('RTZ_KEEP_BACKUPS', 40);

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

function rtz_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function rtz_fail(string $message, int $status = 400): void
{
    rtz_json(['ok' => false, 'error' => $message], $status);
}

function rtz_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function rtz_body(): array
{
    $raw = file_get_contents('php://input', false, null, 0, RTZ_MAX_CONTENT_BYTES + 1);
    if ($raw === false || strlen($raw) > RTZ_MAX_CONTENT_BYTES) {
        rtz_fail('Request too large', 413);
    }
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        rtz_fail('Invalid JSON');
    }
    return $data;
}

function rtz_ensure_data_dir(): void
{
    foreach ([RTZ_DATA_DIR, RTZ_DATA_DIR . '/backups', RTZ_DATA_DIR . '/ratelimit'] as $dir) {
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            rtz_fail('The server could not create the data folder. Check folder permissions.', 500);
        }
    }
    $ht = RTZ_DATA_DIR . '/.htaccess';
    if (!is_file($ht)) {
        @file_put_contents($ht, "Require all denied\nDeny from all\n");
    }
}

function rtz_path(string $name): string
{
    return RTZ_DATA_DIR . '/' . $name;
}

/** Reads a JSON file, returning $default when it does not exist yet. */
function rtz_read(string $name, $default = null)
{
    $file = rtz_path($name);
    if (!is_file($file)) {
        return $default;
    }
    $fp = fopen($file, 'rb');
    if (!$fp) {
        return $default;
    }
    flock($fp, LOCK_SH);
    $raw = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode((string) $raw, true);
    return $data === null ? $default : $data;
}

/** Writes JSON atomically (temp file + rename) so a crash never leaves half a file. */
function rtz_write(string $name, $data): void
{
    rtz_ensure_data_dir();
    $file = rtz_path($name);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        rtz_fail('Could not encode data', 500);
    }
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false || !rename($tmp, $file)) {
        @unlink($tmp);
        rtz_fail('The server could not save. Check that the data folder is writable.', 500);
    }
}

/** Runs $fn on a JSON file under an exclusive lock and writes back what it returns. */
function rtz_update(string $name, callable $fn, $default = [])
{
    rtz_ensure_data_dir();
    $file = rtz_path($name);
    $fp = fopen($file, 'c+b');
    if (!$fp) {
        rtz_fail('The server could not open its data file.', 500);
    }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $data = $raw ? json_decode($raw, true) : null;
    if (!is_array($data)) {
        $data = $default;
    }
    $result = $fn($data);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, (string) json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $result;
}

function rtz_client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/** Simple file-based rate limit: at most $max hits per $window seconds per IP and bucket. */
function rtz_rate_limit(string $bucket, int $max, int $window): bool
{
    rtz_ensure_data_dir();
    $key = hash('sha256', $bucket . '|' . rtz_client_ip());
    $file = RTZ_DATA_DIR . '/ratelimit/' . $key . '.json';
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = json_decode((string) file_get_contents($file), true) ?: [];
    }
    $hits = array_values(array_filter($hits, function ($t) use ($now, $window) {
        return is_int($t) && $t > $now - $window;
    }));
    if (count($hits) >= $max) {
        return false;
    }
    $hits[] = $now;
    file_put_contents($file, json_encode($hits), LOCK_EX);
    return true;
}

// ---------- sessions & authentication ----------

function rtz_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('rtz_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
    // Sign out after 12 hours of inactivity.
    if (!empty($_SESSION['rtz_seen']) && time() - (int) $_SESSION['rtz_seen'] > 12 * 3600) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    $_SESSION['rtz_seen'] = time();
    if (empty($_SESSION['rtz_csrf'])) {
        $_SESSION['rtz_csrf'] = bin2hex(random_bytes(32));
    }
}

function rtz_admin(): ?array
{
    return rtz_read('admin.json', null);
}

function rtz_logged_in(): bool
{
    rtz_session();
    return !empty($_SESSION['rtz_user']);
}

/** Requires a signed-in admin, plus a valid CSRF token for anything that changes data. */
function rtz_require_auth(): void
{
    if (!rtz_logged_in()) {
        rtz_fail('Please sign in again.', 401);
    }
    if (rtz_method() !== 'GET') {
        $sent = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        if (!hash_equals((string) $_SESSION['rtz_csrf'], $sent)) {
            rtz_fail('Security check failed. Reload the dashboard and try again.', 403);
        }
    }
}

function rtz_clean(string $value, int $max): string
{
    $value = str_replace("\0", '', $value);
    if (function_exists('mb_substr')) {
        return trim(mb_substr($value, 0, $max));
    }
    return trim(substr($value, 0, $max));
}
