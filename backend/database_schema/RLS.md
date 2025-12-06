📘 Políticas de Segurança (RLS) – Sistema de Divisões e Distribuições

Este documento descreve todas as políticas RLS utilizadas no sistema, explicando:

O propósito de cada política

Onde ela atua

O SQL completo

A lógica aplicada

Diferença entre acesso anônimo (session_id) e autenticado (auth.uid())

🧩 Visão Geral da Arquitetura de Segurança

O sistema possui dois modos de acesso:

✔ 1. Acesso Anônimo

Usado em links públicos.

Autorização via header:

x-session-id


Este valor identifica a divisão pública que o visitante está acessando.

✔ 2. Acesso Autenticado

Quando o usuário está logado.

Autorização via:

auth.uid()


Cada usuário só acessa os próprios dados.

🗂 Tabelas Envolvidas
Tabela	Descrição
divisoes	Divisão criada por um usuário
itens	Itens da divisão
pessoas	Pessoas da divisão
item_pessoa	Distribuição de itens para pessoas
profiles	Perfil de usuários autenticados
🔐 1. Políticas da Tabela divisoes
### 1.1 allow_anonymous_access_by_session
Objetivo

Permitir que visitantes visualizem apenas divisões vinculadas ao x-session-id.

SQL
alter policy "allow_anonymous_access_by_session"
on "public"."divisoes"
to anon
using (
  (session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text))
)
with check (
  (session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text))
);

### 1.2 Users can manage own divisions
Objetivo

Usuários autenticados só podem visualizar e alterar suas próprias divisões.

SQL
alter policy "Users can manage own divisions"
on "public"."divisoes"
to authenticated
using (
  (auth.uid() = user_id)
)
with check (
  (auth.uid() = user_id)
);

🔐 2. Políticas da Tabela itens
### 2.1 allow_anonymous_access_to_items
Objetivo

Permitir que visitantes visualizem itens apenas de divisões públicas vinculadas ao x-session-id.

SQL
alter policy "allow_anonymous_access_to_items"
on "public"."itens"
to anon
using (
  (EXISTS (
    SELECT 1
    FROM divisoes
    WHERE (divisoes.id = itens.divisao_id)
      AND (divisoes.session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text))
  ))
)
with check (
  (EXISTS (
    SELECT 1
    FROM divisoes
    WHERE (divisoes.id = itens.divisao_id)
      AND (divisoes.session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text))
  ))
);

### 2.2 Users can manage own items
Objetivo

Permitir que usuários autenticados gerenciem apenas itens pertencentes às suas divisões.

SQL
alter policy "Users can manage own items"
on "public"."itens"
to authenticated
using (
  EXISTS (
    SELECT 1
    FROM divisoes
    WHERE (divisoes.id = itens.divisao_id)
      AND (divisoes.user_id = auth.uid())
  )
)
with check (
  EXISTS (
    SELECT 1
    FROM divisoes
    WHERE (divisoes.id = itens.divisao_id)
      AND (divisoes.user_id = auth.uid())
  )
);

🔐 3. Políticas da Tabela pessoas
### 3.1 allow_anonymous_access_to_people
Objetivo

Visitantes só podem acessar pessoas da divisão identificada pelo x-session-id.

SQL
alter policy "allow_anonymous_access_to_people"
on "public"."pessoas"
to anon
using (
  EXISTS (
    SELECT 1
    FROM divisoes
    WHERE (divisoes.id = pessoas.divisao_id)
      AND (divisoes.session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text))
  )
)
with check (
  EXISTS (
    SELECT 1
    FROM divisoes
    WHERE (divisoes.id = pessoas.divisao_id)
      AND (divisoes.session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text))
  )
);

### 3.2 Users can manage own people
Objetivo

Usuários autenticados só podem gerenciar pessoas de suas próprias divisões.

SQL
alter policy "Users can manage own people"
on "public"."pessoas"
to authenticated
using (
  EXISTS (
    SELECT 1
    FROM divisoes
    WHERE (divisoes.id = pessoas.divisao_id)
      AND (divisoes.user_id = auth.uid())
  )
)
with check (
  EXISTS (
    SELECT 1
    FROM divisoes
    WHERE (divisoes.id = pessoas.divisao_id)
      AND (divisoes.user_id = auth.uid())
  )
);

🔐 4. Políticas da Tabela item_pessoa (Distribuição)
### 4.1 allow_anonymous_access_to_distributions
Objetivo

Visitantes podem acessar distribuições somente da divisão pública vinculada ao x-session-id.

SQL
alter policy "allow_anonymous_access_to_distributions"
on "public"."item_pessoa"
to anon
using (
  EXISTS (
    SELECT 1
    FROM itens
    JOIN divisoes ON divisoes.id = itens.divisao_id
    WHERE (itens.id = item_pessoa.item_id)
      AND (divisoes.session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text))
  )
)
with check (
  EXISTS (
    SELECT 1
    FROM itens
    JOIN divisoes ON divisoes.id = itens.divisao_id
    WHERE (itens.id = item_pessoa.item_id)
      AND (divisoes.session_id = ((current_setting('request.headers'::text))::json ->> 'x-session-id'::text))
  )
);

### 4.2 Users can manage own item_pessoa
Objetivo

Usuários autenticados só podem atualizar distribuições de suas divisões.

SQL
alter policy "Users can manage own item_pessoa"
on "public"."item_pessoa"
to authenticated
using (
  EXISTS (
    SELECT 1
    FROM itens
    JOIN divisoes ON divisoes.id = itens.divisao_id
    WHERE (itens.id = item_pessoa.item_id)
      AND (divisoes.user_id = auth.uid())
  )
)
with check (
  EXISTS (
    SELECT 1
    FROM itens
    JOIN divisoes ON divisoes.id = itens.divisao_id
    WHERE (itens.id = item_pessoa.item_id)
      AND (divisoes.user_id = auth.uid())
  )
);

🔐 5. Políticas da Tabela profiles
### Users can manage own profile
Objetivo

Usuário autenticado só pode gerenciar o próprio perfil.

SQL
alter policy "Users can manage own profile"
on "public"."profiles"
to authenticated
using (
  (auth.uid() = id)
)
with check (
  (auth.uid() = id)
);

📌 Resumo Geral
Tabela	Acesso Anônimo	Acesso Autenticado
divisoes	Por session_id	Apenas divisões do usuário
itens	Itens da divisão pública	Itens da divisão do usuário
pessoas	Pessoas da divisão pública	Pessoas da divisão do usuário
item_pessoa	Distribuições da divisão pública	Distribuições do usuário
profiles	—	Apenas o próprio perfil