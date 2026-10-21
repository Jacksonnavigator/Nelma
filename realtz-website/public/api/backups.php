<?php
// Earlier versions of the website content (admin only).
//   GET                         → list saved versions
//   GET ?file=NAME              → one version's content (for preview)
//   POST {action: restore, file} → make that version live again
require __DIR__ . '/_lib.php';

rtz_require_auth();

function rtz_backup_path(string $name): string
{
    if (!preg_match('/^content-[0-9_\-]+\.json$/', $name)) {
        rtz_fail('Unknown version.', 404);
    }
    $path = RTZ_DATA_DIR . '/backups/' . $name;
    if (!is_file($path)) {
        rtz_fail('Unknown version.', 404);
    }
    return $path;
}

if (rtz_method() === 'GET') {
    if (isset($_GET['file'])) {
        $data = json_decode((string) file_get_contents(rtz_backup_path((string) $_GET['file'])), true);
        rtz_json(['ok' => true, 'content' => $data['content'] ?? null]);
    }
    $out = [];
    foreach (glob(RTZ_DATA_DIR . '/backups/content-*.json') ?: [] as $f) {
        $data = json_decode((string) file_get_contents($f), true);
        $out[] = [
            'file' => basename($f),
            'updated' => $data['updated'] ?? null,
            'by' => $data['by'] ?? null,
            'note' => $data['note'] ?? '',
            'size' => filesize($f),
        ];
    }
    usort($out, function ($a, $b) {
        return strcmp((string) $b['file'], (string) $a['file']);
    });
    rtz_json(['ok' => true, 'items' => $out]);
}

$body = rtz_body();
if (($body['action'] ?? '') !== 'restore') {
    rtz_fail('Nothing to do.');
}
$path = rtz_backup_path((string) ($body['file'] ?? ''));
$old = json_decode((string) file_get_contents($path), true);
if (!is_array($old) || !isset($old['content'])) {
    rtz_fail('That version is damaged and cannot be restored.', 500);
}
if (is_file(rtz_path('content.json'))) {
    @copy(rtz_path('content.json'), RTZ_DATA_DIR . '/backups/content-' . date('Y-m-d_His') . '.json');
}
$record = [
    'updated' => gmdate('c'),
    'by' => $_SESSION['rtz_user'],
    'note' => 'Restored version from ' . ($old['updated'] ?? basename($path)),
    'content' => $old['content'],
];
rtz_write('content.json', $record);
rtz_json(['ok' => true, 'updated' => $record['updated']]);
