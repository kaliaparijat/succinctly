-- profiles: one row per auth user, created automatically on sign-up
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_color text,
  preferences jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- decks: belong to a user, carry a named palette
create table public.decks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  palette    text not null default 'butter',
  created_at timestamptz not null default now()
);

-- cards: belong to a deck, ordered by position
create table public.cards (
  id               uuid primary key default gen_random_uuid(),
  deck_id          uuid not null references public.decks(id) on delete cascade,
  question         text not null default '',
  reference_answer text not null default '',
  position         integer not null default 0,
  created_at       timestamptz not null default now()
);

-- indexes for common query patterns
create index decks_user_id_idx on public.decks(user_id);
create index cards_deck_id_idx on public.cards(deck_id);
create index cards_deck_position_idx on public.cards(deck_id, position);

-- RLS: enable on all tables
alter table public.profiles enable row level security;
alter table public.decks    enable row level security;
alter table public.cards    enable row level security;

-- profiles policies
create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- decks policies
create policy "users can view own decks"
  on public.decks for select
  using (auth.uid() = user_id);

create policy "users can insert own decks"
  on public.decks for insert
  with check (auth.uid() = user_id);

create policy "users can update own decks"
  on public.decks for update
  using (auth.uid() = user_id);

create policy "users can delete own decks"
  on public.decks for delete
  using (auth.uid() = user_id);

-- cards policies (scoped through deck ownership)
create policy "users can view cards in own decks"
  on public.cards for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "users can insert cards in own decks"
  on public.cards for insert
  with check (
    exists (
      select 1 from public.decks
      where decks.id = cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "users can update cards in own decks"
  on public.cards for update
  using (
    exists (
      select 1 from public.decks
      where decks.id = cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "users can delete cards in own decks"
  on public.cards for delete
  using (
    exists (
      select 1 from public.decks
      where decks.id = cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

-- trigger: auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
