import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import type { UserRole } from '../types';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

// felipe
// componente que protege rotas/seções por autenticação e por papel (role)
// uso: <AuthGuard requiredRole="admin"><PainelAdmin /></AuthGuard>
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  // felipe
  // aguarda a verificação inicial de sessão para evitar flash de redirecionamento
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: '#94a3b8' }}>Verificando sessão...</p>
      </div>
    );
  }

  // felipe
  // redireciona para a raiz se não estiver autenticado
  // (App.tsx vai exibir o Login quando user for null)
  if (!isAuthenticated) {
    return null;
  }

  // felipe
  // bloqueia o acesso se o usuário não tiver o papel exigido
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: '#ef4444' }}>Acesso negado — permissão insuficiente.</p>
      </div>
    );
  }

  return <>{children}</>;
}
