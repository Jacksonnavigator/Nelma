<?php
// Public form endpoint: trip planner, contact form and newsletter.
// Stores every message in the admin inbox and emails the team.
require __DIR__ . '/_lib.php';

if (rtz_method() !== 'POST') {
    rtz_fail('Method not allowed', 405);
}

$body = rtz_body();

// Bots fill in the hidden "website" field; quietly accept and drop.
if (!empty($body['website'])) {
    rtz_json(['ok' => true]);
}
if (!rtz_rate_limit('submit', 12, 3600)) {
    rtz_fail('Too many messages from your connection. Please try again later or contact us on WhatsApp.', 429);
}

$kinds = ['trip' => 'Trip request', 'contact' => 'Contact message', 'newsletter' => 'Newsletter sign-up'];
$kind = (string) ($body['kind'] ?? 'contact');
if (!isset($kinds[$kind])) {
    $kind = 'contact';
}
$subject = rtz_clean((string) ($body['subject'] ?? $kinds[$kind]), 200);
$fields = [];
foreach ((array) ($body['fields'] ?? []) as $k => $v) {
    if (count($fields) >= 40) {
        break;
    }
    $fields[rtz_clean((string) $k, 60)] = rtz_clean(is_scalar($v) ? (string) $v : '', 5000);
}
$email = $fields['Email'] ?? '';
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    rtz_fail('Please enter a valid email address.');
}
if ($email === '' && ($fields['Phone'] ?? '') === '') {
    rtz_fail('Please give us an email address or phone number so we can reply.');
}

$entry = [
    'id' => bin2hex(random_bytes(8)),
    'time' => gmdate('c'),
    'kind' => $kind,
    'subject' => $subject,
    'fields' => $fields,
    'read' => false,
];
rtz_update('submissions.json', function (array $list) use ($entry) {
    array_unshift($list, $entry);
    return array_slice($list, 0, 5000);
});

// Email the team. The address comes from Settings in the dashboard.
$saved = rtz_read('content.json', null);
$to = $saved['content']['settings']['notifyEmail'] ?? ($saved['content']['settings']['email'] ?? 'info@realtzdiscovery.co.tz');
$host = preg_replace('/^www\./', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
$host = preg_replace('/[^a-z0-9.\-]/i', '', $host);
$lines = [];
foreach ($fields as $k => $v) {
    if ($v !== '') {
        $lines[] = "$k: $v";
    }
}
$text = $subject . "\n\n" . implode("\n", $lines) . "\n\n— Sent from the website. Also saved in the dashboard inbox.";
$headers = [
    'From: Website <noreply@' . $host . '>',
    'Content-Type: text/plain; charset=UTF-8',
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . str_replace(["\r", "\n"], '', $email);
}
$mailed = false;
if (function_exists('mail') && filter_var($to, FILTER_VALIDATE_EMAIL)) {
    $mailed = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $text, implode("\r\n", $headers));
}

rtz_json(['ok' => true, 'mailed' => $mailed]);
