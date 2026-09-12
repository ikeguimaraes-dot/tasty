-- Tasty: public discovery, owner-controlled social data, and private game rooms.
create schema if not exists private;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{3,24}$'),
  full_name text not null default '', bio text not null default '',
  avatar_url text, city text not null default 'São Paulo',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.account_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birthday date, notifications_enabled boolean not null default false
);
create table public.restaurants (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  name text not null, category text not null, description text not null,
  address text not null, city text not null default 'São Paulo',
  latitude double precision not null, longitude double precision not null,
  image_url text not null, price_range text not null default '$$',
  is_featured boolean not null default false, is_demo boolean not null default true
);
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null, description text not null default '',
  image_url text not null, price numeric(10,2) check(price >= 0),
  category text not null, tags text[] not null default '{}',
  unique (id, restaurant_id), unique (restaurant_id, name)
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id),
  dish_id uuid not null,
  rating numeric(2,1) not null check(rating between 0.5 and 5),
  service_rating numeric(2,1) check(service_rating between 0.5 and 5),
  ambience_rating numeric(2,1) check(ambience_rating between 0.5 and 5),
  packaging_rating numeric(2,1) check(packaging_rating between 0.5 and 5),
  delivery_rating numeric(2,1) check(delivery_rating between 0.5 and 5),
  content text not null check(char_length(content) between 1 and 3000),
  photo_url text, kind text not null default 'review' check(kind in ('review','delivery')),
  recommend boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (dish_id, restaurant_id) references public.dishes(id, restaurant_id)
);
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,review_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  content text not null check(char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,dish_id)
);
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id,following_id), check(follower_id <> following_id)
);
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id),
  rating numeric(2,1) not null check(rating between 0.5 and 5),
  created_at timestamptz not null default now()
);
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Nossa conta', data jsonb not null,
  updated_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  reason text not null check(char_length(reason) between 3 and 1000),
  created_at timestamptz not null default now(), unique(user_id, review_id)
);
create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  host_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check(kind in ('roulette','match')),
  max_players integer not null check(max_players between 2 and 20),
  result_dish_id uuid references public.dishes(id),
  created_at timestamptz not null default now()
);
create table public.game_members (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), primary key(room_id,user_id)
);
create table public.game_votes (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  liked boolean not null, primary key(room_id,user_id,dish_id),
  foreign key(room_id,user_id) references public.game_members(room_id,user_id) on delete cascade
);

create index dishes_restaurant_idx on public.dishes(restaurant_id);
create index reviews_created_idx on public.reviews(created_at desc);
create index reviews_user_idx on public.reviews(user_id);
create index reviews_dish_idx on public.reviews(dish_id);
create index reviews_restaurant_idx on public.reviews(restaurant_id);
create index likes_review_idx on public.likes(review_id);
create index comments_review_idx on public.comments(review_id);
create index comments_user_idx on public.comments(user_id);
create index bookmarks_dish_idx on public.bookmarks(dish_id);
create index follows_following_idx on public.follows(following_id);
create index checkins_user_idx on public.checkins(user_id);
create index checkins_restaurant_idx on public.checkins(restaurant_id);
create index bills_user_idx on public.bills(user_id);
create index reports_review_idx on public.reports(review_id);
create index game_rooms_host_idx on public.game_rooms(host_id);
create index game_rooms_result_idx on public.game_rooms(result_dish_id);
create index game_members_user_idx on public.game_members(user_id);
create index game_votes_user_idx on public.game_votes(user_id);
create index game_votes_dish_idx on public.game_votes(dish_id);

