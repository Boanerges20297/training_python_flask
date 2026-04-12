// Gabriel (Dev 1) - API de agendamentos
import api from './config';
import type { Agendamento, PaginatedResponse } from '../types';

export async function getAgendamentos(page = 1, per_page = 10): Promise<PaginatedResponse<Agendamento>> {
  try {
    const response = await api.get('/agendamento/listar-agendamento', {
      params: { page, per_page }
    });
    return response.data; // O mock já devolve o objeto paginado
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return { items: [], total: 0, items_nessa_pagina: 0, pagina: 1, per_page: 10, total_paginas: 1, tem_proxima: false, tem_pagina_anterior: false };
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
