import api from './config';
import { createLogger } from '../utils/logger';
import type { LoginResponse, AuthUser } from '../types';

// felipe
const logger = createLogger('auth');

// felipe
// LOGIN
// Chamada quando o usuário preenche o formulário e clica "Entrar"
// Envia: { email, senha }
// Recebe: { msg, usuario: { id, nome, email, role }, token }
export async function login(email: string, senha: string): Promise<any> {
  try {
    logger.info('Login iniciado', { email });

    const response = await api.post<LoginResponse>('/auth/login', { email, senha });
    const usuario = response.data.dados?.usuario || (response.data as any).usuario;

    logger.info('Login bem-sucedido', { usuario });
    return { usuario, ...response.data };
  } catch (error: any) {
    logger.error('Falha no login', error);
    if (!error.response) {
      throw 'Erro de rede ou CORS: O servidor backend pode estar desligado ou inacessível. Detalhe: ' + error.message;
    }
    const errData = error.response.data || {};
    throw errData.msg || errData.mensagem || errData.Erro || errData.erro || JSON.stringify(errData) || 'Erro ao realizar login';
  }
}

// felipe
// LOGOUT
// Chamada quando o usuário clica em "Sair"
// Avisa o backend para invalidar o token (quando JWT estiver ativo)
// Envia: nada
// Recebe: { msg: "Logout realizado com sucesso" }
export async function logout(): Promise<void> {
  try {
    logger.info('Logout iniciado');

    await api.post('/auth/logout');

    logger.info('Logout realizado com sucesso');
  } catch (error: any) {
    // mesmo se o backend falhar, o frontend vai limpar a sessão local
    // por isso apenas logamos o erro sem relançar
    logger.warn('Logout falhou no backend — sessão local será limpa mesmo assim', error);
  }
}

// felipe
// REFRESH DE SESSÃO
// Chamada automaticamente pelo interceptor em api/config.ts
// quando uma requisição retorna 401 com token expirado
// O usuário nunca chama isso diretamente
// Envia: nada (o refresh token vem via cookie HttpOnly)
// Recebe: novo access token (via cookie, sem corpo de resposta)
export async function refreshSession(): Promise<void> {
  logger.debug('Tentando renovar token de sessão...');

  // não tem try/catch aqui: se falhar, o interceptor cuida do logout
  await api.post('/auth/refresh');

  logger.debug('Token renovado com sucesso');
}

// felipe
// VERIFICAR SESSÃO ATIVA (getMe)
// Chamada pelo AuthContext quando o app é aberto/recarregado
// Verifica se o token salvo ainda é válido antes de restaurar sessão
// Envia: nada (autenticação vem via cookie)
// Recebe: { usuario: AuthUser } ou 401 se sessão inválida
export async function getMe(): Promise<AuthUser> {
  logger.debug('Verificando sessão ativa...');

  const response = await api.get<any>('/auth/protected');
  const usuario = response.data.dados?.usuario || response.data.usuario;

  logger.debug('Sessão válida', { usuario });
  return usuario;
}

