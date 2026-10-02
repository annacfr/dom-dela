<?php
declare(strict_types=1);
if ($path === 'api/register' && $method === 'POST') {
  $data = body(); $name = required($data, 'name', 80); $password = required($data, 'password', 200);
  if (mb_strlen($name) < 2 || strlen($password) < 8 || !in_array($data['role'] ?? '', ['adult','child'], true)) fail('Проверьте имя, роль и пароль.');
  if (one('SELECT id FROM users WHERE name=?', [$name])) fail('Имя уже занято.', 409);
  run('INSERT INTO users(name,password_hash,role,avatar) VALUES(?,?,?,?)', [$name,password_hash($password, PASSWORD_DEFAULT),$data['role'],mb_substr($name,0,1)]);
  session_regenerate_id(true); $_SESSION['user_id'] = (int)db()->lastInsertId(); $_SESSION['csrf'] = bin2hex(random_bytes(24)); answer(['user_id' => $_SESSION['user_id'], 'csrf' => $_SESSION['csrf']], 201);
}
if ($path === 'api/login' && $method === 'POST') {
  $data = body(); $user = one('SELECT id,password_hash FROM users WHERE name=?', [required($data,'name',80)]);
  if (!$user || !password_verify((string)($data['password'] ?? ''), $user['password_hash'])) fail('Неверное имя или пароль.', 401);
  session_regenerate_id(true); $_SESSION['user_id'] = (int)$user['id']; $_SESSION['csrf'] = bin2hex(random_bytes(24)); answer(['user_id' => $_SESSION['user_id'], 'csrf' => $_SESSION['csrf']]);
}
if ($path === 'api/logout' && $method === 'POST') { $_SESSION = []; session_destroy(); answer(['ok' => true]); }
if ($path === 'api/auth/me' && $method === 'GET') {
  $user = one('SELECT u.id,u.name,u.role,u.avatar,fm.family_id FROM users u LEFT JOIN family_members fm ON fm.user_id=u.id WHERE u.id=?', [auth()]);
  $_SESSION['csrf'] ??= bin2hex(random_bytes(24)); answer(['user' => $user, 'csrf' => $_SESSION['csrf']]);
}
fail('Маршрут не найден.', 404);
