-- Avaliações dos cursos, exibidas na home e enviadas pelo formulário público.

create table if not exists public.avaliacoes_curso (
  id          uuid primary key default gen_random_uuid(),
  curso_id    uuid not null references public.cursos (id) on delete cascade,
  nome        text not null,
  nota        int  not null check (nota between 1 and 5),
  comentario  text,
  criado_em   timestamptz not null default now()
);

-- O formulário da home grava direto do navegador com a chave pública.
grant all on public.avaliacoes_curso to anon, authenticated;
