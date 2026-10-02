<?php
declare(strict_types=1);
function task_for_family(int $id, int $family): array { $task = one('SELECT * FROM tasks WHERE id=? AND family_id=?', [$id,$family]); if (!$task) fail('Задача не найдена.',404); return $task; }
function task_input(array $data, int $family): array {
  $title = required($data,'title',120); $category = required($data,'category',50); $date = required($data,'date',10); $time = required($data,'time',5); $deadline = required($data,'deadline',16);
  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date) || !preg_match('/^\d{2}:\d{2}$/',$time) || strtotime($deadline) === false || substr($deadline,0,10) < $date) fail('Проверьте даты.');
  $mode = required($data,'assignee_mode',10); if (!in_array($mode,['members','all','open'],true)) fail('Некорректный исполнитель.');
  $points = (int)($data['points'] ?? 10); if ($points < 1 || $points > 500) fail('Баллы: от 1 до 500.');
  $priority = (string)($data['priority'] ?? 'normal'); if (!in_array($priority,['low','normal','high'],true)) fail('Некорректный приоритет.');
  $assignees = $data['assignees'] ?? []; if (!is_array($assignees)) fail('Некорректные исполнители.');
  if (($data['repeat'] ?? 'none') === 'custom' && (!is_array($data['days'] ?? null) || !$data['days'] || count(array_filter($data['days'], fn($day) => is_numeric($day) && (int)$day >= 0 && (int)$day <= 6)) !== count($data['days']))) fail('Выберите дни повтора.');
  if ($mode === 'members') { if (!$assignees) fail('Выберите исполнителя.'); foreach ($assignees as $id) if (!one('SELECT 1 FROM family_members WHERE family_id=? AND user_id=?', [$family,(int)$id])) fail('Исполнитель не в семье.'); }
  return [$title,trim((string)($data['description'] ?? '')),$category,$date,$time,$deadline,$priority,(int)!empty($data['urgent']),$points,$mode,$assignees];
}
function expire_reservations(int $family): void {
  $expired = many("SELECT tr.id,tr.task_id FROM task_reservations tr JOIN tasks t ON t.id=tr.task_id WHERE t.family_id=? AND tr.outcome='active' AND tr.expires_at<NOW() AND t.status='reserved'", [$family]);
  foreach ($expired as $r) { run("UPDATE task_reservations SET outcome='expired',ended_at=NOW() WHERE id=?", [$r['id']]); run("UPDATE tasks SET status='active' WHERE id=? AND status='reserved'", [$r['task_id']]); log_event($family,(int)$r['task_id'],null,'reservation_expired','Резерв истёк'); notice($family,'released','Открытая задача снова доступна'); }
}
