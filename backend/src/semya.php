<?php
declare(strict_types=1);
if ($path === 'api/family' && $method === 'GET') {
  $fid = family(); $result = one('SELECT f.id,f.name,f.invite_code,fs.mood FROM families f LEFT JOIN family_state fs ON fs.family_id=f.id WHERE f.id=?', [$fid]);
  $result['members'] = many('SELECT u.id,u.name,u.role,u.avatar FROM users u JOIN family_members fm ON fm.user_id=u.id WHERE fm.family_id=?', [$fid]);
  $result['requests'] = many("SELECT jr.id,u.name,u.role,jr.created_at FROM join_requests jr JOIN users u ON u.id=jr.user_id WHERE jr.family_id=? AND jr.status='pending'", [$fid]); answer($result);
}
if ($path === 'api/family' && $method === 'POST') {
  $uid = adult(); if (one('SELECT 1 FROM family_members WHERE user_id=?', [$uid])) fail('Вы уже состоите в семье.');
  $data = body(); $name = required($data,'name',120); $code = 'DOM-' . strtoupper(bin2hex(random_bytes(4)));
  db()->beginTransaction(); run('INSERT INTO families(name,invite_code) VALUES(?,?)', [$name,$code]); $fid = (int)db()->lastInsertId();
  run('INSERT INTO family_members(family_id,user_id) VALUES(?,?)', [$fid,$uid]); run('INSERT INTO family_state(family_id,updated_by) VALUES(?,?)', [$fid,$uid]); run('INSERT INTO house_progress(family_id) VALUES(?)', [$fid]); db()->commit(); answer(['family_id'=>$fid,'invite_code'=>$code],201);
}
if ($path === 'api/family/join' && $method === 'POST') {
  $uid = auth(); if (one('SELECT 1 FROM family_members WHERE user_id=?', [$uid])) fail('Вы уже состоите в семье.');
  $data = body(); $found = one('SELECT id FROM families WHERE invite_code=?', [strtoupper(required($data,'code',20))]); if (!$found) fail('Код не найден.',404);
  $fid = (int)$found['id']; $role = one('SELECT role FROM users WHERE id=?', [$uid])['role'];
  if ($role === 'child') { run('INSERT INTO family_members(family_id,user_id) VALUES(?,?)', [$fid,$uid]); answer(['joined'=>true]); }
  if (one("SELECT id FROM join_requests WHERE family_id=? AND user_id=? AND status='pending'", [$fid,$uid])) fail('Запрос уже отправлен.',409);
  run('INSERT INTO join_requests(family_id,user_id) VALUES(?,?)', [$fid,$uid]); answer(['pending'=>true],202);
}
if (preg_match('~^api/family/requests/(\d+)/(accept|reject)$~', $path, $m) && $method === 'POST') {
  $uid = adult(); $fid = family(); $request = one("SELECT id,user_id FROM join_requests WHERE id=? AND family_id=? AND status='pending'", [(int)$m[1],$fid]); if (!$request) fail('Запрос не найден.',404);
  db()->beginTransaction(); if ($m[2] === 'accept') run('INSERT INTO family_members(family_id,user_id) VALUES(?,?)', [$fid,$request['user_id']]);
  run('UPDATE join_requests SET status=? WHERE id=?', [$m[2] === 'accept' ? 'accepted' : 'rejected',$request['id']]); log_event($fid,null,$uid,'join_request',$m[2] === 'accept' ? 'Участник принят в семью' : 'Запрос отклонён'); db()->commit(); answer(['ok'=>true]);
}
if ($path === 'api/family/mood' && $method === 'POST') {
  $uid = auth(); $fid = family(); $data = body(); $mood = required($data,'mood',20);
  if (!in_array($mood,['good','calm','tense','conflict','hard','recovery'],true)) fail('Неизвестное состояние.');
  run('UPDATE family_state SET mood=?,updated_by=? WHERE family_id=?', [$mood,$uid,$fid]); log_event($fid,null,$uid,'mood','Состояние семьи изменено'); answer(['mood'=>$mood]);
}
if ($path === 'api/family/name' && $method === 'POST') { adult(); $fid = family(); $data = body(); run('UPDATE families SET name=? WHERE id=?', [required($data,'name',120),$fid]); answer(['ok'=>true]); }
fail('Маршрут не найден.',404);
