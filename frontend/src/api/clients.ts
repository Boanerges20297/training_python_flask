// Gabriel (Dev 1) - API de clientes
// Atualizado para o padrão RESTful do backend (Vinicius - 15/04/2026)
import api from './config';
import type { Cliente, PaginatedResponse } from '../types';

export async function getClientes(page = 1, per_page = 10): Promise<PaginatedResponse<Cliente>> {
  try {
    const response = await api.get('/clientes/', {
      params: { page, per_page }
    });
    return response.data.dados; // O backend já devolve o objeto paginado
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { items: [], total: 0, items_nessa_pagina: 0, pagina: 1, per_page: 10, total_paginas: 1, tem_proxima: false, tem_pagina_anterior: false };
  }
}

export async function createCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
  try {
    const response = await api.post('/clientes/', cliente);
    return response.data.dados.cliente;
  } catch (error: any) {
    throw error.response?.data?.erro || error.response?.data?.erros_validacao || 'Erro ao criar cliente';
  }
}

export async function updateCliente(id: number, cliente: Partial<Cliente>): Promise<boolean> {
  try {
    await api.patch(`/clientes/${id}`, cliente);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return false;
  }
}

// felipe
// remove o cliente pelo id — autenticação via cookie JWT (withCredentials no config.ts)
export async function deleteCliente(id: number): Promise<boolean> {
  try {
    await api.delete(`/clientes/${id}`);
    return true;
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return false;
  }
}
