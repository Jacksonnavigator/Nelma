<?php
// Admin inbox for form submissions.
//   GET                                   → all messages
//   POST {action: read|unread|delete, ids} → update messages
require __DIR__ . '/_lib.php';

rtz_require_auth();

if (rtz_method() === 'GET') {
    rtz_json(['ok' => true, 'items' => rtz_read('submissions.json', [])]);
}

$body = rtz_body();
$ids = array_map('strval', (array) ($body['ids'] ?? []));
$action = (string) ($body['action'] ?? '');
if (!$ids || !in_array($action, ['read', 'unread', 'delete'], true)) {
    rtz_fail('Nothing to do.');
}

$items = rtz_update('submissions.json', function (array $list) use ($ids, $action) {
    if ($action === 'delete') {
        return array_values(array_filter($list, function ($i) use ($ids) {
            return !in_array($i['id'] ?? '', $ids, true);
        }));
    }
    foreach ($list as &$i) {
        if (in_array($i['id'] ?? '', $ids, true)) {
            $i['read'] = $action === 'read';
        }
    }
    return $list;
});
rtz_json(['ok' => true, 'items' => $items]);
