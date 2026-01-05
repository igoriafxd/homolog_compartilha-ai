# 📖 Dicionário de Dados - CompartilhaAI

Documentação detalhada de todas as tabelas e campos do banco de dados.

---

## 🔐 Tabela: `profiles`

Armazena dados extras dos usuários (complementa o auth.users do Supabase).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `UUID` | ✅ PK, FK | ID do usuário (referência auth.users) |
| `nome` | `TEXT` | ✅ | Nome completo do usuário |
| `telefone` | `TEXT` | ❌ | Telefone com DDD (ex: 11999999999) |
| `avatar_url` | `TEXT` | ❌ | URL da foto de perfil no Storage |
| `created_at` | `TIMESTAMPTZ` | ✅ | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | ✅ | Data da última atualização |

**Índices:**
- `profiles_pkey` → PRIMARY KEY (id)

**Relacionamentos:**
- `id` → `auth.users.id` (1:1)

---

## 📋 Tabela: `divisoes`

Representa uma sessão de divisão de conta.

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `UUID` | ✅ PK | `gen_random_uuid()` | ID único da divisão |
| `user_id` | `UUID` | ✅ FK | - | Usuário que criou a divisão |
| `nome` | `TEXT` | ❌ | `'Divisão sem nome'` | Nome/descrição da divisão |
| `status` | `TEXT` | ✅ | `'em_andamento'` | Status: em_andamento, finalizada, cancelada |
| `taxa_servico_percentual` | `DECIMAL(5,2)` | ✅ | `10.00` | Taxa de serviço (%) |
| `desconto_valor` | `DECIMAL(10,2)` | ✅ | `0.00` | Valor do desconto (R$) |
| `created_at` | `TIMESTAMPTZ` | ✅ | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | ✅ | `NOW()` | Data da última atualização |
| `finalizada_at` | `TIMESTAMPTZ` | ❌ | - | Data de finalização |

**Índices:**
- `divisoes_pkey` → PRIMARY KEY (id)
- `divisoes_user_id_idx` → INDEX (user_id)
- `divisoes_status_idx` → INDEX (status)

**Relacionamentos:**
- `user_id` → `profiles.id` (N:1)

**Valores válidos para `status`:**
- `em_andamento` - Divisão ativa, itens sendo distribuídos
- `finalizada` - Divisão concluída
- `cancelada` - Divisão cancelada

---

## 🍕 Tabela: `itens`

Itens individuais de uma comanda.

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `UUID` | ✅ PK | `gen_random_uuid()` | ID único do item |
| `divisao_id` | `UUID` | ✅ FK | - | Divisão a qual pertence |
| `nome` | `TEXT` | ✅ | - | Nome do item (ex: "Coca-Cola") |
| `quantidade` | `DECIMAL(10,3)` | ✅ | `1` | Quantidade (aceita decimal: 0.5) |
| `valor_unitario` | `DECIMAL(10,2)` | ✅ | - | Preço unitário (R$) |
| `ordem` | `INTEGER` | ❌ | `0` | Ordem de exibição (uso futuro) |
| `created_at` | `TIMESTAMPTZ` | ✅ | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | ✅ | `NOW()` | Data da última atualização |

**Índices:**
- `itens_pkey` → PRIMARY KEY (id)
- `itens_divisao_id_idx` → INDEX (divisao_id)

**Relacionamentos:**
- `divisao_id` → `divisoes.id` (N:1) ON DELETE CASCADE

**Campos calculados (não armazenados):**
- `valor_total` = `quantidade * valor_unitario`

---

## 👥 Tabela: `pessoas`

Participantes de uma divisão de conta.

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `UUID` | ✅ PK | `gen_random_uuid()` | ID único da pessoa |
| `divisao_id` | `UUID` | ✅ FK | - | Divisão a qual pertence |
| `nome` | `TEXT` | ✅ | - | Nome da pessoa |
| `created_at` | `TIMESTAMPTZ` | ✅ | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | ✅ | `NOW()` | Data da última atualização |

**Índices:**
- `pessoas_pkey` → PRIMARY KEY (id)
- `pessoas_divisao_id_idx` → INDEX (divisao_id)

**Relacionamentos:**
- `divisao_id` → `divisoes.id` (N:1) ON DELETE CASCADE

**Observação:** Pessoa aqui é um participante da divisão, NÃO um usuário do sistema. Uma divisão pode ter pessoas que não têm conta no app.

---

## 🔗 Tabela: `atribuicoes`

Registra quem consumiu o quê (relação N:M entre itens e pessoas).

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `UUID` | ✅ PK | `gen_random_uuid()` | ID único da atribuição |
| `item_id` | `UUID` | ✅ FK | - | Item consumido |
| `pessoa_id` | `UUID` | ✅ FK | - | Pessoa que consumiu |
| `quantidade` | `DECIMAL(10,3)` | ✅ | - | Quantidade consumida |
| `created_at` | `TIMESTAMPTZ` | ✅ | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | ✅ | `NOW()` | Data da última atualização |

**Índices:**
- `atribuicoes_pkey` → PRIMARY KEY (id)
- `atribuicoes_item_id_idx` → INDEX (item_id)
- `atribuicoes_pessoa_id_idx` → INDEX (pessoa_id)
- `atribuicoes_item_pessoa_unique` → UNIQUE (item_id, pessoa_id)

**Relacionamentos:**
- `item_id` → `itens.id` (N:1) ON DELETE CASCADE
- `pessoa_id` → `pessoas.id` (N:1) ON DELETE CASCADE

**Regra de negócio:**
- A soma das `quantidade` de todas as atribuições de um item não pode exceder a `quantidade` do item.

---

## 📊 Resumo dos Relacionamentos

```
auth.users (Supabase)
    │
    │ 1:1
    ▼
profiles
    │
    │ 1:N (um usuário cria várias divisões)
    ▼
divisoes
    │
    ├── 1:N ──► itens
    │              │
    │              │ N:M
    │              ▼
    │          atribuicoes
    │              ▲
    │              │ N:M
    │              │
    └── 1:N ──► pessoas
```

---

## 🎨 Convenções Utilizadas

| Convenção | Exemplo |
|-----------|---------|
| Nomes de tabelas | Plural, minúsculo, snake_case: `divisoes` |
| Nomes de campos | Singular, minúsculo, snake_case: `valor_unitario` |
| Primary Keys | Sempre `id` do tipo `UUID` |
| Foreign Keys | Nome da tabela + `_id`: `divisao_id` |
| Timestamps | `created_at`, `updated_at`, `*_at` |
| Booleans | Prefixo `is_` ou `has_`: `is_ativo` |
| Valores monetários | `DECIMAL(10,2)` |
| Percentuais | `DECIMAL(5,2)` |

---

## 🔒 Políticas de Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) ativado:

| Tabela | Regra |
|--------|-------|
| `profiles` | Usuário vê/edita apenas seu próprio perfil |
| `divisoes` | Usuário vê/edita apenas suas divisões |
| `itens` | Usuário vê/edita itens de suas divisões |
| `pessoas` | Usuário vê/edita pessoas de suas divisões |
| `atribuicoes` | Usuário vê/edita atribuições de suas divisões |

Detalhes no arquivo `02_rls.sql`.