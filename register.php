<?php
// register.php - registration endpoint for the prize draw.
// Accepts POST {"email", "score", "total", "quiz"} as JSON.
// One entry per e-mail address (and quiz): 200 ok, 409 duplicate, 400 invalid, 405 wrong method.

// Only addresses at these domains may enter. Leave empty to allow any domain.
const ALLOWED_DOMAINS = [];       // e.g. ['example.com']
const DB_FILE = __DIR__ . '/data/prizedraw.sqlite';

header('Content-Type: application/json');
header('Cache-Control: no-store');

function respond(int $status, string $result): void {
    http_response_code($status);
    echo json_encode(['result' => $result]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, 'method_not_allowed');
}

$input = json_decode(file_get_contents('php://input', false, null, 0, 4096), true);
if (!is_array($input)) {
    respond(400, 'invalid');
}

$email = strtolower(trim((string)($input['email'] ?? '')));
$quiz  = substr(preg_replace('/[^A-Za-z0-9._-]/', '', (string)($input['quiz'] ?? '')), 0, 100);
$score = filter_var($input['score'] ?? null, FILTER_VALIDATE_INT);
$total = filter_var($input['total'] ?? null, FILTER_VALIDATE_INT);

if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, 'invalid');
}
if ($score === false || $total === false || $total < 1 || $total > 1000 || $score < 0 || $score > $total) {
    respond(400, 'invalid');
}
if (ALLOWED_DOMAINS) {
    $domain = substr(strrchr($email, '@'), 1);
    if (!in_array($domain, array_map('strtolower', ALLOWED_DOMAINS), true)) {
        respond(400, 'invalid');
    }
}

try {
    $db = new PDO('sqlite:' . DB_FILE);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        quiz TEXT NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (email, quiz)
    )');

    $stmt = $db->prepare('INSERT OR IGNORE INTO entries (email, quiz, score, total) VALUES (?, ?, ?, ?)');
    $stmt->execute([$email, $quiz, $score, $total]);

    respond($stmt->rowCount() === 1 ? 200 : 409, $stmt->rowCount() === 1 ? 'ok' : 'duplicate');
} catch (Throwable $e) {
    error_log('register.php: ' . $e->getMessage());
    respond(500, 'error');
}
