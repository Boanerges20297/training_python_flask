import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import { createLogger } from '../utils/logger';

// felipe
const logger = createLogger('api');

export const API_URL = 'http://127.0.0.1:5000/api';

// instância base do Axios — todas as requisições do app usam esta instância
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // envia cookies automaticamente em toda requisição
});

// Gabriel - Helper para extrair o CSRF token do cookie
// O Flask-JWT-Extended salva o token CSRF em um cookie legível pelo JS
function getCsrfToken(): string | null {
  const name = 'csrf_access_token=';
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name)) {
      return trimmed.substring(name.length);
    }
  }
  return null;
}

// felipe
// INTERCEPTOR DE REQUISIÇÃO
// Executado antes de cada requisição sair do frontend
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // loga o método e a url para facilitar debug no DevTools
    logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`);

    // Gabriel - Injeta o CSRF token em requisições de escrita (POST, PATCH, PUT, DELETE)
    // O backend com JWT_COOKIE_CSRF_PROTECT=True exige esse header
    const method = config.method?.toUpperCase();
    if (method && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    // se houver erro ao montar a requisição, loga e repassa
    logger.error('Erro ao montar requisição', error);
    return Promise.reject(error);
  }
);

// felipe
// INTERCEPTOR DE RESPOSTA
// Executado após cada resposta chegar do backend
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // resposta bem-sucedida: loga o status e deixa passar
    logger.debug(`← ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // detecta 401 com token expirado (conforme retornado pelo backend Flask)
    const responseData = error.response?.data as Record<string, unknown> | undefined;
    const isTokenExpired =
      error.response?.status === 401 &&
      responseData?.msg === 'Token has expired';

    // _retry impede loop infinito: só tenta o refresh uma vez por requisição
    if (isTokenExpired && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        logger.info('Token expirado — tentando refresh silencioso...');

        // tenta renovar o access token usando o refresh token (cookie HttpOnly)
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });

        logger.info('Token renovado — reenviando requisição original');

        // reenvia a requisição original que havia falhado com 401
        return api(originalRequest);
      } catch (refreshError) {
        // refresh também falhou — sessão encerrada
        logger.warn('Refresh falhou — encerrando sessão');

        // dispara um evento global que o AuthContext vai escutar para fazer logout
        window.dispatchEvent(new Event('auth:logout'));

        return Promise.reject(refreshError);
      }
    }

    // qualquer outro erro (403, 404, 500...) passa direto sem interceptar
    logger.error(`← ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
