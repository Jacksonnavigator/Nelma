<?php
// Image library (admin only).
//   GET              → list uploaded images
//   POST (multipart) → upload an image, field name "file"
//   POST ?delete=URL → delete an uploaded image
require __DIR__ . '/_lib.php';

rtz_require_auth();

$allowed = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

function rtz_list_uploads(): array
{
    $out = [];
    if (!is_dir(RTZ_UPLOAD_DIR)) {
        return $out;
    }
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(RTZ_UPLOAD_DIR, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if (!$file->isFile() || !preg_match('/\.(jpe?g|png|webp|gif)$/i', $file->getFilename())) {
            continue;
        }
        $rel = substr($file->getPathname(), strlen(RTZ_UPLOAD_DIR));
        $out[] = [
            'url' => RTZ_UPLOAD_URL . str_replace('\\', '/', $rel),
            'name' => $file->getFilename(),
            'size' => $file->getSize(),
            'time' => $file->getMTime(),
        ];
    }
    usort($out, function ($a, $b) {
        return $b['time'] <=> $a['time'];
    });
    return $out;
}

if (rtz_method() === 'GET') {
    rtz_json(['ok' => true, 'files' => rtz_list_uploads()]);
}

if (rtz_method() !== 'POST') {
    rtz_fail('Method not allowed', 405);
}

if (isset($_GET['delete'])) {
    $url = (string) $_GET['delete'];
    $rel = substr($url, strlen(RTZ_UPLOAD_URL));
    if (strpos($url, RTZ_UPLOAD_URL . '/') !== 0 || strpos($rel, '..') !== false) {
        rtz_fail('Not an uploaded image.');
    }
    $path = realpath(RTZ_UPLOAD_DIR . $rel);
    $root = realpath(RTZ_UPLOAD_DIR);
    if (!$path || !$root || strpos($path, $root . DIRECTORY_SEPARATOR) !== 0 || !is_file($path)) {
        rtz_fail('Image not found.', 404);
    }
    unlink($path);
    rtz_json(['ok' => true]);
}

if (empty($_FILES['file']) || !is_array($_FILES['file'])) {
    rtz_fail('No file received. The image may be larger than the server allows.');
}
$f = $_FILES['file'];
if ((int) $f['error'] !== UPLOAD_ERR_OK) {
    rtz_fail($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE ? 'This image is too large for the server.' : 'The upload failed. Please try again.');
}
if ((int) $f['size'] > RTZ_MAX_UPLOAD_BYTES) {
    rtz_fail('Images can be at most 12 MB.');
}
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string) $finfo->file($f['tmp_name']);
if (!isset($allowed[$mime]) || @getimagesize($f['tmp_name']) === false) {
    rtz_fail('Only JPG, PNG, WebP or GIF images can be uploaded.');
}

$sub = date('Y/m');
$dir = RTZ_UPLOAD_DIR . '/' . $sub;
if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
    rtz_fail('The server could not create the uploads folder.', 500);
}
$base = strtolower(pathinfo((string) $f['name'], PATHINFO_FILENAME));
$base = trim((string) preg_replace('/[^a-z0-9]+/', '-', $base), '-');
$base = substr($base !== '' ? $base : 'image', 0, 50);
$name = $base . '-' . bin2hex(random_bytes(3)) . '.' . $allowed[$mime];
if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) {
    rtz_fail('The server could not store the image.', 500);
}
@chmod("$dir/$name", 0644);
rtz_json(['ok' => true, 'url' => RTZ_UPLOAD_URL . "/$sub/$name", 'name' => $name]);
