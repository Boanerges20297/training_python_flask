import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser, AuthState, UserRole } from '../types';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth';
import { createLogger } from '../utils/logger';

// felipe
const logger = createLogger('AuthContext');

// felipe
// define o formato completo do contexto — o que os filhos vão consumir
interface AuthContextType extends AuthState {
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

// felipe
// cria o contexto com valor inicial undefined — useAuth verifica isso
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// felipe
// provedor que envolve o app e disponibiliza o estado de auth para todos os filhos
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // felipe
  // tenta restaurar sessão ao abrir o app — primeiro lê o sessionStorage,
  // depois valida com o backend para confirmar que o token ainda é válido
  useEffect(() => {
    async function restoreSession() {
      logger.debug('Tentando restaurar sessão...');

      const saved = sessionStorage.getItem('barba_user');
      if (!saved) {
        logger.debug('Nenhuma sessão salva encontrada');
        setIsLoading(false);
        return;
      }

      try {
        // valida com o backend — se o token expirou, getMe lança erro
        const currentUser = await getMe();
        setUser(currentUser);
        logger.info('Sessão restaurada com sucesso', { usuario: currentUser });
      } catch {
        // token inválido ou backend indisponível — limpa o estado local
        logger.warn('Sessão inválida — limpando dados locais');
        sessionStorage.removeItem('barba_user');
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // felipe
  // escuta o evento disparado pelo interceptor quando o refresh falha
  useEffect(() => {
    function handleForceLogout() {
      logger.warn('Evento auth:logout recebido — encerrando sessão');
      setUser(null);
      sessionStorage.removeItem('barba_user');
    }

    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  // felipe
  // chama a API de login, persiste o usuário e atualiza o estado global
  const login = useCallback(async (email: string, senha: string) => {
    logger.info('Iniciando login via contexto', { email });

    const data = await apiLogin(email, senha);

    // persiste no sessionStorage para sobreviver ao F5
    sessionStorage.setItem('barba_user', JSON.stringify(data.usuario));
    setUser(data.usuario);

    logger.info('Usuário autenticado', { usuario: data.usuario });
  }, []);

  // felipe
  // chama a API de logout, limpa o estado e o sessionStorage
  const logout = useCallback(async () => {
    logger.info('Iniciando logout via contexto');

    await apiLogout();

    sessionStorage.removeItem('barba_user');
    setUser(null);

    logger.info('Sessão encerrada');
  }, []);

  // felipe
  // verifica se o usuário atual possui o papel (role) exigido
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// exporta o contexto para ser consumido pelo useAuth
export { AuthContext };
