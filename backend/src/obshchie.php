<?php
declare(strict_types=1);
$uid = auth(); $fid = family();
if ($path === 'api/messages' && $method === 'GET') answer(many('SELECT m.*,u.name,u.avatar FROM messages m LEFT JOIN users u ON u.id=m.user_id WHERE m.family_id=? ORDER BY m.id',[$fid]));
if ($path === 'api/messages' && $method === 'POST') { $data=body(); $text=required($data,'text',1000); run('INSERT INTO messages(family_id,user_id,body) VALUES(?,?,?)',[$fid,$uid,$text]); notice($fid,'chat','Новое сообщение в семейном чате'); answer(['id'=>(int)db()->lastInsertId()],201); }
if ($path === 'api/events' && $method === 'GET') answer(many('SELECT * FROM events WHERE family_id=? ORDER BY event_date,event_time',[$fid]));
if ($path === 'api/events' && $method === 'POST') {
  $data=body(); $title=required($data,'title',120); $date=required($data,'date',10); $time=required($data,'time',5); $type=required($data,'type',20);
  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date) || !preg_match('/^\d{2}:\d{2}$/',$time) || !in_array($type,['birthday','meeting','walk','trip','other'],true)) fail('Проверьте событие.');
  $member=isset($data['member_id']) ? (int)$data['member_id'] : null;
  if ($member && !one('SELECT 1 FROM family_members WHERE family_id=? AND user_id=?',[$fid,$member])) fail('Участник не в семье.');
  run('INSERT INTO events(family_id,creator_id,member_id,title,event_date,event_time,event_type) VALUES(?,?,?,?,?,?,?)',[$fid,$uid,$member,$title,$date,$time,$type]); answer(['id'=>(int)db()->lastInsertId()],201);
}
if ($path === 'api/notifications' && $method === 'GET') answer(many('SELECT * FROM notifications WHERE family_id=? AND (user_id IS NULL OR user_id=?) ORDER BY id DESC',[$fid,$uid]));
if ($path === 'api/notifications/read' && $method === 'POST') { run('UPDATE notifications SET is_read=1 WHERE family_id=? AND (user_id IS NULL OR user_id=?)',[$fid,$uid]); answer(['ok'=>true]); }
if ($path === 'api/history' && $method === 'GET') answer(many('SELECT * FROM task_history WHERE family_id=? AND archived=0 ORDER BY id DESC',[$fid]));
if (preg_match('~^api/history/(\d+)/archive$~',$path,$m) && $method === 'POST') { run('UPDATE task_history SET archived=1 WHERE id=? AND family_id=?',[(int)$m[1],$fid]); answer(['ok'=>true]); }
fail('Маршрут не найден.',404);
