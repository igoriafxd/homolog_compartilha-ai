import google.generativeai as genai
import os
from dotenv import load_dotenv
import PIL.Image
import json

# Carrega variáveis de ambiente do arquivo .env que está na pasta `backend`.
# A biblioteca `dotenv` é inteligente e procura o arquivo nos diretórios corretos.
load_dotenv()

# Configura a API Key do Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def scan_receipt_to_json(image_path: str) -> dict:
    """
    Analisa uma imagem de uma comanda usando o Gemini,
    extrai os itens e seus preços, e retorna um JSON estruturado.

    Args:
        image_path: O caminho para o arquivo de imagem da comanda.

    Returns:
        Um dicionário com os itens extraídos ou None em caso de erro.
    """
    try:
        # Usamos um modelo multimodal capaz de entender texto e imagem
        model = genai.GenerativeModel('gemini-pro-latest')

        img = PIL.Image.open(image_path)

        prompt = """
        Você é um assistente especializado em extrair informações de comandas e notas fiscais.
        Analise a imagem fornecida e extraia todos os itens de consumo. Para cada item, extraia o nome, a quantidade, o preço unitário e o preço total.

        Sua resposta deve ser um objeto JSON contendo uma única chave "itens",
        que é uma lista de objetos. Cada objeto deve ter quatro chaves:
        - "item" (o nome do produto)
        - "quantidade" (o número de unidades)
        - "preco_unitario" (o valor de uma unidade)
        - "preco_total" (o valor total para aquele item)

        Exemplo de saída:
        {
          "itens": [
            { "item": "REFRIGERANTE COCA-COLA", "quantidade": 2, "preco_unitario": 8.50, "preco_total": 17.00 },
            { "item": "PRATO EXECUTIVO", "quantidade": 1, "preco_unitario": 32.00, "preco_total": 32.00 }
          ]
        }

        Ignore cabeçalho, rodapé, impostos, totais e informações de pagamento.
        Se um item não tiver quantidade explícita, assuma que a quantidade é 1.
        Se não conseguir identificar um dos campos, pode omiti-lo ou preenchê-lo com null.
        """

        response = model.generate_content([prompt, img])

        # Limpa a resposta para garantir que seja um JSON válido
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")

        return json.loads(cleaned_response)

    except Exception as e:
        print(f"Ocorreu um erro ao processar a imagem com a IA: {e}")
        return None