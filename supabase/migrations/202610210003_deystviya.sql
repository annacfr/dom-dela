create function dom_dela_vnutri.clean_task(raw jsonb, fid uuid, tid uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare ass jsonb := raw->'assignees'; n integer;
begin
  if ass is null then raise exception 'Укажите исполнителя'; end if;
  if raw->>'date' is null or raw->>'time' is null or raw->>'deadline' is null then raise exception 'Укажите дату и срок'; end if;
  if char_length(trim(coalesce(raw->>'title',''))) not between 2 and 120
    or char_length(coalesce(raw->>'description','')) > 2000
    or char_length(coalesce(raw->>'category','')) not between 1 and 50
    or coalesce(raw->>'repeat','') not in ('none','daily','weekly','weekdays','custom')
    or coalesce(raw->>'priority','') not in ('Низкий','Обычный','Высокий')
    or coalesce((raw->>'points')::integer,0) not between 1 and 1000 then
    raise exception 'Проверьте поля задачи';
  end if;
  perform (raw->>'date')::date;
  perform (raw->>'time')::time;
  perform (raw->>'deadline')::timestamp;
  if jsonb_typeof(coalesce(raw->'days','[]'::jsonb)) <> 'array' then raise exception 'Неверные дни повтора'; end if;
  if exists(select 1 from jsonb_array_elements_text(coalesce(raw->'days','[]'::jsonb)) d
    where d::integer not between 0 and 6) then raise exception 'Неверные дни повтора'; end if;
  if (raw->>'deadline')::date < (raw->>'date')::date then raise exception 'Срок раньше даты задачи'; end if;
  if jsonb_typeof(ass) = 'array' then
    select count(*) into n from jsonb_array_elements_text(ass) x
      where not exists(select 1 from public.profiles p where p.id = x::uuid and p.family_id = fid);
    if n > 0 or jsonb_array_length(ass) = 0 then raise exception 'Исполнитель не состоит в семье'; end if;
  elsif ass not in ('"all"'::jsonb,'"open"'::jsonb) then raise exception 'Укажите исполнителя'; end if;
  return jsonb_build_object('id',tid,'familyId',fid,'title',trim(raw->>'title'),
    'description',coalesce(raw->>'description',''),'category',raw->>'category',
    'date',raw->>'date','time',raw->>'time','deadline',raw->>'deadline',
    'repeat',raw->>'repeat','days',coalesce(raw->'days','[]'::jsonb),
    'rotate',coalesce((raw->>'rotate')::boolean,false),'priority',raw->>'priority',
    'urgent',coalesce((raw->>'urgent')::boolean,false),'points',(raw->>'points')::integer,
    'assignees',ass,'status','active');
end $$;

create function dom_dela_vnutri.assign_task(tid uuid, fid uuid, ass jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.task_assignments where task_id = tid;
  if jsonb_typeof(ass) = 'array' then
    insert into public.task_assignments(task_id,user_id,family_id)
      select tid, value::uuid, fid from jsonb_array_elements_text(ass);
  end if;
end $$;

create function dom_dela_vnutri.next_task(old_body jsonb, fid uuid, creator uuid) returns void language plpgsql security definer set search_path = '' as $$
declare next_date date := (old_body->>'date')::date; freq text := old_body->>'repeat';
declare new_id uuid := gen_random_uuid(); new_ass jsonb := old_body->'assignees'; shift_days integer;
declare members uuid[]; current_pos integer; step integer := 0;
begin
  if freq = 'none' then return; end if;
  if freq = 'custom' and jsonb_array_length(coalesce(old_body->'days','[]'::jsonb)) = 0 then return; end if;
  next_date := next_date + case when freq = 'weekly' then 7 else 1 end;
  while (freq = 'weekdays' and extract(dow from next_date)::integer in (0,6))
    or (freq = 'custom' and not (old_body->'days') @> to_jsonb(extract(dow from next_date)::integer)) loop
    next_date := next_date + 1; step := step + 1;
    if step > 7 then raise exception 'Неверные дни повтора'; end if;
  end loop;
  if coalesce((old_body->>'rotate')::boolean,false) and jsonb_typeof(new_ass) = 'array' and jsonb_array_length(new_ass) = 1 then
    select array_agg(id order by created_at,id) into members from public.profiles where family_id = fid;
    if array_length(members,1) > 1 then
      select i into current_pos from generate_subscripts(members,1) i where members[i] = (new_ass->>0)::uuid;
      new_ass := to_jsonb(array[members[1 + (coalesce(current_pos,1) % array_length(members,1))]]);
    end if;
  end if;
  shift_days := next_date - (old_body->>'date')::date;
  insert into public.tasks(id,family_id,creator_id,body) values(new_id,fid,creator,
    (old_body - 'reservedBy' - 'reservedUntil' - 'startedAt' - 'completedAt' - 'completedBy' - 'duration') ||
    jsonb_build_object('id',new_id,'date',next_date::text,'deadline',
      to_char((old_body->>'deadline')::timestamp + make_interval(days => shift_days),'YYYY-MM-DD"T"HH24:MI'),
      'assignees',new_ass,'status','active','parentId',coalesce(old_body->>'parentId',old_body->>'id')));
  perform dom_dela_vnutri.assign_task(new_id,fid,new_ass);
end $$;

create function dom_dela_vnutri.apply_action(p_kind text, p_data jsonb) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_variable
declare me public.profiles; fid uuid; fam public.families; req public.join_requests; t public.tasks;
declare tid uuid; body jsonb; target uuid; points integer; duration integer; label text; member public.profiles;
begin
  if auth.uid() is null then raise exception 'Войдите в аккаунт'; end if;
  select * into me from public.profiles where id = auth.uid() for update;
  if not found then raise exception 'Профиль не найден'; end if;
  fid := me.family_id;
  if p_kind = 'family_create' then
    if me.role <> 'adult' or fid is not null then raise exception 'Создать семью может взрослый без семьи'; end if;
    if char_length(trim(coalesce(p_data->>'name',''))) not between 2 and 120 then raise exception 'Название слишком короткое'; end if;
    insert into public.families(name) values(trim(p_data->>'name')) returning * into fam;
    update public.profiles set family_id = fam.id where id = me.id;
    insert into public.family_state(family_id,updated_by) values(fam.id,me.id);
    insert into public.house_progress(family_id) values(fam.id);
    return jsonb_build_object('familyId',fam.id);
  elsif p_kind = 'family_join' then
    if fid is not null then raise exception 'Вы уже состоите в семье'; end if;
    select * into fam from public.families where code = upper(trim(p_data->>'code')) for update;
    if not found then raise exception 'Код семьи не найден'; end if;
    if me.role = 'child' then
      update public.profiles set family_id = fam.id where id = me.id;
    else
      insert into public.join_requests(family_id,user_id) values(fam.id,me.id);
    end if;
    return jsonb_build_object('familyId',fam.id);
  end if;
  if fid is null then raise exception 'Сначала присоединитесь к семье'; end if;
  if p_kind = 'request_decide' then
    if me.role <> 'adult' then raise exception 'Нужно подтверждение взрослого'; end if;
    select * into req from public.join_requests where id = (p_data->>'requestId')::uuid and family_id = fid and status = 'pending' for update;
    if not found then raise exception 'Запрос уже обработан'; end if;
    select * into member from public.profiles where id = req.user_id for update;
    if member.family_id is not null then raise exception 'Участник уже состоит в семье'; end if;
    update public.join_requests set status = case when (p_data->>'accept')::boolean then 'accepted' else 'rejected' end where id = req.id;
    if (p_data->>'accept')::boolean then update public.profiles set family_id = fid where id = req.user_id; end if;
    insert into public.task_history(family_id,user_id,event_type,body) values(fid,me.id,'joined','Запрос на вступление обработан');
  elsif p_kind = 'family_update' or p_kind = 'family_mood' then
    if p_kind = 'family_update' and me.role <> 'adult' then raise exception 'Настройки меняет взрослый'; end if;
    if p_kind = 'family_update' and char_length(trim(coalesce(p_data->>'name',''))) not between 2 and 120 then raise exception 'Проверьте название'; end if;
    if coalesce(p_data->>'mood','') not in ('Хорошо','Спокойно','Напряжённо','Конфликт','Тяжело','Восстановление') then raise exception 'Неизвестное состояние'; end if;
    update public.families set name = case when p_kind = 'family_update' then trim(p_data->>'name') else name end,
      mood = p_data->>'mood' where id = fid;
    update public.family_state set mood = p_data->>'mood', updated_by = me.id, updated_at = now() where family_id = fid;
    insert into public.task_history(family_id,user_id,event_type,body) values(fid,me.id,'mood',me.name || ' выбрал(а) состояние: ' || (p_data->>'mood'));
  elsif p_kind = 'profile' then
    if char_length(trim(coalesce(p_data->>'name',''))) not between 2 and 80 then raise exception 'Проверьте имя'; end if;
    update public.profiles set name = trim(p_data->>'name'), avatar = left(coalesce(nullif(p_data->>'avatar',''),left(p_data->>'name',1)),2) where id = me.id;
  elsif p_kind = 'settings' then
    update public.profiles set reminders = (p_data->>'reminders')::boolean where id = me.id;
  elsif p_kind = 'notifications_read' then
    update public.notifications set is_read = true where family_id = fid and user_id = me.id;
  elsif p_kind = 'history_archive' then
    update public.task_history set archived = true where id = (p_data->>'recordId')::uuid and family_id = fid;
  elsif p_kind = 'event_create' then
    body := p_data->'event';
    if char_length(trim(coalesce(body->>'title',''))) not between 2 and 120 then raise exception 'Проверьте событие'; end if;
    if body->>'date' is null or body->>'time' is null then raise exception 'Укажите дату события'; end if;
    perform (body->>'date')::date; perform (body->>'time')::time;
    if body->>'type' not in ('День рождения','Встреча','Прогулка','Поездка','Другое') then raise exception 'Неизвестный тип события'; end if;
    if body ? 'memberId' and not exists(select 1 from public.profiles where id = (body->>'memberId')::uuid and family_id = fid) then raise exception 'Участник не состоит в семье'; end if;
    tid := gen_random_uuid();
    insert into public.events(id,family_id,creator_id,body) values(tid,fid,me.id,
      jsonb_build_object('id',tid,'familyId',fid,'title',trim(body->>'title'),'date',body->>'date',
        'time',body->>'time','type',body->>'type','memberId',body->>'memberId'));
  elsif p_kind = 'message_send' then
    label := trim(coalesce(p_data->>'text',''));
    if char_length(label) not between 1 and 1000 then raise exception 'Сообщение пустое или слишком длинное'; end if;
    insert into public.messages(family_id,user_id,body) values(fid,me.id,label);
    insert into public.notifications(family_id,user_id,kind,body)
      select fid,id,'chat','Новое сообщение в семейном чате' from public.profiles where family_id = fid and id <> me.id;
  elsif p_kind like 'task_%' then
    perform dom_dela_vnutri.expire_reservations(fid);
    if p_kind in ('task_create','task_update','task_archive') and me.role <> 'adult' then raise exception 'Задачи создаёт и меняет взрослый'; end if;
    if p_kind = 'task_create' then
      tid := gen_random_uuid(); body := dom_dela_vnutri.clean_task(p_data->'task',fid,tid);
      insert into public.tasks(id,family_id,creator_id,body) values(tid,fid,me.id,body);
      perform dom_dela_vnutri.assign_task(tid,fid,body->'assignees');
      insert into public.task_history(family_id,task_id,user_id,event_type,body)
        values(fid,tid,me.id,'created','Создана задача «' || (body->>'title') || '»');
      insert into public.task_history(family_id,task_id,user_id,event_type,body)
        values(fid,tid,me.id,'assigned','Назначена задача «' || (body->>'title') || '»');
      insert into public.notifications(family_id,user_id,task_id,kind,body)
        select fid,id,tid,'assigned','Новая задача: ' || (body->>'title') from public.profiles where family_id = fid;
      return jsonb_build_object('taskId',tid);
    end if;
    tid := coalesce((p_data->>'taskId')::uuid,(p_data->'task'->>'id')::uuid);
    select * into t from public.tasks where id = tid and family_id = fid for update;
    if not found then raise exception 'Задача не найдена в вашей семье'; end if;
    body := t.body;
    if p_kind = 'task_update' then
      if body->>'status' <> 'active' then raise exception 'Задача уже в работе'; end if;
      body := dom_dela_vnutri.clean_task(p_data->'task',fid,tid);
      update public.tasks set body = body where id = tid;
      perform dom_dela_vnutri.assign_task(tid,fid,body->'assignees');
      label := 'Задача «' || (body->>'title') || '» изменена';
      insert into public.task_history(family_id,task_id,user_id,event_type,body) values(fid,tid,me.id,'edited',label);
      insert into public.notifications(family_id,user_id,task_id,kind,body)
        select fid,id,tid,'changed',label from public.profiles where family_id = fid;
    elsif p_kind = 'task_archive' then
      if body->>'status' <> 'active' then raise exception 'Можно архивировать только открытую задачу'; end if;
      update public.tasks set body = body || '{"status":"archived"}'::jsonb where id = tid;
      insert into public.task_history(family_id,task_id,user_id,event_type,body)
        values(fid,tid,me.id,'cancelled','Задача «' || (body->>'title') || '» архивирована');
      insert into public.notifications(family_id,user_id,task_id,kind,body)
        select fid,id,tid,'cancelled','Задача «' || (body->>'title') || '» отменена' from public.profiles where family_id = fid;
    elsif p_kind = 'task_reserve' then
      if body->>'status' <> 'active' or body->'assignees' <> '"open"'::jsonb then raise exception 'Задача уже занята'; end if;
      update public.tasks set body = body || jsonb_build_object('status','reserved','reservedBy',me.id,
        'reservedUntil',to_char(now() + interval '60 minutes','YYYY-MM-DD"T"HH24:MI:SS"Z"')) where id = tid;
      insert into public.task_reservations(family_id,task_id,user_id,expires_at) values(fid,tid,me.id,now() + interval '60 minutes');
      insert into public.task_history(family_id,task_id,user_id,event_type,body)
        values(fid,tid,me.id,'reserved',me.name || ' взял(а) задачу «' || (body->>'title') || '»');
    elsif p_kind = 'task_start' then
      if body->>'status' not in ('active','reserved') then raise exception 'Задача недоступна'; end if;
      if body->>'status' = 'reserved' and ((body->>'reservedBy')::uuid <> me.id or (body->>'reservedUntil')::timestamptz <= now()) then raise exception 'Резерв истёк'; end if;
      if body->>'status' = 'active' and body->'assignees' <> '"all"'::jsonb
        and not (jsonb_typeof(body->'assignees') = 'array' and body->'assignees' ? me.id::text) then raise exception 'Задача вам не назначена'; end if;
      update public.tasks set body = body || jsonb_build_object('status','doing','reservedBy',me.id,'startedAt',now()) where id = tid;
      insert into public.task_history(family_id,task_id,user_id,event_type,body)
        values(fid,tid,me.id,'started',me.name || ' начал(а) «' || (body->>'title') || '»');
    elsif p_kind = 'task_finish' then
      if body->>'status' <> 'doing' or (body->>'reservedBy')::uuid <> me.id then raise exception 'Задача не находится в вашей работе'; end if;
      points := (body->>'points')::integer + case when (body->>'urgent')::boolean then ceil((body->>'points')::numeric * 0.2)::integer else 0 end;
      duration := greatest(1,round(extract(epoch from (now() - (body->>'startedAt')::timestamptz)) / 60)::integer);
      update public.tasks set body = body || jsonb_build_object('status','done','completedBy',me.id,
        'completedAt',now(),'duration',duration) where id = tid;
      update public.task_reservations set outcome = 'completed', ended_at = now() where task_id = tid and outcome = 'active';
      insert into public.points_transactions(family_id,task_id,user_id,points) values(fid,tid,me.id,points);
      update public.house_progress set completed_tasks = completed_tasks + 1,
        garden_level = (completed_tasks + 1) / 5, updated_at = now() where family_id = fid;
      insert into public.task_history(family_id,task_id,user_id,event_type,body)
        values(fid,tid,me.id,'done','Задача «' || (body->>'title') || '» выполнена: ' || me.name),
              (fid,tid,me.id,'points',me.name || ': +' || points || ' баллов');
      insert into public.messages(family_id,task_id,body) values(fid,tid,'Задача «' || (body->>'title') || '» выполнена: ' || me.name);
      perform dom_dela_vnutri.next_task(body,fid,t.creator_id);
    else raise exception 'Неизвестное действие с задачей'; end if;
  else raise exception 'Неизвестное действие'; end if;
  return '{}'::jsonb;
end $$;

create function public.cloud_action(p_kind text, p_data jsonb default '{}'::jsonb) returns jsonb
  language sql volatile security invoker set search_path = '' as $$ select dom_dela_vnutri.apply_action(p_kind,p_data) $$;
revoke all on function dom_dela_vnutri.apply_action(text,jsonb), public.cloud_action(text,jsonb) from public, anon;
grant execute on function dom_dela_vnutri.apply_action(text,jsonb), public.cloud_action(text,jsonb) to authenticated;
revoke all on function dom_dela_vnutri.clean_task(jsonb,uuid,uuid), dom_dela_vnutri.assign_task(uuid,uuid,jsonb),
  dom_dela_vnutri.next_task(jsonb,uuid,uuid) from public, anon, authenticated;
