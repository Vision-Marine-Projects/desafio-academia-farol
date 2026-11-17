-- Schema inicial da plataforma da Academia Náutica Farol.
-- Rodar no SQL Editor do Supabase, na ordem do nome do arquivo.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Perfis: um por usuário do Auth. O papel decide o que cada um vê.
-- ---------------------------------------------------------------------------
create table if not exists public.perfis (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  email      text not null,
  cpf        text,
  papel      text not null default 'aluno' check (papel in ('aluno', 'admin')),
  criado_em  timestamptz not null default now()
);

-- Função usada pelas policies para saber se quem está logado é admin.
-- security definer: lê perfis sem passar pela RLS de perfis (evita recursão).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis where id = auth.uid() and papel = 'admin'
  );
$$;

alter table public.perfis enable row level security;

drop policy if exists perfis_select_proprio_ou_admin on public.perfis;
create policy perfis_select_proprio_ou_admin on public.perfis
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Catálogo público: cursos e turmas.
-- ---------------------------------------------------------------------------
create table if not exists public.cursos (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  nome            text not null,
  descricao       text not null,
  carga_horaria   int  not null,
  validade_meses  int,              -- null = curso sem validade
  preco           numeric(10, 2) not null
);

create table if not exists public.turmas (
  id        uuid primary key default gen_random_uuid(),
  curso_id  uuid not null references public.cursos (id) on delete cascade,
  inicio    date not null,
  fim       date not null,
  vagas     int  not null
);

alter table public.cursos enable row level security;
alter table public.turmas enable row level security;

drop policy if exists cursos_leitura_publica on public.cursos;
create policy cursos_leitura_publica on public.cursos
  for select to anon, authenticated using (true);

drop policy if exists turmas_leitura_publica on public.turmas;
create policy turmas_leitura_publica on public.turmas
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Matrículas: aluno x turma.
-- ---------------------------------------------------------------------------
create table if not exists public.matriculas (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.perfis (id) on delete cascade,
  turma_id    uuid not null references public.turmas (id) on delete cascade,
  status      text not null default 'ativa' check (status in ('ativa', 'concluida', 'cancelada')),
  criado_em   timestamptz not null default now(),
  unique (usuario_id, turma_id)
);

alter table public.matriculas enable row level security;

-- Leitura das matrículas na área do aluno.
drop policy if exists matriculas_leitura on public.matriculas;
create policy matriculas_leitura on public.matriculas
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Certificados.
-- ---------------------------------------------------------------------------
create table if not exists public.certificados (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique,
  usuario_id     uuid not null references public.perfis (id) on delete cascade,
  curso_id       uuid not null references public.cursos (id),
  emitido_em     date not null,
  data_validade  date            -- null = curso sem validade
);

alter table public.certificados enable row level security;

drop policy if exists certificados_select_proprio_ou_admin on public.certificados;
create policy certificados_select_proprio_ou_admin on public.certificados
  for select to authenticated
  using (usuario_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Permissões de tabela (a RLS acima decide quais linhas cada um vê).
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.cursos, public.turmas to anon, authenticated;
grant select on public.perfis, public.matriculas, public.certificados to authenticated;
grant execute on function public.is_admin() to authenticated;
