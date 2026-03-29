import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export type Cliente = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
}

export const getClientes = async (): Promise<Cliente[]> => {
  try {
    const response = await axios.get(`${API_URL}/clientes/`);
    return response.data.clientes;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
};
