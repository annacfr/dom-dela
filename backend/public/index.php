<?php
declare(strict_types=1);
ini_set('session.use_strict_mode', '1');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS'])]);
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
  if (str_starts_with($path, 'api/auth') || in_array($path, ['api/register','api/login','api/logout'], true)) require __DIR__ . '/../src/avtorizatsiya.php';
  if (str_starts_with($path, 'api/family')) require __DIR__ . '/../src/semya.php';
  if (str_starts_with($path, 'api/tasks')) require __DIR__ . '/../src/zadachi.php';
  if (str_starts_with($path, 'api/messages') || str_starts_with($path, 'api/events') || str_starts_with($path, 'api/notifications') || str_starts_with($path, 'api/history')) require __DIR__ . '/../src/obshchie.php';
  fail('Маршрут не найден.', 404);
} catch (PDOException $e) { error_log($e->getMessage()); fail('Ошибка базы данных.', 500); }
