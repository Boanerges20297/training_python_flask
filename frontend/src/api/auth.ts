import api from './config';

export async function login(email: string, senha: string) {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao realizar login';
  }
}
export async function register(nome: string, email: string, senha: string) {
  try {
    const response = await api.post('/auth/register', { nome, email, senha });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao realizar cadastro';
  }
}

export async function forgotPassword(email: string) {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.erro || 'Erro ao recuperar senha';
  }
}
