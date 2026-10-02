<?php
declare(strict_types=1);
function answer(mixed $data, int $status = 200): never { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); exit; }
function fail(string $message, int $status = 400): never { answer(['error' => $message], $status); }
function body(): array { $data = json_decode(file_get_contents('php://input') ?: '', true); if (!is_array($data)) fail('Некорректный JSON.'); return $data; }
function required(array $data, string $key, int $max = 255): string { $value = trim((string)($data[$key] ?? '')); if ($value === '' || mb_strlen($value) > $max) fail("Проверьте поле $key."); return $value; }
function auth(): int { $id = $_SESSION['user_id'] ?? null; if (!is_int($id)) fail('Нужен вход в аккаунт.', 401); return $id; }
function family(): int { $id = auth(); $member = one('SELECT family_id FROM family_members WHERE user_id=?', [$id]); if (!$member) fail('Вы не состоите в семье.', 403); return (int)$member['family_id']; }
function adult(): int { $id = auth(); $user = one('SELECT role FROM users WHERE id=?', [$id]); if (!$user || $user['role'] !== 'adult') fail('Действие доступно взрослому.', 403); return $id; }
function log_event(int $family, ?int $task, ?int $user, string $type, string $text): void { run('INSERT INTO task_history(family_id,task_id,user_id,event_type,body) VALUES(?,?,?,?,?)', [$family,$task,$user,$type,$text]); }
function notice(int $family, string $type, string $text): void { run('INSERT INTO notifications(family_id,type,body) VALUES(?,?,?)', [$family,$type,$text]); }
