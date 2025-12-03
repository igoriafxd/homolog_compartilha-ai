// src/services/api.js
import axios from 'axios';

// Cria uma "instância" do axios. É como criar um cliente de API pré-configurado.
const api = axios.create({
  // A URL base para todas as chamadas. Vem da nossa variável de ambiente.
  // O `||` serve como um fallback (plano B) caso a variável não esteja definida.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_SECRET_TOKEN
  }
});

// Exportamos a instância para que outros componentes possam usá-la.
export default api;