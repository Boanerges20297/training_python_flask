export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  senha?: string;
}

export interface Servico {
  id: number;
  nome: string;
  descricao?: string;
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
  data_criacao?: string;
  status?: string;
  observacoes: string;
}

export interface Barbeiro {
  id?: number;
  nome: string;
  especialidade: string;
  email: string;
  telefone: string;
  senha?: string;
  ativo: boolean;
}

// Tipos de autenticação
export type UserRole = 'admin' | 'barbeiro' | 'cliente';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  sucesso?: boolean;
  mensagem?: string;
  dados?: {
    usuario: AuthUser;
    token: string;
  }
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  items_nessa_pagina: number;
  pagina: number;
  per_page: number;
  total_paginas: number;
  tem_proxima: boolean;
  tem_pagina_anterior: boolean;
}

export interface ApiResponse<T = any> {
  sucesso?: boolean;
  mensagem?: string;
  dados?: T;
  erros_de_validacao?: Record<string, string>;
}
