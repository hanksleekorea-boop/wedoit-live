begin;

create table if not exists public.cloud_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(actor_id) on delete cascade,
  device_id text not null check (char_length(device_id) between 1 and 80),
  client_revision bigint not null default 0 check (client_revision >= 0),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (owner_id, content_hash)
);

create table if not exists public.circle_invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  created_by uuid not null references public.profiles(actor_id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  max_uses integer not null default 20 check (max_uses between 1 and 100),
  uses integer not null default 0 check (uses >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.circle_memberships add column if not exists ranking_opt_in boolean not null default false;

create table if not exists public.circle_checkins (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  actor_id uuid not null references public.profiles(actor_id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 120),
  occurred_on date not null,
  value integer not null default 1 check (value between 1 and 100),
  created_at timestamptz not null default now(),
  unique (actor_id, idempotency_key)
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(actor_id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 80),
  status text not null default 'open' check (status in ('open','reviewed','closed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, post_id)
);

alter table public.cloud_snapshots enable row level security;
alter table public.circle_invitations enable row level security;
alter table public.circle_checkins enable row level security;
alter table public.content_reports enable row level security;

drop policy if exists cloud_snapshots_owner_all on public.cloud_snapshots;
create policy cloud_snapshots_owner_all on public.cloud_snapshots for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists circle_invitations_owner_read on public.circle_invitations;
create policy circle_invitations_owner_read on public.circle_invitations for select using (created_by = auth.uid() and public.is_circle_owner(circle_id, auth.uid()));
drop policy if exists circle_invitations_owner_insert on public.circle_invitations;
create policy circle_invitations_owner_insert on public.circle_invitations for insert with check (created_by = auth.uid() and public.is_circle_owner(circle_id, auth.uid()));
drop policy if exists circle_invitations_owner_update on public.circle_invitations;
create policy circle_invitations_owner_update on public.circle_invitations for update using (created_by = auth.uid() and public.is_circle_owner(circle_id, auth.uid())) with check (created_by = auth.uid() and public.is_circle_owner(circle_id, auth.uid()));

drop policy if exists memberships_scoped_read on public.circle_memberships;
create policy memberships_scoped_read on public.circle_memberships for select using (actor_id = auth.uid() or public.is_circle_owner(circle_id, auth.uid()) or public.is_circle_member(circle_id, auth.uid()));

drop policy if exists profiles_circle_peers_read on public.profiles;
create policy profiles_circle_peers_read on public.profiles for select using (
  actor_id = auth.uid() or exists (
    select 1 from public.circle_memberships mine
    join public.circle_memberships peer on peer.circle_id = mine.circle_id
    where mine.actor_id = auth.uid() and mine.status = 'active' and peer.actor_id = profiles.actor_id and peer.status = 'active'
      and not public.is_blocked_between(auth.uid(), profiles.actor_id)
  )
);

drop policy if exists circle_checkins_member_read on public.circle_checkins;
create policy circle_checkins_member_read on public.circle_checkins for select using (public.is_circle_member(circle_id, auth.uid()) and not public.is_blocked_between(auth.uid(), actor_id));
drop policy if exists circle_checkins_self_insert on public.circle_checkins;
create policy circle_checkins_self_insert on public.circle_checkins for insert with check (actor_id = auth.uid() and public.is_circle_member(circle_id, auth.uid()));
drop policy if exists circle_checkins_self_delete on public.circle_checkins;
create policy circle_checkins_self_delete on public.circle_checkins for delete using (actor_id = auth.uid());

drop policy if exists content_reports_self_insert on public.content_reports;
create policy content_reports_self_insert on public.content_reports for insert with check (
  reporter_id = auth.uid() and exists (
    select 1 from public.posts reported
    where reported.id = post_id and public.is_circle_member(reported.circle_id, auth.uid())
  )
);
drop policy if exists content_reports_self_read on public.content_reports;
create policy content_reports_self_read on public.content_reports for select using (reporter_id = auth.uid());

create or replace function public.redeem_circle_invite(p_token_hash text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare target public.circle_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into target from public.circle_invitations
    where token_hash = p_token_hash and revoked_at is null and expires_at > now() and uses < max_uses
    for update;
  if target.id is null then raise exception 'invite unavailable'; end if;
  if public.is_blocked_between(auth.uid(), target.created_by) then raise exception 'invite unavailable'; end if;
  insert into public.circle_memberships(circle_id, actor_id, role, status, ranking_opt_in)
    values(target.circle_id, auth.uid(), 'member', 'active', false)
    on conflict(circle_id, actor_id) do update set status='active', ranking_opt_in=false;
  update public.circle_invitations set uses = uses + 1 where id = target.id;
  return target.circle_id;
end $$;

revoke all on function public.redeem_circle_invite(text) from public;
grant execute on function public.redeem_circle_invite(text) to authenticated;

commit;
