// Gabriel (Dev 1) - API de barbeiros
import api from './config';
import type { Barbeiro } from '../types';

export async function getBarbeiros(): Promise<Barbeiro[]> {
  try {
    const response = await api.get('/barbeiros/');
    return response.data.barbeiros || [];
  } catch (error) {
    console.error("Error fetching barbers:", error);
    return [];
  }
}

export async function createBarbeiro(barbeiro: Omit<Barbeiro, 'id'>): Promise<Barbeiro> {
  try {
    const response = await api.post('/barbeiros/criar-barbeiro', barbeiro);
    return response.data.barbeiro;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao criar barbeiro';
  }
}

export async function updateBarbeiro(id: number, barbeiro: Partial<Barbeiro>): Promise<boolean> {
  try {
    await api.put(`/barbeiros/editar-barbeiro/${id}`, barbeiro);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar barbeiro:", error);
    return false;
  }
}

export async function deleteBarbeiro(id: number): Promise<boolean> {
  try {
    await api.delete(`/barbeiros/deletar-barbeiro/${id}`, {
      headers: { 'X-Role': 'admin' }
    });
    return true;
  } catch (error) {
    console.error("Erro ao deletar barbeiro:", error);
    return false;
  }
}
