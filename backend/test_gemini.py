import google.generativeai as genai
import os
from dotenv import load_dotenv

# Carrega variáveis do .env
load_dotenv()

# Configura Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

print("Testando conexao com Google Gemini...\n")

try:
    # Lista modelos disponíveis primeiro
    print("Modelos disponiveis:")
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"   - {model.name}")
    print()
    
    # Tenta diferentes versões do modelo
    modelos_tentar = [
        'gemini-pro-latest',
        'gemini-flash-latest',
        'gemini-pro'
    ]
    
    modelo_funcional = None
    
    for nome_modelo in modelos_tentar:
        try:
            print(f"Tentando: {nome_modelo}...")
            model = genai.GenerativeModel(nome_modelo)
            response = model.generate_content("Diga 'OK'")
            print(f"{nome_modelo} FUNCIONA!")
            modelo_funcional = nome_modelo
            break
        except Exception as e:
            print(f"{nome_modelo} nao funcionou")
            continue
    
    if modelo_funcional:
        print(f"\nSUCESSO! Modelo funcionando: {modelo_funcional}")
        print(f"Vamos usar esse modelo no projeto!")
    else:
        print("\nNenhum modelo funcionou")
    
except Exception as e:
    print(f"Erro geral:")
    print(f"   {str(e)}")
    print("\nVerifique:")
    print("   1. Se a chave esta correta no .env")
    print("   2. https://aistudio.google.com/app/apikey")