import type { Cliente, Barbeiro, Servico, Agendamento } from '../types';

const STORAGE_KEY = 'barbabyte_mock_db_v13';

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
    { id: 1, nome: 'Gabriel Castro', email: 'gabriel@email.com', telefone: '11999999999', observacoes: 'Cliente VIP, prefere corte degradê.', data_cadastro: '2026-04-10T10:00:00Z', data_atualizacao: '2026-04-20T14:30:00Z', status: 'devedor', divida_total: 80.00 },
    { id: 2, nome: 'Felipe Amorim', email: 'felipe@email.com', telefone: '11888888888', status: 'ativo', divida_total: 0, data_cadastro: '2026-04-12T09:00:00Z' },
    { id: 3, nome: 'Mariana Costa', email: 'mariana@email.com', telefone: '11777777777', status: 'ativo', divida_total: 0, data_cadastro: '2026-04-15T11:20:00Z' },
    { id: 4, nome: 'Rodrigo Faro', email: 'rodrigo@email.com', telefone: '11666666666', status: 'ausente', divida_total: 0, data_cadastro: '2026-04-18T16:45:00Z' },
    { id: 5, nome: 'Juliana Paes', email: 'juliana@email.com', telefone: '11555555555', status: 'ativo', divida_total: 0, data_cadastro: '2026-04-20T10:10:00Z' },
    { id: 6, nome: 'Arthur Aguiar', email: 'arthur@email.com', telefone: '11444444444', status: 'devedor', divida_total: 350.00, data_cadastro: '2026-03-01T10:00:00Z' },
    { id: 7, nome: 'Enzo Ferrari', email: 'enzo@email.com', telefone: '11333333333', status: 'devedor', divida_total: 120.00, data_cadastro: '2026-04-05T15:00:00Z' },
    { id: 8, nome: 'Bruno Mars', email: 'bruno@email.com', telefone: '11222222222', status: 'ativo', divida_total: 0, data_cadastro: '2026-04-18T09:00:00Z' },
    { id: 9, nome: 'Gusttavo Lima', email: 'gusttavo@email.com', telefone: '11111111111', status: 'devedor', divida_total: 210.00, data_cadastro: '2026-04-22T11:00:00Z' },
    { id: 10, nome: 'Zeca Pagodinho', email: 'zeca@email.com', telefone: '11000000000', status: 'devedor', divida_total: 45.00, data_cadastro: '2026-04-15T18:00:00Z' },
    { id: 11, nome: 'Neymar Jr', email: 'ney@email.com', telefone: '11911111111', status: 'ativo', divida_total: 0, data_cadastro: '2026-04-01T10:00:00Z' },
    { id: 12, nome: 'Lionel Messi', email: 'messi@email.com', telefone: '11922222222', status: 'devedor', divida_total: 150.00, data_cadastro: '2026-04-02T10:00:00Z' },
    { id: 13, nome: 'Cristiano Ronaldo', email: 'cr7@email.com', telefone: '11933333333', status: 'ativo', divida_total: 0, data_cadastro: '2026-04-03T10:00:00Z' },
    { id: 14, nome: 'Lewis Hamilton', email: 'lewis@email.com', telefone: '11944444444', status: 'devedor', divida_total: 45.00, data_cadastro: '2026-04-04T10:00:00Z' },
    { id: 15, nome: 'Max Verstappen', email: 'max@email.com', telefone: '11955555555', status: 'devedor', divida_total: 90.00, data_cadastro: '2026-04-05T10:00:00Z' }
  ],
  barbeiros: [
    { 
      id: 1, 
      nome: 'Pedro Alvares', 
      especialidades: ['corte_masculino', 'barba'], 
      email: 'pedro@barba.com', 
      telefone: '11777777777', 
      ativo: true,
      justificativa: '',
      servicos_ids: [1, 2, 4],
      data_cadastro: '2026-04-01T08:00:00Z',
      comissao_percentual: 50,
      imagem_url: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&h=100&fit=crop'
    },
    { 
      id: 2, 
      nome: 'Carlos Junior', 
      especialidades: ['barba'], 
      email: 'carlos@barba.com', 
      telefone: '11666666666', 
      ativo: true,
      justificativa: '',
      servicos_ids: [2, 3],
      data_cadastro: '2026-04-05T09:30:00Z',
      comissao_percentual: 50,
      imagem_url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop'
    },
    { 
      id: 3, 
      nome: 'Ana Luiza', 
      especialidades: ['coloracao', 'tratamento_capilar'], 
      email: 'ana@barba.com', 
      telefone: '11555555555', 
      ativo: true,
      justificativa: '',
      servicos_ids: [5],
      data_cadastro: '2026-04-10T14:00:00Z',
      comissao_percentual: 40,
      imagem_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop'
    },
    { 
      id: 4, 
      nome: 'Ricardo Silva', 
      especialidades: ['corte_masculino'], 
      email: 'ricardo@barba.com', 
      telefone: '11444444444', 
      ativo: true,
      justificativa: '',
      servicos_ids: [1, 3],
      data_cadastro: '2026-04-15T10:00:00Z',
      comissao_percentual: 45,
      imagem_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
    }
  ],
  servicos: [
    { id: 1, nome: 'Corte Degradê', preco: 45.00, duracao_minutos: 40, imagem_url: 'https://images.unsplash.com/photo-1621605815841-2879406db065?w=100&h=100&fit=crop', data_criacao: '2026-04-01T10:00:00Z' },
    { id: 2, nome: 'Barba Terapia', preco: 35.00, duracao_minutos: 30, imagem_url: 'https://images.unsplash.com/photo-1593702288056-7927b442d0fa?w=100&h=100&fit=crop', data_criacao: '2026-04-01T10:00:00Z' },
    { id: 3, nome: 'Combo Master', preco: 85.00, duracao_minutos: 60, imagem_url: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=100&h=100&fit=crop', data_criacao: '2026-04-01T10:00:00Z' },
    { id: 4, nome: 'Sobrancelha', preco: 25.00, duracao_minutos: 15, imagem_url: 'https://images.unsplash.com/photo-1481326056332-e2746f336e9d?w=100&h=100&fit=crop', data_criacao: '2026-04-05T12:00:00Z' },
    { id: 5, nome: 'Platinado', preco: 150.00, duracao_minutos: 120, imagem_url: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=100&h=100&fit=crop', data_criacao: '2026-04-10T15:00:00Z' },
    { id: 6, nome: 'Pigmentação', preco: 50.00, duracao_minutos: 30, imagem_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100&h=100&fit=crop', data_criacao: '2026-04-12T10:00:00Z' },
    { id: 7, nome: 'Corte Infantil', preco: 35.00, duracao_minutos: 30, imagem_url: 'https://images.unsplash.com/photo-1503910321444-4061f5280205?w=100&h=100&fit=crop', data_criacao: '2026-04-15T10:00:00Z' }
  ],
  agendamentos: [
    ...Array.from({ length: 60 }).map((_, i) => ({
      id: i + 1,
      cliente_id: (i % 15) + 1,
      barbeiro_id: (i % 4) + 1,
      servicos_ids: [(i % 7) + 1],
      data_agendamento: new Date(Date.now() - (i * 8 * 3600 * 1000)).toISOString().replace('Z', ''),
      status: i % 12 === 0 ? 'cancelado' : 'concluido',
      preco: [45, 35, 85, 25, 150, 50, 35][i % 7],
      pago: i % 5 !== 0,
      observacoes: '',
      data_criacao: new Date(Date.now() - (i * 10 * 3600 * 1000)).toISOString()
    }))
  ],
  currentSession: null
};

class Database {
  private data: MockDB;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.data = saved ? JSON.parse(saved) : initialData;
    
    // Migração: Garante que todos os agendamentos tenham servicos_ids (legado servico_id)
    if (this.data.agendamentos) {
      let migrated = false;
      this.data.agendamentos = this.data.agendamentos.map(a => {
        if (!a.servicos_ids && (a as any).servico_id) {
          migrated = true;
          return { ...a, servicos_ids: [(a as any).servico_id] };
        }
        return { ...a, servicos_ids: a.servicos_ids || [] };
      });
      if (migrated) this.save();
    }

    if (!saved) this.save();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('MockDB Quota Exceeded. Cleaning up...', e);
      // Se estourar a cota, mantemos apenas os últimos 50 agendamentos para liberar espaço
      if (this.data.agendamentos.length > 50) {
        this.data.agendamentos = this.data.agendamentos.slice(-50);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (retryError) {
          console.error('Failed to save even after cleanup', retryError);
        }
      }
    }
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
    
    const now = new Date().toISOString();
    const newItem = { 
      ...item, 
      id: newId,
      data_cadastro: (collection === 'clientes' || collection === 'barbeiros') ? now : undefined,
      data_criacao: (collection === 'servicos' || collection === 'agendamentos') ? now : undefined
    };
    
    items.push(newItem);

    // # Gabriel (Finanças) - Gatilho de auditoria na criação
    if (collection === 'agendamentos' && newItem.cliente_id) {
      this.recalculateDebt(newItem.cliente_id);
    }

    this.save();
    return newItem;
  }

  update<T extends keyof MockDB>(collection: T, id: number, updates: any) {
    const items = this.data[collection] as any[];
    const index = items.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      items[index] = { 
        ...items[index], 
        ...updates, 
        data_atualizacao: new Date().toISOString() 
      };

      // # Gabriel (Finanças) - Gatilho de auditoria financeira
      if (collection === 'agendamentos') {
        const clienteId = items[index].cliente_id;
        if (clienteId) this.recalculateDebt(clienteId);
      }
      
      // Se atualizar o cliente diretamente (ex: liquidar divida manualmente)
      if (collection === 'clientes' && updates.divida_total === 0) {
        // Marca todos os agendamentos dele como pagos
        this.data.agendamentos.forEach(a => {
          if (a.cliente_id === id && a.status === 'concluido') a.pago = true;
        });
      }

      this.save();
      return true;
    }
    return false;
  }

  private recalculateDebt(clienteId: number) {
    const agendamentos = this.data.agendamentos.filter(a => a.cliente_id === clienteId);
    const divida = agendamentos
      .filter(a => a.status === 'concluido' && !a.pago)
      .reduce((sum, a) => sum + (a.preco || 0), 0);

    const clienteIndex = this.data.clientes.findIndex(c => c.id === clienteId);
    if (clienteIndex !== -1) {
      this.data.clientes[clienteIndex].divida_total = divida;
      this.data.clientes[clienteIndex].status = divida > 0 ? 'devedor' : 'ativo';
    }
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
