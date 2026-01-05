# 📦 Documentação do Banco de Dados - CompartilhaAI

Esta pasta contém toda a documentação e scripts necessários para criar/recriar o banco de dados no Supabase.

---

## 📁 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Este arquivo - visão geral |
| `DICTIONARY.md` | Dicionário de dados (descrição de cada tabela/campo) |
| `01_schema.sql` | Script para criar todas as tabelas |
| `02_rls.sql` | Políticas de segurança (Row Level Security) |
| `03_functions.sql` | Funções auxiliares do banco |

---

## 🚀 Como Recriar o Banco

### Passo 1: Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Região: **South America (São Paulo)**

### Passo 2: Executar os scripts SQL
No Supabase, vá em **SQL Editor** e execute os arquivos **na ordem**:

```
1. 01_schema.sql    → Cria as tabelas
2. 02_rls.sql       → Configura segurança
3. 03_functions.sql → Cria funções auxiliares
```

### Passo 3: Configurar Storage (para fotos)
1. Vá em **Storage**
2. Crie um bucket chamado `avatars`
3. Configure como **público** para leitura

### Passo 4: Pegar as credenciais
1. Vá em **Project Settings** → **API**
2. Copie:
   - `Project URL`
   - `anon public key`
   - `service_role key` (secreta!)

### Passo 5: Atualizar o .env
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

---

## 📊 Diagrama das Tabelas

```
┌─────────────────┐
│  auth.users     │  ← Supabase Auth (automático)
│  (email, senha) │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐
│    profiles     │  ← Dados extras do usuário
│ (nome, telefone,│
│  avatar_url)    │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│    divisoes     │  ← Sessões de divisão de conta
│ (taxa, desconto,│
│  status)        │
└────────┬────────┘
         │ 1:N
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ itens  │ │pessoas │
└───┬────┘ └────────┘
    │ N:M      │
    └────┬─────┘
         ▼
┌─────────────────┐
│  atribuicoes    │  ← Quem consumiu o quê
│ (item, pessoa,  │
│  quantidade)    │
└─────────────────┘
```

---

## 🔐 Autenticação

O CompartilhaAI usa o **Supabase Auth** para login. Métodos suportados:

- ✅ Email + Senha
- ✅ Magic Link (email)
- 🔜 Google OAuth (futuro)
- 🔜 Login com telefone (futuro)

---

## 📝 Notas Importantes

1. **Nunca commite o `.env`** - Ele contém chaves secretas
2. **RLS está ativo** - Usuários só veem seus próprios dados
3. **Backups** - No plano Free não há backup automático. Exporte periodicamente!
4. **Pausa por inatividade** - Projetos Free pausam após 7 dias sem uso

---

## 🆘 Troubleshooting

### "Projeto pausado"
→ Vá no dashboard do Supabase e clique em "Restore project"

### "Permission denied"
→ Verifique se as políticas RLS estão corretas

### "Invalid API key"
→ Confira as chaves no `.env` (pode ter copiado errado)