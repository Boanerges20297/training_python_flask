// Gabriel (Dev 1) - API de agendamentos
// Atualizado para o padrão RESTful do backend (Vinicius - 15/04/2026)
import api from './config';
import type { Agendamento, PaginatedResponse } from '../types';

export async function getAgendamentos(page = 1, per_page = 10): Promise<PaginatedResponse<Agendamento>> {
  try {
    const response = await api.get('/agendamento', {
      params: { page, per_page }
    });
    return response.data.dados;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return { items: [], total: 0, items_nessa_pagina: 0, pagina: 1, per_page: 10, total_paginas: 1, tem_proxima: false, tem_pagina_anterior: false };
  }
}

export async function createAgendamento(agendamento: Omit<Agendamento, 'id'>): Promise<Agendamento> {
  try {
    const response = await api.post('/agendamento', agendamento);
    return response.data.dados.agendamento;
  } catch (error: any) {
    throw error.response?.data?.erro || error.response?.data?.erros_validacao || 'Erro ao criar agendamento';
  }
}

export async function updateAgendamento(id: number, agendamento: Partial<Agendamento>): Promise<boolean> {
  try {
    await api.patch(`/agendamento/${id}`, agendamento);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return false;
  }
}

export async function deleteAgendamento(id: number): Promise<boolean> {
  try {
    await api.delete(`/agendamento/${id}`);
    return true;
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return false;
  }
}
