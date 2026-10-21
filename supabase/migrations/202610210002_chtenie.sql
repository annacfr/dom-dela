create function dom_dela_vnutri.expire_reservations(fid uuid) returns void language plpgsql security definer set search_path = '' as $$
declare t public.tasks; p public.profiles;
begin
  for t in select * from public.tasks where family_id = fid and body->>'status' = 'reserved'
    and (body->>'reservedUntil')::timestamptz <= now() for update skip locked loop
    update public.tasks set body = (body - 'reservedBy' - 'reservedUntil') || '{"status":"active"}'::jsonb where id = t.id;
    update public.task_reservations set outcome = 'expired', ended_at = now() where task_id = t.id and outcome = 'active';
    insert into public.task_history(family_id,task_id,event_type,body)
      values(fid,t.id,'reservation_expired','Резерв задачи «' || (t.body->>'title') || '» истёк');
    for p in select * from public.profiles where family_id = fid loop
      insert into public.notifications(family_id,user_id,task_id,kind,body)
        values(fid,p.id,t.id,'released','Открыта задача: ' || (t.body->>'title'));
    end loop;
  end loop;
end $$;

create function dom_dela_vnutri.snapshot() returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare me public.profiles; fid uuid;
begin
  if auth.uid() is null then raise exception 'Войдите в аккаунт'; end if;
  select * into me from public.profiles where id = auth.uid();
  if not found then raise exception 'Профиль не найден. Примените миграции и зарегистрируйтесь заново.'; end if;
  fid := me.family_id;
  if fid is not null then perform dom_dela_vnutri.expire_reservations(fid); end if;
  return jsonb_build_object(
    'currentUserId', me.id,
    'settings', jsonb_build_object('reminders',me.reminders),
    'users', coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'role',p.role,'avatar',p.avatar,'familyId',p.family_id))
      from public.profiles p where p.id = me.id or p.family_id = fid or (me.role = 'adult' and exists
      (select 1 from public.join_requests r where r.user_id = p.id and r.family_id = fid and r.status = 'pending'))), '[]'::jsonb),
    'families', coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'code',f.code,'mood',f.mood))
      from public.families f where f.id = fid), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(t.body order by t.created_at desc) from public.tasks t where t.family_id = fid), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(e.body order by e.created_at) from public.events e where e.family_id = fid), '[]'::jsonb),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'familyId',m.family_id,'userId',m.user_id,
      'taskId',m.task_id,'text',m.body,'at',m.created_at) order by m.created_at) from public.messages m where m.family_id = fid), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('id',h.id,'familyId',h.family_id,'type',h.event_type,
      'text',h.body,'at',h.created_at,'userId',h.user_id,'archived',h.archived) order by h.created_at desc)
      from public.task_history h where h.family_id = fid), '[]'::jsonb),
    'notifications', coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'familyId',n.family_id,'taskId',n.task_id,
      'text',n.body,'at',n.created_at,'userId',n.user_id,'read',n.is_read,'type',n.kind) order by n.created_at desc)
      from public.notifications n where n.family_id = fid and n.user_id = me.id), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'familyId',r.family_id,'userId',r.user_id,'at',r.created_at))
      from public.join_requests r where r.family_id = fid and r.status = 'pending' and me.role = 'adult'), '[]'::jsonb)
  );
end $$;

create function public.cloud_snapshot() returns jsonb language sql volatile security invoker set search_path = '' as $$
  select dom_dela_vnutri.snapshot()
$$;
revoke all on function dom_dela_vnutri.expire_reservations(uuid), dom_dela_vnutri.snapshot(), public.cloud_snapshot() from public, anon;
revoke all on function dom_dela_vnutri.expire_reservations(uuid) from authenticated;
grant execute on function dom_dela_vnutri.snapshot(), public.cloud_snapshot() to authenticated;
