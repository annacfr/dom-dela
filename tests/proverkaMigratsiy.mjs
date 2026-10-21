import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create publication supabase_realtime;`);
for (const name of ['202610210001_osnova.sql','202610210002_chtenie.sql','202610210003_deystviya.sql']) {
  const sql = readFileSync(`supabase/migrations/${name}`, 'utf8');
  try { await db.exec(sql); console.log(`OK ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; break; }
}
if (!process.exitCode) {
  const checks = await db.query(`select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename`);
  console.log(`RLS ${checks.rows.filter(x => x.rowsecurity).length}/${checks.rows.length}`); assert.equal(checks.rows.filter(x => x.rowsecurity).length, 17);
  const a = '10000000-0000-4000-8000-000000000001', b = '10000000-0000-4000-8000-000000000002', c = '10000000-0000-4000-8000-000000000003', d = '10000000-0000-4000-8000-000000000004';
  await db.exec('reset role');
  for (const [id,name,role] of [[a,'Аня','adult'],[b,'Маша','child'],[c,'Игорь','adult'],[d,'Максим','adult']])
    await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)',[id,JSON.stringify({name,role})]);
  const as = async (id,sql,params=[]) => {
    await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); await db.exec('set role authenticated');
    return db.query(sql,params);
  };
  const action = (id,kind,data={}) => as(id,'select public.cloud_action($1,$2::jsonb) as result',[kind,JSON.stringify(data)]);
  const snapshot = async id => (await as(id,'select public.cloud_snapshot() as data')).rows[0].data;
  await action(a,'family_create',{name:'Соколовы'});
  const family = (await snapshot(a)).families[0];
  await action(b,'family_join',{code:family.code});
  await action(d,'family_join',{code:family.code});
  const request = (await snapshot(a)).requests[0];
  await assert.rejects(action(b,'request_decide',{requestId:request.id,accept:true}));
  await action(a,'request_decide',{requestId:request.id,accept:true});
  assert.equal((await snapshot(d)).families[0].id,family.id);
  await action(c,'family_create',{name:'Другая семья'});
  const day = new Date().toISOString().slice(0,10);
  await action(a,'task_create',{task:{title:'Вынести мусор',description:'',category:'Дом',date:day,time:'18:00',
    deadline:`${day}T20:00`,repeat:'none',priority:'Обычный',urgent:false,points:10,assignees:'open'}});
  const task = (await snapshot(b)).tasks[0];
  assert.equal(task.title,'Вынести мусор'); assert.equal((await snapshot(c)).tasks.length,0);
  assert.equal((await as(c,'select count(*)::int as n from public.tasks')).rows[0].n,0); await assert.rejects(as(c,"insert into public.families(name) values('Чужая')"));
  await action(b,'task_reserve',{taskId:task.id}); await action(b,'task_start',{taskId:task.id});
  await action(b,'task_finish',{taskId:task.id});
  assert.equal((await snapshot(a)).tasks[0].status,'done'); assert.equal((await snapshot(b)).tasks[0].completedBy,b);
  assert.equal((await snapshot(b)).history.filter(x=>x.type==='points').length,1);
  await assert.rejects(action(b,'task_finish',{taskId:task.id})); await assert.rejects(action(c,'task_reserve',{taskId:task.id}));
  console.log('OK семьи, запрос взрослого, RLS, резерв, завершение и защита от повтора');
}
await db.close();
