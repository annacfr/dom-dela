<?php
declare(strict_types=1);
require_once __DIR__ . '/proverkiZadachi.php';
if ($path === 'api/tasks' && $method === 'GET') {
  $fid = family(); expire_reservations($fid);
  answer(many('SELECT t.*,GROUP_CONCAT(ta.user_id) AS assignees FROM tasks t LEFT JOIN task_assignments ta ON ta.task_id=t.id WHERE t.family_id=? GROUP BY t.id ORDER BY t.task_date,t.task_time', [$fid]));
}
if ($path === 'api/tasks' && $method === 'POST') {
  $uid = adult(); $fid = family(); $data = body(); [$title,$description,$category,$date,$time,$deadline,$priority,$urgent,$points,$mode,$assignees] = task_input($data,$fid);
  db()->beginTransaction(); run('INSERT INTO tasks(family_id,creator_id,title,description,category,task_date,task_time,deadline,priority,urgent,base_points,assignee_mode) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', [$fid,$uid,$title,$description,$category,$date,$time,$deadline,$priority,$urgent,$points,$mode]); $id = (int)db()->lastInsertId();
  if ($mode === 'members') foreach ($assignees as $member) run('INSERT INTO task_assignments(task_id,user_id) VALUES(?,?)', [$id,(int)$member]);
  if (in_array($data['repeat'] ?? 'none',['daily','weekly','weekdays','custom'],true)) { run('INSERT INTO recurring_tasks(task_id,frequency,week_days,next_date) VALUES(?,?,?,?)', [$id,$data['repeat'],implode(',',array_map('intval',$data['days'] ?? [])),$date]); if (!empty($data['rotate']) && $mode === 'members') { $rid = (int)db()->lastInsertId(); $all = many('SELECT user_id FROM family_members WHERE family_id=? ORDER BY joined_at,user_id',[$fid]); foreach ($all as $position => $member) run('INSERT INTO duty_rotations(recurring_task_id,user_id,position) VALUES(?,?,?)',[$rid,$member['user_id'],$position]); } }
  log_event($fid,$id,$uid,'created','Задача создана: '.$title); notice($fid,'assigned','Новая задача: '.$title); db()->commit(); answer(['id'=>$id],201);
}
if (preg_match('~^api/tasks/(\d+)/(reserve|start|complete)$~', $path, $m) && $method === 'POST') require __DIR__ . '/deystviya.php';
if (preg_match('~^api/tasks/(\d+)$~', $path, $m)) {
  $uid = auth(); $fid = family(); $task = task_for_family((int)$m[1],$fid);
  if ($method === 'GET') answer(['task'=>$task,'assignments'=>many('SELECT user_id FROM task_assignments WHERE task_id=?',[$task['id']]),'history'=>many('SELECT * FROM task_history WHERE task_id=? ORDER BY id DESC',[$task['id']])]);
  if ($method === 'PATCH') {
    adult(); if ($task['status'] !== 'active') fail('Задачу сейчас нельзя менять.');
    $data = body(); [$title,$description,$category,$date,$time,$deadline,$priority,$urgent,$points,$mode,$assignees] = task_input($data,$fid);
    db()->beginTransaction(); run('UPDATE tasks SET title=?,description=?,category=?,task_date=?,task_time=?,deadline=?,priority=?,urgent=?,base_points=?,assignee_mode=? WHERE id=?', [$title,$description,$category,$date,$time,$deadline,$priority,$urgent,$points,$mode,$task['id']]);
    run('DELETE FROM task_assignments WHERE task_id=?',[$task['id']]); if ($mode === 'members') foreach ($assignees as $member) run('INSERT INTO task_assignments(task_id,user_id) VALUES(?,?)',[$task['id'],(int)$member]);
    log_event($fid,(int)$task['id'],$uid,'edited','Задача изменена: '.$title); notice($fid,'changed','Изменена задача: '.$title); db()->commit(); answer(['ok'=>true]);
  }
  if ($method === 'DELETE') { adult(); if ($task['status'] !== 'active') fail('Задачу сейчас нельзя архивировать.'); run("UPDATE tasks SET status='archived' WHERE id=?",[$task['id']]); log_event($fid,(int)$task['id'],$uid,'cancelled','Задача архивирована'); notice($fid,'cancelled','Задача отменена'); answer(['ok'=>true]); }
}
fail('Маршрут не найден.',404);
