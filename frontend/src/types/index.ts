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
  observacoes: string;
  status?: string; // "pendente" | "confirmado" | "concluido" | "cancelado"
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

// --- Dashboard Types ---
export interface HorarioPopular {
  hora: number;
  total_agendamentos: number;
}

export interface ReceitaDiaria {
  data: string; // YYYY-MM-DD
  receita: number;
  agendamentos_concluidos: number;
  agendamentos_pendentes: number;
}

export interface ServicoRealizado {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  receita: number;
}

export interface BarbeiroDesempenho {
  barbeiro_id: number;
  barbeiro_nome: string;
  total_agendamentos: number;
  agendamentos_concluidos: number;
  agendamentos_cancelados: number;
  receita_total: number;
  tempo_total_minutos: number;
  servicos_realizados: ServicoRealizado[];
  taxa_conclusao: number;
}

export interface DashboardData {
  periodo_inicio: string;
  periodo_fim: string;
  receita_total: number;
  agendamentos_total: number;
  agendamentos_concluidos: number;
  agendamentos_cancelados: number;
  agendamentos_pendentes: number;
  ticket_medio: number;
  top_5_horarios: HorarioPopular[];
  receita_diaria: ReceitaDiaria[];
  barbeiros_desempenho: BarbeiroDesempenho[];
}

export interface ApiResponse<T = any> {
  sucesso?: boolean;
  mensagem?: string;
  dados?: T;
  erros_de_validacao?: Record<string, string>;
}
