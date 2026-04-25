import type { Cliente, Barbeiro, Servico, Agendamento } from '../types';

const STORAGE_KEY = 'barbabyte_mock_db_v4';

interface MockDB {
  clientes: Cliente[];
  barbeiros: Barbeiro[];
  servicos: Servico[];
  agendamentos: Agendamento[];
  currentSession: any | null;
}

// Dados iniciais para testes imediatos (Populado para evitar tela vazia no desenvolvimento)
const initialData: MockDB = {
  clientes: [
    { 
      id: 1, 
      nome: 'Gabriel Castro', 
      email: 'gabriel@email.com', 
      telefone: '11999999999', 
      observacoes: 'Cliente VIP, prefere corte degradê.' 
    },
    { 
      id: 2, 
      nome: 'Felipe Amorim', 
      email: 'felipe@email.com', 
      telefone: '11888888888', 
      observacoes: 'Inadimplente no mês de Março. Cobrar taxa de atraso.' 
    }
  ],
  barbeiros: [
    { 
      id: 1, 
      nome: 'Pedro Alvares', 
      especialidade: 'corte_masculino', 
      email: 'pedro@barba.com', 
      telefone: '11777777777', 
      ativo: true,
      justificativa: '',
      servicos_ids: [1, 2] 
    },
    { 
      id: 2, 
      nome: 'Carlos Junior', 
      especialidade: 'barba', 
      email: 'carlos@barba.com', 
      telefone: '11666666666', 
      ativo: false,
      justificativa: 'Afastado para curso de especialização em SP.',
      servicos_ids: [3]
    }
  ],
  servicos: [
    { 
      id: 1, 
      nome: 'Corte Degradê', 
      preco: 45.00, 
      duracao_minutos: 40,
      imagem_url: 'https://images.unsplash.com/photo-1599351431247-f10b218d73b2?w=100&h=100&fit=crop'
    },
    { 
      id: 2, 
      nome: 'Barba Terapia', 
      preco: 30.00, 
      duracao_minutos: 30,
      imagem_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop'
    },
    { 
      id: 3, 
      nome: 'Combo Master', 
      preco: 70.00, 
      duracao_minutos: 60,
      imagem_url: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=100&h=100&fit=crop'
    }
  ],
  agendamentos: [],
  currentSession: null
};

class Database {
  private data: MockDB;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.data = saved ? JSON.parse(saved) : initialData;
    if (!saved) this.save();
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getAll<T extends keyof MockDB>(collection: T): MockDB[T] {
    return this.data[collection];
  }

  // Helper para paginação idêntica ao Backend
  getPaginated<T extends keyof MockDB>(
    collection: T, 
    page: number = 1, 
    per_page: number = 10
  ) {
    const items = this.data[collection] as any[];
    const total = items.length;
    const start = (page - 1) * per_page;
    const end = start + per_page;
    const paginatedItems = items.slice(start, end);

    return {
      items: paginatedItems,
      total,
      items_nessa_pagina: paginatedItems.length,
      pagina: page,
      per_page,
      total_paginas: Math.ceil(total / per_page) || 1,
      tem_proxima: end < total,
      tem_pagina_anterior: page > 1
    };
  }

  getById<T extends keyof MockDB>(collection: T, id: number): MockDB[T][number] | undefined {
    return (this.data[collection] as any[]).find((item: any) => item.id === id);
  }

  add<T extends keyof MockDB>(collection: T, item: any) {
    const items = this.data[collection] as any[];
    const newId = items.length > 0 
      ? Math.max(...items.map((i: any) => i.id || 0)) + 1 
      : 1;
    const newItem = { ...item, id: newId };
    items.push(newItem);
    this.save();
    return newItem;
  }

  update<T extends keyof MockDB>(collection: T, id: number, updates: any) {
    const items = this.data[collection] as any[];
    const index = items.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  delete<T extends keyof MockDB>(collection: T, id: number) {
    const items = this.data[collection] as any[];
    const originalLength = items.length;
    this.data[collection] = items.filter((item: any) => item.id !== id) as any;
    if ((this.data[collection] as any[]).length < originalLength) {
      this.save();
      return true;
    }
    return false;
  }

  setSession(user: any | null) {
    this.data.currentSession = user;
    this.save();
  }

  getSession() {
    return this.data.currentSession;
  }
}

export const db = new Database();
