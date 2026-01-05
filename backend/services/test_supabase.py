# Teste de conexão com Supabase
# Execute da raiz do projeto: python backend/services/test_supabase.py

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.services.supabase_client import supabase, supabase_admin

print("=" * 50)
print("🧪 Testando conexão com Supabase")
print("=" * 50)

# Teste 1: Verificar se cliente foi criado
if supabase:
    print("✅ Cliente Supabase conectado!")
else:
    print("❌ Falha ao conectar cliente Supabase")
    exit(1)

if supabase_admin:
    print("✅ Cliente Admin conectado!")
else:
    print("⚠️ Cliente Admin não configurado (ok para dev)")

# Teste 2: Listar tabelas (usando admin para bypassar RLS)
print("\n📋 Testando acesso às tabelas...")

try:
    # Tenta buscar da tabela profiles (deve retornar vazio, mas sem erro)
    result = supabase_admin.table("profiles").select("*").limit(1).execute()
    print(f"✅ Tabela 'profiles' acessível")
except Exception as e:
    print(f"❌ Erro ao acessar 'profiles': {e}")

try:
    result = supabase_admin.table("divisoes").select("*").limit(1).execute()
    print(f"✅ Tabela 'divisoes' acessível")
except Exception as e:
    print(f"❌ Erro ao acessar 'divisoes': {e}")

try:
    result = supabase_admin.table("itens").select("*").limit(1).execute()
    print(f"✅ Tabela 'itens' acessível")
except Exception as e:
    print(f"❌ Erro ao acessar 'itens': {e}")

try:
    result = supabase_admin.table("pessoas").select("*").limit(1).execute()
    print(f"✅ Tabela 'pessoas' acessível")
except Exception as e:
    print(f"❌ Erro ao acessar 'pessoas': {e}")

try:
    result = supabase_admin.table("atribuicoes").select("*").limit(1).execute()
    print(f"✅ Tabela 'atribuicoes' acessível")
except Exception as e:
    print(f"❌ Erro ao acessar 'atribuicoes': {e}")

print("\n" + "=" * 50)
print("🎉 Teste concluído!")
print("=" * 50)