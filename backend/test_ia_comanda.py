import os
from services.ia_scanner import scan_receipt_to_json
import json

# --- CONFIGURAÇÃO DO TESTE ---
# 1. Crie uma pasta chamada 'test_images' dentro da pasta 'backend'.
#    (Caminho final: backend/test_images/)
# 2. Coloque a foto de uma comanda real dentro desta pasta.
# 3. Atualize o valor da variável 'NOME_DO_ARQUIVO_DA_IMAGEM' abaixo.

NOME_DO_ARQUIVO_DA_IMAGEM = "conta_teste.png"  # <--- TROQUE ESTE NOME

# --- FIM DA CONFIGURAÇÃO ---


def testar_extracao_comanda():
    """
    Executa um teste prático na função de extração da IA.
    """
    # Constrói o caminho completo para a imagem de teste
    # O script é executado a partir da pasta 'backend', então o caminho é relativo a ela.
    caminho_da_imagem = os.path.join("test_images", NOME_DO_ARQUIVO_DA_IMAGEM)

    print("-" * 50)
    print(f"Iniciando teste com a imagem: {caminho_da_imagem}")
    print("-" * 50)

    if not os.path.exists(caminho_da_imagem):
        print(f"🚨 ERRO: Imagem de teste não encontrada!")
        print(f"   Verifique se o arquivo '{NOME_DO_ARQUIVO_DA_IMAGEM}' existe na pasta 'backend/test_images/'.")
        return

    # Chama a função principal do nosso serviço de IA
    resultado_json = scan_receipt_to_json(caminho_da_imagem)

    print("\n--- Resultado da IA ---")
    if resultado_json:
        # Imprime o JSON formatado para fácil leitura
        print(json.dumps(resultado_json, indent=2, ensure_ascii=False))
    else:
        print("A IA não retornou um resultado válido.")
    print("------------------------")
    print("\nTeste concluído.")


if __name__ == "__main__":
    # Este bloco permite que o script seja executado diretamente com 'python test_ia_comanda.py'
    testar_extracao_comanda()
