-- Pixelwar MVP Supabase schema
-- Run this in the Supabase SQL editor. Enable Realtime for public.pixels afterwards.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24 and username ~ '^[a-zA-Z0-9_]+$'),
  coins integer not null default 100 check (coins >= 0),
  diamonds integer not null default 0 check (diamonds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pixels (
  x integer not null check (x between 0 and 999),
  y integer not null check (y between 0 and 999),
  color text not null default '#ffffff' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  owner_id uuid references public.profiles(id) on delete set null,
  locked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (x, y)
);

create table if not exists public.pixel_history (
  id bigint generated always as identity primary key,
  x integer not null check (x between 0 and 999),
  y integer not null check (y between 0 and 999),
  old_color text not null check (old_color ~ '^#[0-9A-Fa-f]{6}$'),
  new_color text not null check (new_color ~ '^#[0-9A-Fa-f]{6}$'),
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency text not null check (currency in ('coins', 'diamonds')),
  amount integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.virtual_assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  description text not null,
  current_price integer not null default 10 check (current_price > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.asset_price_history (
  id bigint generated always as identity primary key,
  asset_id uuid not null references public.virtual_assets(id) on delete cascade,
  price integer not null check (price > 0),
  recorded_at timestamptz not null default now()
);

create table if not exists public.user_asset_holdings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset_id uuid not null references public.virtual_assets(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  avg_buy_price numeric(12,2) not null default 0 check (avg_buy_price >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, asset_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  x integer not null check (x between 0 and 999),
  y integer not null check (y between 0 and 999),
  reason text not null check (char_length(reason) between 5 and 500),
  reporter_id uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists pixels_owner_idx on public.pixels(owner_id);
create index if not exists pixels_locked_idx on public.pixels(locked);
create index if not exists pixel_history_user_idx on public.pixel_history(user_id, created_at desc);
create index if not exists wallet_transactions_user_idx on public.wallet_transactions(user_id, created_at desc);
create index if not exists reports_status_idx on public.reports(status, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists holdings_touch_updated_at on public.user_asset_holdings;
create trigger holdings_touch_updated_at before update on public.user_asset_holdings for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, coins, diamonds)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'pixel_' || substr(new.id::text, 1, 8)),
    100,
    0
  );
  insert into public.wallet_transactions (user_id, currency, amount, reason)
  values (new.id, 'coins', 100, 'signup_bonus');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.pixel_price(p_x integer, p_y integer)
returns integer language sql immutable as $$
  select case
    when sqrt(power(p_x - 499.5, 2) + power(p_y - 499.5, 2)) / sqrt(power(499.5, 2) + power(499.5, 2)) < 0.18 then 5
    when sqrt(power(p_x - 499.5, 2) + power(p_y - 499.5, 2)) / sqrt(power(499.5, 2) + power(499.5, 2)) < 0.32 then 4
    when sqrt(power(p_x - 499.5, 2) + power(p_y - 499.5, 2)) / sqrt(power(499.5, 2) + power(499.5, 2)) < 0.52 then 3
    when sqrt(power(p_x - 499.5, 2) + power(p_y - 499.5, 2)) / sqrt(power(499.5, 2) + power(499.5, 2)) < 0.72 then 2
    else 1
  end;
$$;

create or replace function public.paint_pixel(p_x integer, p_y integer, p_color text, p_lock boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_existing public.pixels%rowtype;
  v_old_color text := '#ffffff';
  v_cost integer;
  v_diamond_cost integer := case when p_lock then 1 else 0 end;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_x not between 0 and 999 or p_y not between 0 and 999 then raise exception 'invalid_coordinates'; end if;
  if p_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'invalid_color'; end if;

  select * into v_profile from public.profiles where id = v_user for update;
  select * into v_existing from public.pixels where x = p_x and y = p_y for update;
  if found then
    v_old_color := v_existing.color;
    if v_existing.locked and v_existing.owner_id <> v_user then raise exception 'pixel_locked_by_other_user'; end if;
  end if;

  v_cost := public.pixel_price(p_x, p_y);
  if v_profile.coins < v_cost then raise exception 'not_enough_coins'; end if;
  if v_profile.diamonds < v_diamond_cost then raise exception 'not_enough_diamonds'; end if;

  update public.profiles set coins = coins - v_cost, diamonds = diamonds - v_diamond_cost where id = v_user;
  insert into public.wallet_transactions (user_id, currency, amount, reason, metadata) values (v_user, 'coins', -v_cost, 'paint_pixel', jsonb_build_object('x', p_x, 'y', p_y));
  if v_diamond_cost > 0 then
    insert into public.wallet_transactions (user_id, currency, amount, reason, metadata) values (v_user, 'diamonds', -1, 'lock_pixel', jsonb_build_object('x', p_x, 'y', p_y));
  end if;

  insert into public.pixels (x, y, color, owner_id, locked, updated_at)
  values (p_x, p_y, lower(p_color), v_user, p_lock or coalesce(v_existing.locked, false), now())
  on conflict (x, y) do update set color = excluded.color, owner_id = v_user, locked = excluded.locked, updated_at = now();

  insert into public.pixel_history (x, y, old_color, new_color, user_id) values (p_x, p_y, v_old_color, lower(p_color), v_user);
  return jsonb_build_object('ok', true, 'cost', v_cost, 'diamonds', v_diamond_cost);
end;
$$;

create or replace function public.grant_test_currency(p_coins integer default 0, p_diamonds integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_coins < 0 or p_coins > 100 or p_diamonds < 0 or p_diamonds > 10 then raise exception 'invalid_test_amount'; end if;
  update public.profiles set coins = coins + p_coins, diamonds = diamonds + p_diamonds where id = v_user;
  if p_coins > 0 then insert into public.wallet_transactions(user_id, currency, amount, reason) values (v_user, 'coins', p_coins, 'dev_test_grant'); end if;
  if p_diamonds > 0 then insert into public.wallet_transactions(user_id, currency, amount, reason) values (v_user, 'diamonds', p_diamonds, 'dev_test_grant'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.claim_rewarded_ad_demo()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_last timestamptz;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select created_at into v_last from public.wallet_transactions where user_id = v_user and reason = 'rewarded_ad_demo' order by created_at desc limit 1;
  if v_last is not null and v_last > now() - interval '10 minutes' then raise exception 'cooldown_active'; end if;
  update public.profiles set coins = coins + 10 where id = v_user;
  insert into public.wallet_transactions(user_id, currency, amount, reason) values (v_user, 'coins', 10, 'rewarded_ad_demo');
  return jsonb_build_object('ok', true, 'coins', 10);
end;
$$;

create or replace function public.trade_virtual_asset(p_asset_id uuid, p_side text, p_quantity integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_asset public.virtual_assets%rowtype;
  v_profile public.profiles%rowtype;
  v_holding public.user_asset_holdings%rowtype;
  v_total integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_side not in ('buy', 'sell') or p_quantity < 1 or p_quantity > 1000 then raise exception 'invalid_trade'; end if;
  select * into v_asset from public.virtual_assets where id = p_asset_id for update;
  if not found then raise exception 'asset_not_found'; end if;
  select * into v_profile from public.profiles where id = v_user for update;
  select * into v_holding from public.user_asset_holdings where user_id = v_user and asset_id = p_asset_id for update;
  v_total := v_asset.current_price * p_quantity;

  if p_side = 'buy' then
    if v_profile.coins < v_total then raise exception 'not_enough_coins'; end if;
    update public.profiles set coins = coins - v_total where id = v_user;
    insert into public.user_asset_holdings(user_id, asset_id, quantity, avg_buy_price)
    values (v_user, p_asset_id, p_quantity, v_asset.current_price)
    on conflict (user_id, asset_id) do update set
      avg_buy_price = ((user_asset_holdings.quantity * user_asset_holdings.avg_buy_price) + v_total) / (user_asset_holdings.quantity + p_quantity),
      quantity = user_asset_holdings.quantity + p_quantity,
      updated_at = now();
    insert into public.wallet_transactions(user_id, currency, amount, reason, metadata) values (v_user, 'coins', -v_total, 'asset_buy', jsonb_build_object('asset_id', p_asset_id, 'quantity', p_quantity));
  else
    if coalesce(v_holding.quantity, 0) < p_quantity then raise exception 'not_enough_asset_quantity'; end if;
    update public.profiles set coins = coins + v_total where id = v_user;
    update public.user_asset_holdings set quantity = quantity - p_quantity, updated_at = now() where user_id = v_user and asset_id = p_asset_id;
    delete from public.user_asset_holdings where user_id = v_user and asset_id = p_asset_id and quantity = 0;
    insert into public.wallet_transactions(user_id, currency, amount, reason, metadata) values (v_user, 'coins', v_total, 'asset_sell', jsonb_build_object('asset_id', p_asset_id, 'quantity', p_quantity));
  end if;

  return jsonb_build_object('ok', true, 'total', v_total);
end;
$$;

create or replace function public.simulate_asset_prices()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.virtual_assets
  set current_price = greatest(1, round(current_price * (1 + ((random() - 0.48) * 0.12)))::integer);
  insert into public.asset_price_history(asset_id, price)
  select id, current_price from public.virtual_assets;
end;
$$;

alter table public.profiles enable row level security;
alter table public.pixels enable row level security;
alter table public.pixel_history enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.virtual_assets enable row level security;
alter table public.asset_price_history enable row level security;
alter table public.user_asset_holdings enable row level security;
alter table public.events enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles read all" on public.profiles;
drop policy if exists "profiles update own username" on public.profiles;
drop policy if exists "pixels read all" on public.pixels;
drop policy if exists "history read all" on public.pixel_history;
drop policy if exists "wallet read own" on public.wallet_transactions;
drop policy if exists "assets read all" on public.virtual_assets;
drop policy if exists "asset history read all" on public.asset_price_history;
drop policy if exists "holdings read all" on public.user_asset_holdings;
drop policy if exists "events read all" on public.events;
drop policy if exists "reports insert own" on public.reports;

revoke update on public.profiles from authenticated;
grant update(username) on public.profiles to authenticated;

create policy "profiles read all" on public.profiles for select using (true);
create policy "profiles update own username" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "pixels read all" on public.pixels for select using (true);
create policy "history read all" on public.pixel_history for select using (true);
create policy "wallet read own" on public.wallet_transactions for select using (auth.uid() = user_id);
create policy "assets read all" on public.virtual_assets for select using (true);
create policy "asset history read all" on public.asset_price_history for select using (true);
create policy "holdings read all" on public.user_asset_holdings for select using (true);
create policy "events read all" on public.events for select using (true);
create policy "reports insert own" on public.reports for insert with check (auth.uid() = reporter_id);

insert into public.virtual_assets(symbol, name, description, current_price) values
  ('CENTER', 'Center Zone', 'Virtueller Index für Aktivität im wertvollen Zentrum der Pixel-Wall.', 28),
  ('NORTH', 'North Zone', 'Virtueller Index für die nördlichen Sektoren und ihre Community-Dynamik.', 14),
  ('ART', 'Pixel Art Index', 'Simulierter Kreativindex für hochwertige zusammenhängende Pixelkunst.', 20),
  ('CHAOS', 'Chaos Index', 'Volatiler Spielindex für Übermalungen, Konflikte und schnelle Farbwechsel.', 9)
on conflict (symbol) do nothing;

insert into public.asset_price_history(asset_id, price)
select id, current_price from public.virtual_assets
where not exists (select 1 from public.asset_price_history where asset_id = virtual_assets.id);

insert into public.events(title, description, starts_at, ends_at, active)
values ('Baue das grösste Pixelkunstwerk der Woche', 'MVP-Platzhalter für eine Community-Challenge mit späterem Scoring, Timelapse und Galerie.', now(), now() + interval '7 days', true)
on conflict do nothing;

-- Recommended after running schema: Database → Replication → enable Realtime for public.pixels.
