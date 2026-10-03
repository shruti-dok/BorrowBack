create extension if not exists pgcrypto;

create table if not exists public.loans (
    id uuid primary key default gen_random_uuid(),

    owner_id uuid not null,

    item_name text not null,
    person_name text not null,
    note text,

    lent_date date not null default current_date,
    return_date date,

    status text not null default 'lent'
        check (status in ('lent', 'returned')),

    created_at timestamptz not null default now()
);

create index if not exists loans_owner_id_idx
on public.loans(owner_id);

create index if not exists loans_return_date_idx
on public.loans(return_date);