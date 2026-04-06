// Gabriel (Dev 1) - API de agendamentos
import api from './config';
import type { Agendamento } from '../types';

export async function getAgendamentos(): Promise<Agendamento[]> {
  try {
    const response = await api.get('/agendamento/listar-agendamento');
    return response.data.agendamentos || [];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
}

export async function createAgendamento(agendamento: Omit<Agendamento, 'id'>): Promise<Agendamento> {
  try {
    const response = await api.post('/agendamento/criar-agendamento', agendamento);
    return response.data.agendamento;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao criar agendamento';
  }
}
export async function updateAgendamento(id: number, agendamento: Partial<Agendamento>): Promise<boolean> {
  try {
    await api.put(`/agendamento/editar-agendamento/${id}`, agendamento);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return false;
  }
}

export async function deleteAgendamento(id: number): Promise<boolean> {
  try {
    await api.delete(`/agendamento/deletar-agendamento/${id}`);
    return true;
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return false;
  }
}
