import { http, HttpResponse, delay } from 'msw';
import { db } from './db';

const API_BASE = 'http://127.0.0.1:5000/api';

export const handlers = [
  // --- AUTH ---
  // Gabriel (Arquitetura) - Alinhado com Felipe (Task 10): Usando chave 'user' em vez de 'usuario'
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(300); // Reduzido para maior agilidade
    const { email } = await request.json() as any;
    return HttpResponse.json({
      token: 'fake-jwt-token',
      user: { id: 1, nome: email.split('@')[0], email, role: 'admin' }
    }, { status: 200 });
  }),

  // --- CLIENTES ---
  http.get(`${API_BASE}/clientes/`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);
    
    return HttpResponse.json(db.getPaginated('clientes', page, per_page));
  }),

  http.post(`${API_BASE}/clientes/criar-cliente`, async ({ request }) => {
    const data = await request.json();
    const newCliente = db.add('clientes', data);
    return HttpResponse.json({ cliente: newCliente }, { status: 201 });
  }),

  http.patch(`${API_BASE}/clientes/editar-cliente/:id`, async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    db.update('clientes', Number(id), data);
    return HttpResponse.json({ message: 'Cliente atualizado' });
  }),

  http.delete(`${API_BASE}/clientes/deletar-cliente/:id`, async ({ params }) => {
    const { id } = params;
    db.delete('clientes', Number(id));
    return HttpResponse.json({ message: 'Cliente deletado' });
  }),

  // --- BARBEIROS ---
  http.get(`${API_BASE}/barbeiros/`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);
    
    return HttpResponse.json(db.getPaginated('barbeiros', page, per_page));
  }),

  http.post(`${API_BASE}/barbeiros/criar-barbeiro`, async ({ request }) => {
    const data = await request.json();
    const newBarbeiro = db.add('barbeiros', data);
    return HttpResponse.json({ barbeiro: newBarbeiro }, { status: 201 });
  }),

  http.patch(`${API_BASE}/barbeiros/editar-barbeiro/:id`, async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    db.update('barbeiros', Number(id), data);
    return HttpResponse.json({ message: 'Barbeiro atualizado' });
  }),

  http.delete(`${API_BASE}/barbeiros/deletar-barbeiro/:id`, async ({ params }) => {
    const { id } = params;
    db.delete('barbeiros', Number(id));
    return HttpResponse.json({ message: 'Barbeiro deletado' });
  }),

  // --- SERVIÇOS ---
  http.get(`${API_BASE}/servicos/`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);
    
    return HttpResponse.json(db.getPaginated('servicos', page, per_page));
  }),

  http.post(`${API_BASE}/servicos/criar-servico`, async ({ request }) => {
    const data = await request.json();
    const newServico = db.add('servicos', data);
    return HttpResponse.json({ servico: newServico }, { status: 201 });
  }),

  http.patch(`${API_BASE}/servicos/editar-servico/:id`, async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    db.update('servicos', Number(id), data);
    return HttpResponse.json({ message: 'Serviço atualizado' });
  }),

  http.delete(`${API_BASE}/servicos/deletar-servico/:id`, async ({ params }) => {
    const { id } = params;
    db.delete('servicos', Number(id));
    return HttpResponse.json({ message: 'Serviço deletado' });
  }),

  // --- AGENDAMENTOS ---
  http.get(`${API_BASE}/agendamento/listar-agendamento`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);
    
    return HttpResponse.json(db.getPaginated('agendamentos', page, per_page));
  }),

  http.post(`${API_BASE}/agendamento/criar-agendamento`, async ({ request }) => {
    const data = await request.json();
    const newAgend = db.add('agendamentos', data);
    return HttpResponse.json({ agendamento: newAgend }, { status: 201 });
  }),

  http.put(`${API_BASE}/agendamento/editar-agendamento/:id`, async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    db.update('agendamentos', Number(id), data);
    return HttpResponse.json({ message: 'Agendamento atualizado' });
  }),

  http.delete(`${API_BASE}/agendamento/deletar-agendamento/:id`, async ({ params }) => {
    const { id } = params;
    db.delete('agendamentos', Number(id));
    return HttpResponse.json({ message: 'Agendamento deletado' });
  })
];
