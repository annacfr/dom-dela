<?php
declare(strict_types=1);
require_once __DIR__ . '/povtory.php';
$uid = auth(); $fid = family(); $taskId = (int)$m[1]; db()->beginTransaction();
$task = one('SELECT * FROM tasks WHERE id=? AND family_id=? FOR UPDATE',[$taskId,$fid]); if (!$task) fail('Задача не найдена.',404);
expire_reservations($fid); $task = task_for_family($taskId,$fid);
if ($m[2] === 'reserve') {
  if ($task['assignee_mode'] !== 'open' || $task['status'] !== 'active') fail('Задача сейчас недоступна.',409);
  run("INSERT INTO task_reservations(task_id,user_id,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 60 MINUTE))",[$taskId,$uid]); run("UPDATE tasks SET status='reserved' WHERE id=?",[$taskId]);
  log_event($fid,$taskId,$uid,'reserved','Задача зарезервирована на 60 минут'); db()->commit(); answer(['reserved_minutes'=>60]);
}
if ($m[2] === 'start') {
  if (!in_array($task['status'],['active','reserved'],true)) fail('Задача сейчас недоступна.',409);
  if ($task['assignee_mode'] === 'members' && !one('SELECT 1 FROM task_assignments WHERE task_id=? AND user_id=?',[$taskId,$uid])) fail('Вы не назначены на задачу.',403);
  if ($task['assignee_mode'] === 'open' && !one("SELECT 1 FROM task_reservations WHERE task_id=? AND user_id=? AND outcome='active' AND expires_at>NOW()",[$taskId,$uid])) fail('Сначала возьмите задачу.',403);
  if ($task['status'] === 'reserved' && !one("SELECT 1 FROM task_reservations WHERE task_id=? AND user_id=? AND outcome='active'",[$taskId,$uid])) fail('Задача занята.',409);
  run("UPDATE tasks SET status='doing',started_at=NOW(),started_by=? WHERE id=?",[$uid,$taskId]); log_event($fid,$taskId,$uid,'started','Выполнение начато'); db()->commit(); answer(['ok'=>true]);
}
if ($m[2] === 'complete') {
  if ($task['status'] !== 'doing' || (int)$task['started_by'] !== $uid) fail('Задача не начата вами.',409);
  $points = (int)$task['base_points'] + ((int)$task['urgent'] ? (int)ceil((int)$task['base_points'] * .2) : 0);
  run("UPDATE tasks SET status='done',completed_at=NOW(),completed_by=?,duration_minutes=GREATEST(1,TIMESTAMPDIFF(MINUTE,started_at,NOW())) WHERE id=?",[$uid,$taskId]);
  run("UPDATE task_reservations SET outcome='completed',ended_at=NOW() WHERE task_id=? AND outcome='active'",[$taskId]);
  run('INSERT INTO points_transactions(family_id,user_id,task_id,points) VALUES(?,?,?,?)',[$fid,$uid,$taskId,$points]);
  run('UPDATE house_progress SET completed_tasks=completed_tasks+1,garden_level=FLOOR((completed_tasks+1)/5) WHERE family_id=?',[$fid]);
  log_event($fid,$taskId,$uid,'completed','Задача выполнена'); log_event($fid,$taskId,$uid,'points','Начислено '.$points.' баллов');
  run('INSERT INTO messages(family_id,task_id,body) VALUES(?,?,?)',[$fid,$taskId,'Задача «'.$task['title'].'» выполнена']); next_task($task);
  db()->commit(); answer(['points'=>$points]);
}
fail('Маршрут не найден.',404);
