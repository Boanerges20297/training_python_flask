import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

export type Cliente = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
};

export type Servico = {
  id: number;
  nome: string;
  preco: number;
  duracao_minutos: number;
};

export type Agendamento = {
  id: number;
  cliente_id: number;
  barbeiro_id: number;
  servico_id: number;
  data_agendamento: string;
  observacoes: string;
};

export async function getClientes(): Promise<Cliente[]> {
  try {
    const response = await axios.get(`${API_URL}/clientes/`);
    return response.data.clientes || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function getServicos(): Promise<Servico[]> {
  try {
    const response = await axios.get(`${API_URL}/servicos/`);
    return response.data.servicos || [];
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export async function getAgendamentos(): Promise<Agendamento[]> {
  try {
    const response = await axios.get(`${API_URL}/agendamento/listar-agendamento`);
    return response.data.agendamentos || [];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
}

export async function createCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
  try {
    const response = await axios.post(`${API_URL}/clientes/criar-cliente`, cliente);
    return response.data.cliente;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao criar cliente';
  }
}

export async function createServico(servico: Omit<Servico, 'id'>): Promise<Servico> {
  try {
    const response = await axios.post(`${API_URL}/servicos/criar-servico`, servico);
    return response.data.servico;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao criar serviço';
  }
}

export async function createAgendamento(agendamento: Omit<Agendamento, 'id'>): Promise<Agendamento> {
  try {
    const response = await axios.post(`${API_URL}/agendamento/criar-agendamento`, agendamento);
    return response.data.agendamento;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao criar agendamento';
  }
}

export async function login(email: string, senha: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao realizar login';
  }
}
