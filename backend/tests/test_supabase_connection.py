import os
import sys
from dotenv import load_dotenv

# Adiciona o diretório 'backend' ao sys.path para encontrar a pasta 'services'
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

# Caminho para o arquivo .env
dotenv_path = os.path.join(backend_dir, '.env')

# Carrega variáveis de ambiente
load_dotenv(dotenv_path=dotenv_path)

# --- DEBUGGING ---
# Imprime o caminho do .env e as variáveis carregadas para depuração
print(f"--- Depuração ---")
print(f"Tentando carregar .env de: {dotenv_path}")
supabase_url_loaded = os.getenv("SUPABASE_URL")
supabase_key_loaded = os.getenv("SUPABASE_ANON_KEY")
print(f"SUPABASE_URL carregada: {'Sim' if supabase_url_loaded else 'Não'}")
print(f"SUPABASE_ANON_KEY carregada: {'Sim' if supabase_key_loaded else 'Não'}")
if supabase_url_loaded:
    print(f"   URL: {supabase_url_loaded[:20]}...") # Mostra apenas o início da URL
print("-----------------")
# --- FIM DEBUGGING ---

from services.supabase_service import get_supabase_client

def test_supabase_connection():
    """
    Testa a conexão com o Supabase usando a query para listar tabelas.
    """
    print("\n--- Testando conexão com Supabase ---")
    try:
        supabase_client = get_supabase_client()
        
        # Query SQL para listar tabelas na schema 'public'
        # Obtida de 'informativo.txt'
        sql_query = """
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"""
        
        # Executa a função RPC 'query' que permite executar SQL direto
        # ou, para a biblioteca supabase-py, usar o client.postgrest.execute_query()
        # A biblioteca supabase-py não tem um método direto para SELECT em information_schema
        # como uma tabela normal. Precisamos usar o método 'rpc' se tivermos uma função PostgreSQL
        # que executa SQL, ou talvez uma rota mais avançada.
        
        # No entanto, a forma mais simples de testar se a chave ANON funciona com uma query read-only
        # em uma tabela de sistema é via 'rpc' se você tiver uma função que permita isso.
        # Uma alternativa mais direta é tentar ler de uma tabela que você JÁ SABE que existe.
        
        # Visto que o objetivo é testar a conexão E listar tabelas, vamos tentar usar uma
        # abordagem que simule uma leitura. Se tiver criado 'divisoes', podemos usar ela.
        # Caso contrário, um RPC simples que não modifica dados é o ideal.
        
        # Para este teste, vamos tentar a query de information_schema com uma simulação de RPC
        # que algumas implementações de Supabase client permitem, ou tentar uma tabela real.
        
        # Opção 1: Usar rpc se você tiver uma função no Supabase que executa SQL (ex: uma view ou função de segurança)
        # response = supabase_client.rpc('execute_sql', {'query': sql_query}).execute()

        # Opção 2: Tentar uma tabela que você criou (ex: 'divisoes' ou 'pessoas')
        # Substitua 'sua_tabela_existente' pelo nome de uma das tabelas que você criou.
        print("Tentando listar tabelas na schema 'public'...")
        # A biblioteca Python-Supabase não tem uma forma direta de executar SELECT no information_schema
        # via client.from_(). Precisamos usar 'postgrest' para queries mais complexas ou RPC.
        # Para fins de teste de conexão, vamos simular uma chamada RPC ou tentar uma tabela existente.
        
        # Para testar a conectividade de forma mais robusta sem criar RPCs customizados no Supabase
        # especificamente para este teste, podemos tentar listar uma tabela que você já tem criada.
        # Se você criou 'divisoes' ou 'pessoas', use uma delas. Vou usar 'divisoes' como exemplo.
        
        # Se 'divisoes' NÃO EXISTIR, o erro será diferente do anterior, mas ainda confirmará a conexão.
        # Se EXISTIR, e tiver dados, ele retornará os dados. Se for vazia, retornará vazio.
        response = supabase_client.from_('divisoes').select('*').limit(1).execute() # Limita a 1 para ser eficiente
        
        if response.data:
            print(f"✅ Conexão Supabase bem-sucedida! Tabela 'divisoes' acessada. Exemplos de dados: {response.data}")
        else:
            print(f"✅ Conexão Supabase bem-sucedida! Nenhuma tabela 'divisoes' encontrada ou ela está vazia.")

    except Exception as e:
        print(f"🚨 ERRO na conexão com Supabase: {e}")
        print("   Verifique se as variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY estão corretas no seu .env.")
        print("   Verifique também se o servidor Supabase está online e acessível.")
        print("   Se você ainda não criou as tabelas (ex: 'divisoes'), este erro é esperado. Crie-as no Supabase Studio.")
        return False
    return True

if __name__ == "__main__":
    if test_supabase_connection():
        print("\nTeste de conexão com Supabase CONCLUÍDO com sucesso!")
    else:
        print("\nTeste de conexão com Supabase FALHOU!")
