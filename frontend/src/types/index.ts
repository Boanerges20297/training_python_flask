export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
}

export interface Servico {
  id: number;
  nome: string;
  preco: number;
  duracao_minutos: number;
  barbeiro_id: number;
}

export interface Agendamento {
  id: number;
  cliente_id: number;
  barbeiro_id: number;
  servico_id: number;
  data_agendamento: string;
  observacoes: string;
}

export interface Barbeiro {
  id?: number;
  nome: string;
  especialidade: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

// felipe
// Tipos de autenticação

// os papéis possíveis no sistema — TypeScript rejeita qualquer outro valor
export type UserRole = 'admin' | 'barbeiro' | 'cliente';

// espelho exato do objeto "usuario" retornado pelo backend no login
export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: UserRole; // não é string genérica — só aceita os valores de UserRole
}

// a resposta completa do POST /api/auth/login
export interface LoginResponse {
  msg: string;
  usuario: AuthUser; // chave em português conforme o backend retorna
  token: string;     // por enquanto é um mock — futuramente será JWT
}

// o estado que o AuthContext vai gerenciar internamente
export interface AuthState {
  user: AuthUser | null; // null = nenhum usuário logado
  isAuthenticated: boolean;
  isLoading: boolean;    // true enquanto verifica sessão na inicialização
}