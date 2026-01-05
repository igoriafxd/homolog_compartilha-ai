import google.generativeai as genai
import os
from dotenv import load_dotenv
import PIL.Image
import json
import logging

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

# Configura a API Key do Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Modelos com fallback
FALLBACK_MODELS = [
    "models/gemini-flash-latest",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-exp",
]

PROMPT = """
Você é um assistente especializado em extrair informações de comandas e notas fiscais.
Analise a imagem fornecida e extraia todos os itens de consumo. Para cada item, extraia o nome, a quantidade, o preço unitário e o preço total.

Sua resposta deve ser um objeto JSON contendo uma única chave "itens",
que é uma lista de objetos. Cada objeto deve ter quatro chaves:
- "item"
- "quantidade"
- "preco_unitario"
- "preco_total"

Ignore cabeçalho, rodapé, impostos, totais e informações de pagamento.
Se um item não tiver quantidade explícita, assuma que a quantidade é 1.
Se não conseguir identificar um dos campos, pode omiti-lo ou preenchê-lo com null.
"""


def scan_receipt_to_json(image_path: str) -> dict | None:
    """
    Analisa uma imagem de uma comanda usando o Gemini,
    extrai os itens e seus preços, e retorna um JSON estruturado.
    """
    # Carrega a imagem
    try:
        img = PIL.Image.open(image_path)
    except Exception as e:
        logger.error(f"Erro ao carregar imagem: {e}")
        return None

    # Tenta os modelos em sequência
    try:
        for model_name in FALLBACK_MODELS:
            try:
                logger.info(f"Tentando modelo: {model_name}")

                model = genai.GenerativeModel(model_name)
                response = model.generate_content([PROMPT, img])

                cleaned_response = (
                    response.text
                    .strip()
                    .replace("```json", "")
                    .replace("```", "")
                )

                return json.loads(cleaned_response)

            except json.JSONDecodeError as e:
                logger.warning(f"Resposta inválida do {model_name}: {e}")
                continue
            except Exception as e:
                logger.warning(f"Falha com {model_name}: {e}")
                continue

        logger.error("Nenhum modelo conseguiu gerar a resposta.")
        return None

    finally:
        img.close()  # Sempre fecha a imagem