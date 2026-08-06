with expected_tables(name) as (values
  ('profiles'), ('goals'), ('circles'), ('circle_memberships'), ('blocks'), ('posts'), ('reactions')
), expected_policies(name) as (values
  ('profiles_self_read'), ('profiles_self_insert'), ('profiles_self_update'),
  ('goals_scoped_read'), ('goals_owner_insert'), ('goals_owner_update'), ('goals_owner_delete'),
  ('circles_member_read'), ('circles_owner_insert'), ('circles_owner_update'), ('circles_owner_delete'),
  ('memberships_scoped_read'), ('memberships_owner_manage'),
  ('blocks_self_read'), ('blocks_self_insert'), ('blocks_self_delete'),
  ('posts_member_read'), ('posts_member_insert'), ('posts_author_update'), ('posts_author_delete'),
  ('reactions_member_read'), ('reactions_member_insert'), ('reactions_actor_delete')
), expected_functions(name) as (values
  ('is_circle_member'), ('is_blocked_between'), ('is_circle_owner')
), missing_tables as (
  select e.name from expected_tables e
  where not exists (select 1 from pg_catalog.pg_tables t where t.schemaname = 'public' and t.tablename = e.name)
), missing_rls as (
  select e.name from expected_tables e
  where not exists (
    select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = e.name and c.relrowsecurity
  )
), missing_policies as (
  select e.name from expected_policies e
  where not exists (select 1 from pg_catalog.pg_policies p where p.schemaname = 'public' and p.policyname = e.name)
), missing_functions as (
  select e.name from expected_functions e
  where not exists (
    select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = e.name
  )
)
select json_build_object(
  'schemaVersion', 6,
  'ok', not exists(select 1 from missing_tables)
        and not exists(select 1 from missing_rls)
        and not exists(select 1 from missing_policies)
        and not exists(select 1 from missing_functions),
  'expected', json_build_object('tables', 7, 'policies', 23, 'functions', 3),
  'missingTables', coalesce((select json_agg(name order by name) from missing_tables), '[]'::json),
  'missingRls', coalesce((select json_agg(name order by name) from missing_rls), '[]'::json),
  'missingPolicies', coalesce((select json_agg(name order by name) from missing_policies), '[]'::json),
  'missingFunctions', coalesce((select json_agg(name order by name) from missing_functions), '[]'::json)
);

