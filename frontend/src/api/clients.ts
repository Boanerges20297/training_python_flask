import api from './config';
import type { Cliente } from '../types';

export async function getClientes(): Promise<Cliente[]> {
  try {
    const response = await api.get('/clientes/');
    return response.data.clientes || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function createCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
  try {
    const response = await api.post('/clientes/criar-cliente', cliente);
    return response.data.cliente;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao criar cliente';
  }
}
export async function updateCliente(id: number, cliente: Partial<Cliente>): Promise<boolean> {
  try {
    await api.put(`/clientes/editar-cliente/${id}`, cliente);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return false;
  }
}

export async function deleteCliente(id: number): Promise<boolean> {
  try {
    await api.delete(`/clientes/deletar-cliente/${id}`, {
      headers: { 'X-Role': 'admin' }
    });
    return true;
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return false;
  }
}
