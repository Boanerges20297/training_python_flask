import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// felipe
// hook que consome o AuthContext com validação do provider
// lança erro descritivo se usado fora do AuthProvider
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider>');
  }

  return context;
}
