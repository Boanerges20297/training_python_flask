// Gabriel (Dev 1) - API de serviços
import api from './config';
import type { Servico, PaginatedResponse } from '../types';

export async function getServicos(page = 1, per_page = 10): Promise<PaginatedResponse<Servico>> {
  try {
    const response = await api.get('/servicos/', {
      params: { page, per_page }
    });
    return response.data.dados;
  } catch (error) {
    console.error("Error fetching services:", error);
    return { items: [], total: 0, items_nessa_pagina: 0, pagina: 1, per_page: 10, total_paginas: 1, tem_proxima: false, tem_pagina_anterior: false };
  }
}

export async function createServico(servico: Omit<Servico, 'id'>): Promise<Servico> {
  try {
    const response = await api.post('/servicos/criar-servico', servico);
    return response.data.dados.servico;
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
