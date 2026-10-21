<?php
// GET  /api/content.php           → the website's saved content (public)
// POST /api/content.php           → save new content (admin only); the previous
//                                    version is kept as a backup first.
require __DIR__ . '/_lib.php';

if (rtz_method() === 'GET') {
    $saved = rtz_read('content.json', null);
    rtz_json([
        'ok' => true,
        'content' => $saved['content'] ?? null,
        'updated' => $saved['updated'] ?? null,
        'by' => $saved['by'] ?? null,
    ]);
}

if (rtz_method() !== 'POST') {
    rtz_fail('Method not allowed', 405);
}

rtz_require_auth();
$body = rtz_body();
if (!isset($body['content']) || !is_array($body['content'])) {
    rtz_fail('Nothing to save.');
}

// Refuse to overwrite a newer version saved from another browser tab or device.
$current = rtz_read('content.json', null);
if ($current && isset($body['baseUpdated']) && $body['baseUpdated'] !== ($current['updated'] ?? null)) {
    rtz_fail('Someone saved changes after you opened the dashboard. Reload to get the latest version, then make your change again.', 409);
}

rtz_ensure_data_dir();
if ($current) {
    $stamp = date('Y-m-d_His');
    @copy(rtz_path('content.json'), RTZ_DATA_DIR . "/backups/content-$stamp.json");
    $files = glob(RTZ_DATA_DIR . '/backups/content-*.json') ?: [];
    rsort($files);
    foreach (array_slice($files, RTZ_KEEP_BACKUPS) as $old) {
        @unlink($old);
    }
}

$record = [
    'updated' => gmdate('c'),
    'by' => $_SESSION['rtz_user'],
    'note' => rtz_clean((string) ($body['note'] ?? ''), 200),
    'content' => $body['content'],
];
rtz_write('content.json', $record);
rtz_json(['ok' => true, 'updated' => $record['updated']]);
