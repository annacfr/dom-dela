-- Выполнить в SQL Editor проекта Supabase до первой облачной регистрации.
create schema if not exists dom_dela_vnutri;
revoke all on schema dom_dela_vnutri from public, anon;
grant usage on schema dom_dela_vnutri to authenticated;

create table public.families (
  id uuid primary key default gen_random_uuid(), name text not null check (char_length(trim(name)) between 2 and 120),
  code text not null unique default ('DOM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  mood text not null default 'Спокойно' check (mood in ('Хорошо','Спокойно','Напряжённо','Конфликт','Тяжело','Восстановление')),
  created_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  role text not null check (role in ('adult','child')),
  avatar text not null default 'Д', family_id uuid references public.families(id),
  reminders boolean not null default true, created_at timestamptz not null default now()
);
create index profiles_family_idx on public.profiles(family_id);
create table public.join_requests (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id),
  user_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);
create unique index pending_request_idx on public.join_requests(user_id, family_id) where status = 'pending';
create table public.tasks (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id),
  creator_id uuid not null references public.profiles(id), body jsonb not null,
  created_at timestamptz not null default now()
);
create index tasks_family_idx on public.tasks(family_id);
create table public.task_reservations (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id),
  task_id uuid not null references public.tasks(id), user_id uuid not null references public.profiles(id),
  reserved_at timestamptz not null default now(), expires_at timestamptz not null,
  ended_at timestamptz, outcome text not null default 'active' check (outcome in ('active','completed','expired','released'))
);
create unique index one_active_reservation on public.task_reservations(task_id) where outcome = 'active';
create table public.task_history (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id),
  task_id uuid references public.tasks(id), user_id uuid references public.profiles(id),
  event_type text not null, body text not null, archived boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.points_transactions (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id),
  task_id uuid not null unique references public.tasks(id), user_id uuid not null references public.profiles(id),
  points integer not null check (points >= 0), created_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id),
  creator_id uuid not null references public.profiles(id), body jsonb not null, created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id),
  user_id uuid references public.profiles(id), task_id uuid references public.tasks(id),
  body text not null check (char_length(body) between 1 and 1000), created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id),
  user_id uuid not null references public.profiles(id), task_id uuid references public.tasks(id),
  kind text not null, body text not null, is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.family_state (
  family_id uuid primary key references public.families(id), mood text not null default 'Спокойно',
  updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);
create table public.house_progress (
  family_id uuid primary key references public.families(id), completed_tasks integer not null default 0,
  garden_level integer not null default 0, updated_at timestamptz not null default now()
);
create table public.task_assignments (
  task_id uuid not null references public.tasks(id), user_id uuid not null references public.profiles(id),
  family_id uuid not null references public.families(id), primary key(task_id,user_id)
);
create table public.task_comments (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id),
  family_id uuid not null references public.families(id), user_id uuid not null references public.profiles(id),
  body text not null, created_at timestamptz not null default now()
);
create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id),
  family_id uuid not null references public.families(id), frequency text not null,
  week_days integer[], next_date date not null, active boolean not null default true
);
create table public.duty_rotations (
  id uuid primary key default gen_random_uuid(), recurring_task_id uuid not null references public.recurring_tasks(id),
  family_id uuid not null references public.families(id), user_id uuid not null references public.profiles(id), position integer not null
);
create table public.achievements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  family_id uuid not null references public.families(id), code text not null,
  achieved_at timestamptz not null default now(), unique(user_id,code)
);

create function dom_dela_vnutri.new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare n text := trim(coalesce(new.raw_user_meta_data->>'name',''));
declare r text := coalesce(new.raw_user_meta_data->>'role','');
begin
  if char_length(n) < 2 or char_length(n) > 80 or r not in ('adult','child') then
    raise exception 'Имя или роль указаны неверно';
  end if;
  insert into public.profiles(id,name,role,avatar) values(new.id,n,r,upper(substr(n,1,1)));
  return new;
end $$;
create trigger dom_dela_profile_created after insert on auth.users for each row execute function dom_dela_vnutri.new_user();
revoke all on function dom_dela_vnutri.new_user() from public, anon, authenticated;

create function dom_dela_vnutri.is_member(fid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and family_id = fid)
$$;
create function dom_dela_vnutri.is_adult(fid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and family_id = fid and role = 'adult')
$$;
revoke all on function dom_dela_vnutri.is_member(uuid), dom_dela_vnutri.is_adult(uuid) from public, anon;
grant execute on function dom_dela_vnutri.is_member(uuid), dom_dela_vnutri.is_adult(uuid) to authenticated;

do $$ declare t text; begin
  foreach t in array array['families','profiles','join_requests','tasks','task_reservations','task_history','points_transactions','events','messages','notifications','family_state','house_progress','task_assignments','task_comments','recurring_tasks','duty_rotations','achievements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;
create policy family_read on public.families for select to authenticated using (dom_dela_vnutri.is_member(id));
create policy profile_read on public.profiles for select to authenticated using (id = auth.uid() or dom_dela_vnutri.is_member(family_id));
create policy request_read on public.join_requests for select to authenticated using (user_id = auth.uid() or dom_dela_vnutri.is_adult(family_id));
create policy task_read on public.tasks for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy reservation_read on public.task_reservations for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy history_read on public.task_history for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy points_read on public.points_transactions for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy event_read on public.events for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy message_read on public.messages for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy notification_read on public.notifications for select to authenticated using (user_id = auth.uid() and dom_dela_vnutri.is_member(family_id));
create policy state_read on public.family_state for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy house_read on public.house_progress for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy assignment_read on public.task_assignments for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy comment_read on public.task_comments for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy recurring_read on public.recurring_tasks for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy rotation_read on public.duty_rotations for select to authenticated using (dom_dela_vnutri.is_member(family_id));
create policy achievement_read on public.achievements for select to authenticated using (dom_dela_vnutri.is_member(family_id));

alter publication supabase_realtime add table public.tasks, public.messages, public.join_requests, public.notifications;
