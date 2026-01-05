# 🧾 CompartilhaAI

Sistema inteligente para leitura e divisão de comandas usando IA.

🔗 **Demo:** [compartilha-ai.vercel.app](https://compartilha-ai.vercel.app)

---

## 📋 Sobre o Projeto

O CompartilhaAI utiliza Inteligência Artificial (Google Gemini) para escanear fotos de comandas de restaurantes e extrair automaticamente os itens e valores, facilitando a divisão da conta entre amigos.

### ✨ Funcionalidades

- 📸 Escaneamento de comandas por foto
- 🤖 Extração automática de itens via IA
- 💰 Cálculo automático de divisão
- 👥 Compartilhamento fácil entre participantes

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- Python 3.10+
- Conta no [Google AI Studio](https://aistudio.google.com/) para a API Key do Gemini

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/igoriafxd/compartilha-ai.git
   cd compartilha-ai
   ```

2. **Configure o Backend**
   ```bash
   # Crie e ative o ambiente virtual
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou: venv\Scripts\activate  # Windows
   
   # Instale as dependências
   pip install -r requirements.txt
   ```

3. **Configure a API Key do Gemini**
   ```bash
   # Crie o arquivo .env na pasta backend
   echo "GOOGLE_API_KEY=sua_chave_aqui" > backend/.env
   ```
   
   > 📌 Pegue sua chave em: https://aistudio.google.com/app/apikey

4. **Configure o Frontend**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Rodando o Projeto

**Terminal 1 - Backend (na raiz do projeto):**
```bash
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001
```
O backend vai rodar em `http://localhost:8001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
O frontend vai rodar em `http://localhost:5173`

---

## 🛠️ Tecnologias

### Backend
- Python 3.10+
- FastAPI
- Google Gemini AI

### Frontend
- React + Vite
- JavaScript
- Tailwind CSS

### Deploy
- **Frontend:** Vercel
- **Backend:** Render

---

## 📁 Estrutura do Projeto

```
compartilha-ai/
├── backend/
│   ├── services/
│   │   └── ia_scanner.py
│   ├── main.py
│   ├── schemas.py
│   └── .env
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
├── Procfile
├── requirements.txt
└── README.md
```

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `GOOGLE_API_KEY` | Chave da API Google Gemini | [AI Studio](https://aistudio.google.com/app/apikey) |

---

## 👤 Autor

**Igor** - [@igoriafxd](https://github.com/igoriafxd)

---

⭐ Gostou? Deixe uma estrela!