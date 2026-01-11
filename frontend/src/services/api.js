// src/services/api.js
// Cliente HTTP que envia o token do Supabase automaticamente

import axios from 'axios';
import { supabase } from './supabase';

// Cria instância do axios pré-configurada
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
});

// Interceptor: adiciona o token em TODAS as requisições
api.interceptors.request.use(async (config) => {
  // Pega a sessão atual do Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    // Se tiver sessão, usa o token JWT do Supabase
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  // Mantém o token antigo como fallback (desenvolvimento)
  const apiToken = import.meta.env.VITE_API_SECRET_TOKEN;
  if (apiToken) {
    config.headers['X-API-Key'] = apiToken;
  }
  
  return config;
});

// Interceptor: trata erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Token expirado. Tentando renovar...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        await supabase.auth.signOut();
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;