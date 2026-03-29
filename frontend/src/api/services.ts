import api from './config';
import type { Servico } from '../types';

export async function getServicos(): Promise<Servico[]> {
  try {
    const response = await api.get('/servicos/');
    return response.data.servicos || [];
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export async function createServico(servico: Omit<Servico, 'id'>): Promise<Servico> {
  try {
    const response = await api.post('/servicos/criar-servico', servico);
    return response.data.servico;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao criar serviço';
  }
}
