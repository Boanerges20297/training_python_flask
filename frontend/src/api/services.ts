// Gabriel (Dev 1) - API de serviços
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
export async function updateServico(id: number, servico: Partial<Servico>): Promise<boolean> {
  try {
    await api.patch(`/servicos/editar-servico/${id}`, servico);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return false;
  }
}

export async function deleteServico(id: number): Promise<boolean> {
  try {
    await api.delete(`/servicos/deletar-servico/${id}`);
    return true;
  } catch (error) {
    console.error("Erro ao deletar serviço:", error);
    return false;
  }
}
