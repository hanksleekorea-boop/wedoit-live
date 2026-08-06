begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  actor_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(actor_id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.circle_memberships (
  circle_id uuid not null references public.circles(id) on delete cascade,
  actor_id uuid not null references public.profiles(actor_id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  status text not null default 'active' check (status in ('active','left','removed')),
  joined_at timestamptz not null default now(),
  primary key (circle_id, actor_id)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(actor_id) on delete cascade,
  circle_id uuid references public.circles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  privacy text not null default 'private' check (privacy in ('private','circle','public')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (privacy <> 'circle' or circle_id is not null)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(actor_id) on delete cascade,
  blocked_id uuid not null references public.profiles(actor_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  author_id uuid not null references public.profiles(actor_id) on delete cascade,
  kind text not null check (kind in ('checkin','question','answer')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  actor_id uuid not null references public.profiles(actor_id) on delete cascade,
  kind text not null default 'cheer' check (kind = 'cheer'),
  created_at timestamptz not null default now(),
  primary key (post_id, actor_id, kind)
);

create or replace function public.is_circle_member(target_circle uuid, target_actor uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.circle_memberships m where m.circle_id = target_circle and m.actor_id = target_actor and m.status = 'active') $$;

create or replace function public.is_blocked_between(left_actor uuid, right_actor uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.blocks b where (b.blocker_id = left_actor and b.blocked_id = right_actor) or (b.blocker_id = right_actor and b.blocked_id = left_actor)) $$;

create or replace function public.is_circle_owner(target_circle uuid, target_actor uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.circles c where c.id = target_circle and c.owner_id = target_actor) $$;

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.circles enable row level security;
alter table public.circle_memberships enable row level security;
alter table public.blocks enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;

create policy profiles_self_read on public.profiles for select using (actor_id = auth.uid());
create policy profiles_self_insert on public.profiles for insert with check (actor_id = auth.uid());
create policy profiles_self_update on public.profiles for update using (actor_id = auth.uid()) with check (actor_id = auth.uid());

create policy goals_scoped_read on public.goals for select using (
  owner_id = auth.uid() or (
    not public.is_blocked_between(auth.uid(), owner_id) and (
      privacy = 'public' or (privacy = 'circle' and public.is_circle_member(circle_id, auth.uid()))
    )
  )
);
create policy goals_owner_insert on public.goals for insert with check (owner_id = auth.uid());
create policy goals_owner_update on public.goals for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy goals_owner_delete on public.goals for delete using (owner_id = auth.uid());

create policy circles_member_read on public.circles for select using (owner_id = auth.uid() or public.is_circle_member(id, auth.uid()));
create policy circles_owner_insert on public.circles for insert with check (owner_id = auth.uid());
create policy circles_owner_update on public.circles for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy circles_owner_delete on public.circles for delete using (owner_id = auth.uid());

create policy memberships_scoped_read on public.circle_memberships for select using (actor_id = auth.uid() or public.is_circle_owner(circle_id, auth.uid()));
create policy memberships_owner_manage on public.circle_memberships for all using (public.is_circle_owner(circle_id, auth.uid())) with check (public.is_circle_owner(circle_id, auth.uid()));

create policy blocks_self_read on public.blocks for select using (blocker_id = auth.uid());
create policy blocks_self_insert on public.blocks for insert with check (blocker_id = auth.uid());
create policy blocks_self_delete on public.blocks for delete using (blocker_id = auth.uid());

create policy posts_member_read on public.posts for select using (
  public.is_circle_member(circle_id, auth.uid()) and (author_id = auth.uid() or not public.is_blocked_between(auth.uid(), author_id))
);
create policy posts_member_insert on public.posts for insert with check (author_id = auth.uid() and public.is_circle_member(circle_id, auth.uid()));
create policy posts_author_update on public.posts for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy posts_author_delete on public.posts for delete using (author_id = auth.uid());

create policy reactions_member_read on public.reactions for select using (
  exists(select 1 from public.posts p where p.id = post_id and public.is_circle_member(p.circle_id, auth.uid()) and (p.author_id = auth.uid() or not public.is_blocked_between(auth.uid(), p.author_id)))
);
create policy reactions_member_insert on public.reactions for insert with check (
  actor_id = auth.uid() and exists(select 1 from public.posts p where p.id = post_id and public.is_circle_member(p.circle_id, auth.uid()))
);
create policy reactions_actor_delete on public.reactions for delete using (actor_id = auth.uid());

commit;
