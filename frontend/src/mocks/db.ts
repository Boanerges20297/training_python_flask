import type { Cliente, Barbeiro, Servico, Agendamento } from '../types';

const STORAGE_KEY = 'barbabyte_mock_db_v2';

interface MockDB {
  clientes: Cliente[];
  barbeiros: Barbeiro[];
  servicos: Servico[];
  agendamentos: Agendamento[];
}

// Inicia vazio conforme solicitado: Experiência de criar do zero
const initialData: MockDB = {
  clientes: [],
  barbeiros: [],
  servicos: [],
  agendamentos: []
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
}

export const db = new Database();
