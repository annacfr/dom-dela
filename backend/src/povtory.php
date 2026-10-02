<?php
declare(strict_types=1);
function next_task(array $task): void {
  $root = (int)($task['parent_id'] ?: $task['id']); $rule = one('SELECT * FROM recurring_tasks WHERE task_id=? AND active=1',[$root]); if (!$rule) return;
  $date = new DateTimeImmutable($task['task_date']); $days = array_map('intval',explode(',',$rule['week_days'] ?: '')); if ($rule['frequency'] === 'custom' && !$rule['week_days']) return;
  do { $date = $date->modify($rule['frequency'] === 'weekly' ? '+7 days' : '+1 day'); } while ($rule['frequency'] === 'weekdays' && in_array((int)$date->format('w'),[0,6],true) || $rule['frequency'] === 'custom' && !in_array((int)$date->format('w'),$days,true));
  $old = new DateTimeImmutable($task['task_date']); $due = new DateTimeImmutable($task['deadline']); $newDue = $date->setTime((int)$due->format('H'),(int)$due->format('i'))->modify('+' . $old->diff($due)->days . ' days');
  run('INSERT INTO tasks(family_id,creator_id,title,description,category,task_date,task_time,deadline,priority,urgent,base_points,assignee_mode,parent_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',[$task['family_id'],$task['creator_id'],$task['title'],$task['description'],$task['category'],$date->format('Y-m-d'),$task['task_time'],$newDue->format('Y-m-d H:i:s'),$task['priority'],$task['urgent'],$task['base_points'],$task['assignee_mode'],$root]);
  $newId = (int)db()->lastInsertId(); $rotation = many('SELECT user_id FROM duty_rotations WHERE recurring_task_id=? ORDER BY position',[$rule['id']]);
  if ($rotation) { $current = one('SELECT user_id FROM task_assignments WHERE task_id=? LIMIT 1',[$task['id']]); $ids = array_column($rotation,'user_id'); $index = array_search($current['user_id'] ?? null,$ids); $next = $ids[((int)$index + 1) % count($ids)]; run('INSERT INTO task_assignments(task_id,user_id) VALUES(?,?)',[$newId,$next]); }
  else foreach (many('SELECT user_id FROM task_assignments WHERE task_id=?',[$task['id']]) as $member) run('INSERT INTO task_assignments(task_id,user_id) VALUES(?,?)',[$newId,$member['user_id']]);
  run('UPDATE recurring_tasks SET next_date=? WHERE id=?',[$date->format('Y-m-d'),$rule['id']]);
}
