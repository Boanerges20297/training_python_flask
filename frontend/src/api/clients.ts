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