do $$ declare t text; begin
  foreach t in array array['profiles','account_settings','restaurants','dishes','reviews','likes','comments','bookmarks','follows','checkins','bills','reports','game_rooms','game_members','game_votes'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
  foreach t in array array['profiles','restaurants','dishes','reviews','likes','comments','follows'] loop
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)',t);
  end loop;
  foreach t in array array['reviews','likes','comments','bookmarks','checkins','bills','reports','account_settings'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated',t);
    execute format('create policy "Owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t);
    execute format('create policy "Owner update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t);
    execute format('create policy "Owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',t);
  end loop;
  foreach t in array array['bookmarks','checkins','bills','reports','account_settings'] loop
    execute format('create policy "Owner read" on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t);
  end loop;
end $$;

grant insert, update on public.profiles to authenticated;
create policy "Create own profile" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id and auth_user_id = (select auth.uid()) and not is_demo);
create policy "Update own profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id and auth_user_id = (select auth.uid()) and not is_demo);
grant insert, delete on public.follows to authenticated;
create policy "Follow people" on public.follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "Unfollow people" on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

create view public.dish_ratings with (security_invoker=true) as
 select d.id, coalesce(round(avg(r.rating),1),0) as rating, count(r.id)::integer as review_count
 from public.dishes d left join public.reviews r on r.dish_id=d.id group by d.id;
create view public.restaurant_ratings with (security_invoker=true) as
 select p.id, coalesce(round(avg(r.rating),1),0) as rating,
 coalesce(round(avg(r.service_rating),1),0) as service_rating,
 coalesce(round(avg(r.ambience_rating),1),0) as ambience_rating, count(r.id)::integer as review_count
 from public.restaurants p left join public.reviews r on r.restaurant_id=p.id group by p.id;
grant select on public.dish_ratings, public.restaurant_ratings to anon, authenticated;

-- Membership helpers live outside the exposed API schema. All privileged actions check identity.
create function private.is_game_member(room uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.game_members where room_id=room and user_id=auth.uid());
$$;
revoke all on function private.is_game_member(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_game_member(uuid) to authenticated;
grant select on public.game_rooms,public.game_members,public.game_votes to authenticated;
create policy "Members read room" on public.game_rooms for select to authenticated using (private.is_game_member(id));
create policy "Members read players" on public.game_members for select to authenticated using (private.is_game_member(room_id));
create policy "Members read votes" on public.game_votes for select to authenticated using (private.is_game_member(room_id));
grant insert,update on public.game_votes to authenticated;
create policy "Vote as yourself" on public.game_votes for insert to authenticated with check ((select auth.uid())=user_id and private.is_game_member(room_id));
create policy "Change own vote" on public.game_votes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and private.is_game_member(room_id));

create function private.create_game(kind text, capacity integer) returns uuid language plpgsql security definer set search_path='' as $$
declare room uuid; begin
 if auth.uid() is null then raise exception 'Entre na sua conta para jogar.'; end if;
 if kind not in ('match','roulette') or capacity not between 2 and 20 or (kind='match' and capacity<>2) then raise exception 'Configuração inválida.'; end if;
 if (select count(*) from public.game_rooms where host_id=auth.uid() and created_at>now()-interval '1 hour') >= 10 then raise exception 'Aguarde antes de criar outra sala.'; end if;
 insert into public.game_rooms(host_id,kind,max_players) values(auth.uid(),kind,capacity) returning id into room;
 insert into public.game_members(room_id,user_id) values(room,auth.uid()); return room;
end $$;
create function private.join_game(room_code text) returns uuid language plpgsql security definer set search_path='' as $$
declare room public.game_rooms; begin
 if auth.uid() is null then raise exception 'Entre na sua conta para jogar.'; end if;
 select * into room from public.game_rooms where code=upper(trim(room_code)) for update;
 if room.id is null or room.created_at<now()-interval '24 hours' then raise exception 'Sala não encontrada ou expirada.'; end if;
 if exists(select 1 from public.game_members where room_id=room.id and user_id=auth.uid()) then return room.id; end if;
 if (select count(*) from public.game_members where room_id=room.id)>=room.max_players then raise exception 'Esta sala está cheia.'; end if;
 insert into public.game_members(room_id,user_id) values(room.id,auth.uid()); return room.id;
end $$;
create function private.spin_game(room uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare dish uuid; begin
 if auth.uid() is null or not exists(select 1 from public.game_rooms where id=room and host_id=auth.uid() and kind='roulette' and created_at>now()-interval '24 hours') then raise exception 'Só quem criou a sala pode girar.'; end if;
 select id into dish from public.dishes order by random() limit 1;
 update public.game_rooms set result_dish_id=dish where id=room; return dish;
end $$;
revoke all on function private.create_game(text,integer),private.join_game(text),private.spin_game(uuid) from public,anon;
grant execute on function private.create_game(text,integer),private.join_game(text),private.spin_game(uuid) to authenticated;
create function public.create_game(kind text,capacity integer) returns uuid language sql security invoker set search_path='' as $$ select private.create_game(kind,capacity); $$;
create function public.join_game(room_code text) returns uuid language sql security invoker set search_path='' as $$ select private.join_game(room_code); $$;
create function public.spin_game(room uuid) returns uuid language sql security invoker set search_path='' as $$ select private.spin_game(room); $$;
revoke all on function public.create_game(text,integer),public.join_game(text),public.spin_game(uuid) from public,anon;
grant execute on function public.create_game(text,integer),public.join_game(text),public.spin_game(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('tasty-photos','tasty-photos',true,8388608,array['image/jpeg','image/png','image/webp']);
create policy "Upload own photos" on storage.objects for insert to authenticated
 with check(bucket_id='tasty-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Read own photo metadata" on storage.objects for select to authenticated
 using(bucket_id='tasty-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Delete own photos" on storage.objects for delete to authenticated
 using(bucket_id='tasty-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

alter publication supabase_realtime add table public.game_rooms,public.game_members,public.game_votes;
