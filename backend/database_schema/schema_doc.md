#### 📘 Documentação Simplificada do Banco de Dados (Supabase / Postgres)

##### 📝 Visão Geral

O banco é composto por 5 tabelas principais:

*   `divisoes`
*   `itens`
*   `pessoas`
*   `item_pessoa`
*   `profiles`

E uma tabela do sistema relacionada:

*   `auth.users` (do Supabase)

A estrutura representa um sistema de divisão de contas (itens, pessoas, divisões, relacionamento entre eles e usuário dono).

##### 📊 Tabela: `divisoes`

Representa uma divisão de conta (restaurante, bar etc).

| Campo          | Tipo         | Descrição                            |
| :------------- | :----------- | :----------------------------------- |
| `id`           | `uuid` (PK)  | Identificador da divisão             |
| `session_id`   | `text`       | ID temporário de sessão local        |
| `user_id`      | `uuid` (FK → profiles.id) | Dono da divisão                      |
| `desconto`     | `numeric(10,2)` | Desconto aplicado                    |
| `taxa_percentual` | `numeric(5,2)` | Taxa (ex: serviço 10%)               |
| `status`       | `text`       | Status (em_progresso, etc.)          |
| `created_at`   | `timestamptz` | Data de criação                      |
| `updated_at`   | `timestamptz` | Data de atualização                  |
| `obs`          | `text`       | Observações                          |

###### 🔗 Relações

*   1 usuário (`profiles`) → várias divisões (`divisoes`)
*   1 divisão → vários itens
*   1 divisão → várias pessoas

##### 📊 Tabela: `itens`

Representa um item consumido (pizza, cerveja, café etc).

| Campo          | Tipo            | Descrição           |
| :------------- | :-------------- | :------------------ |
| `id`           | `uuid` (PK)     | Identificador       |
| `divisao_id`   | `uuid` (FK → divisoes.id) | Divisão a que pertence |
| `nome`         | `text`          | Nome do item        |
| `quantidade`   | `numeric(10,3)` | Quantidade total    |
| `valor_unitario` | `numeric(10,2)` | Preço por unidade   |
| `created_at`   | `timestamptz`   | Criação             |

###### 🔗 Relações

*   1 divisão → vários itens
*   Relaciona-se com pessoas via tabela intermediária `item_pessoa`.

##### 📊 Tabela: `pessoas`

Pessoas participantes da divisão.

| Campo          | Tipo         | Descrição       |
| :------------- | :----------- | :-------------- |
| `id`           | `uuid` (PK)  | Identificador   |
| `divisao_id`   | `uuid` (FK → divisoes.id) | Divisão         |
| `nome`         | `text`       | Nome da pessoa  |
| `created_at`   | `timestamptz` | Criação         |

###### 🔗 Relações

*   1 divisão → várias pessoas
*   Relaciona-se com itens via tabela `item_pessoa`.

##### 📊 Tabela: `item_pessoa`

Tabela de relação N:N entre pessoas e itens.

Exemplo: Pizza dividida entre João e Maria.

| Campo          | Tipo            | Descrição                      |
| :------------- | :-------------- | :----------------------------- |
| `id`           | `uuid` (PK)     | Identificador                  |
| `item_id`      | `uuid` (FK → itens.id)    | Item                           |
| `pessoa_id`    | `uuid` (FK → pessoas.id)  | Pessoa                         |
| `quantidade`   | `numeric(10,3)` | Quanto dessa pessoa consumiu |
| `created_at`   | `timestamptz`   | Criação                        |

###### 🔗 Relações

*   Vários registros para um mesmo item (divisão por pessoas)
*   Vários registros para uma mesma pessoa (consumiu vários itens)

##### 📊 Tabela: `profiles`

Tabela espelho da tabela `auth.users`.

| Campo          | Tipo         | Descrição             |
| :------------- | :----------- | :-------------------- |
| `id`           | `uuid` (PK / FK → auth.users.id) | Usuário autenticado   |
| `email`        | `text`       | E-mail                |
| `full_name`    | `text`       | Nome                  |
| `avatar_url`   | `text`       | Foto                  |
| `phone`        | `text`       | Telefone              |
| `created_at`   | `timestamptz` | Cadastro              |
| `updated_at`   | `timestamptz` | Atualização           |

###### 🔗 Relações

*   1 profile → várias divisões

##### 🔗 Relações Gerais do Banco

`profiles` ━━━< `divisoes` ━━━< `itens`
             ┗━━━━━< `pessoas`

`itens` ━━━< `item_pessoa` >━━━ `pessoas`


Legenda:

*   `>━━━<` = relação muitos-para-muitos (N:N)
*   `━━━<` = relação um-para-muitos (1:N)

##### ✔️ Observações importantes

*   Cascades foram aplicados corretamente (ex: deletar uma divisão apaga itens, pessoas e item_pessoa).
*   Todas as tabelas usam UUID.
*   Estrutura é ideal para sistemas de split bill / dividir conta.
