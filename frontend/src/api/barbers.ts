// Gabriel (Dev 1) - API de barbeiros
// Atualizado para o padrão RESTful do backend (Vinicius - 15/04/2026)
import api from './config';
import type { Barbeiro, PaginatedResponse } from '../types';

export async function getBarbeiros(page = 1, per_page = 10): Promise<PaginatedResponse<Barbeiro>> {
  try {
    const response = await api.get('/barbeiros/', {
      params: { page, per_page }
    });
    return response.data.dados;
  } catch (error) {
    console.error("Error fetching barbers:", error);
    return { items: [], total: 0, items_nessa_pagina: 0, pagina: 1, per_page: 10, total_paginas: 1, tem_proxima: false, tem_pagina_anterior: false };
  }
}

export async function createBarbeiro(barbeiro: Omit<Barbeiro, 'id'>): Promise<Barbeiro> {
  try {
    const response = await api.post('/barbeiros/', barbeiro);
    return response.data.dados.barbeiro;
  } catch (error: any) {
    throw error.response?.data?.erro || error.response?.data?.erros_validacao || 'Erro ao criar barbeiro';
  }
}

export async function updateBarbeiro(id: number, barbeiro: Partial<Barbeiro>): Promise<boolean> {
  try {
    await api.patch(`/barbeiros/${id}`, barbeiro);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar barbeiro:", error);
    return false;
  }
}

// felipe
// remove o barbeiro pelo id — autenticação via cookie JWT (withCredentials no config.ts)
export async function deleteBarbeiro(id: number): Promise<boolean> {
  try {
    await api.delete(`/barbeiros/${id}`);
    return true;
  } catch (error) {
    console.error("Erro ao deletar barbeiro:", error);
    return false;
  }
}
