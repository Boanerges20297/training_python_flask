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
}

export interface Agendamento {
  id: number;
  cliente_id: number;
  barbeiro_id: number;
  servico_id: number;
  data_agendamento: string;
  observacoes: string;
}
