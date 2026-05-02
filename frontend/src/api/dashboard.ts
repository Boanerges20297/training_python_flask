import api from './config';
import type { DashboardData } from '../types';

export const getDashboardInfo = async (dias: number = 30): Promise<DashboardData> => {
  try {
    const response = await api.get('/dashboard/geral', {
      params: { dias }
    });
    return response.data.dados;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao carregar dados do dashboard';
  }
};
