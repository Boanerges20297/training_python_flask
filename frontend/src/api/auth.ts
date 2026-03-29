import api from './config';

export async function login(email: string, senha: string) {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao realizar login';
  }
}
