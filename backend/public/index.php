<?php
declare(strict_types=1);
function normalize_origin(string $value): string {
  $value = trim($value);
  $parts = parse_url($value);
  if (!$parts || empty($parts['scheme']) || empty($parts['host']) || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) return '';
  if (isset($parts['path']) && $parts['path'] !== '' && $parts['path'] !== '/') return '';
  $scheme = strtolower($parts['scheme']);
  if (!in_array($scheme, ['http', 'https'], true)) return '';
  $host = strtolower($parts['host']);
  $port = isset($parts['port']) ? ':' . $parts['port'] : '';
  return $scheme . '://' . $host . $port;
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$normalizedOrigin = normalize_origin($origin);
$configuredOrigins = getenv('APP_ORIGIN') ?: 'http://localhost:5173';
$allowedOrigins = array_values(array_filter(array_map('normalize_origin', explode(',', $configuredOrigins))));
$originAllowed = $normalizedOrigin !== '' && in_array($normalizedOrigin, $allowedOrigins, true);
if ($originAllowed) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
  header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
  header('Vary: Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  if (strtolower($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_PRIVATE_NETWORK'] ?? '') === 'true') {
    header('Access-Control-Allow-Private-Network: true');
  }
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  if ($origin !== '' && !$originAllowed) { http_response_code(403); exit; }
  $requestedMethod = strtoupper($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? '');
  if ($requestedMethod !== '' && !in_array($requestedMethod, ['GET', 'POST', 'PATCH', 'DELETE'], true)) { http_response_code(403); exit; }
  $requestedHeaders = array_filter(array_map('trim', explode(',', strtolower($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? ''))));
  if (array_diff($requestedHeaders, ['content-type', 'x-csrf-token'])) { http_response_code(403); exit; }
  http_response_code(204); exit;
}
ini_set('session.use_strict_mode', '1');
$sameSite = getenv('SESSION_SAMESITE') ?: 'Lax';
if (!in_array($sameSite, ['Lax','Strict','None'], true)) $sameSite = 'Lax';
$isHttps = !empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
session_set_cookie_params(['httponly' => true, 'samesite' => $sameSite, 'secure' => $isHttps || $sameSite === 'None']);
session_start();
require __DIR__ . '/../src/baza.php';
require __DIR__ . '/../src/otvet.php';
$path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/', '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && !in_array($path, ['api/register','api/login'], true)) {
  $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  if (!$token || !hash_equals($_SESSION['csrf'] ?? '', $token)) fail('Неверный защитный токен.', 403);
}
try {
  if (str_starts_with($path, 'api/auth') || in_array($path, ['api/register','api/login','api/logout','api/profile'], true)) require __DIR__ . '/../src/avtorizatsiya.php';
  if (str_starts_with($path, 'api/family')) require __DIR__ . '/../src/semya.php';
  if (str_starts_with($path, 'api/tasks')) require __DIR__ . '/../src/zadachi.php';
  if (str_starts_with($path, 'api/messages') || str_starts_with($path, 'api/events') || str_starts_with($path, 'api/notifications') || str_starts_with($path, 'api/history')) require __DIR__ . '/../src/obshchie.php';
  fail('Маршрут не найден.', 404);
} catch (PDOException $e) { error_log($e->getMessage()); fail('Ошибка базы данных.', 500); }
