<?php
declare(strict_types=1);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = getenv('APP_ORIGIN') ?: 'http://localhost:5173';
if ($origin !== '' && hash_equals($allowedOrigin, $origin)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
  header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
  header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
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
