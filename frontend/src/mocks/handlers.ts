import { http, HttpResponse, delay } from 'msw';
import { db } from './db';

const API_BASE = 'http://localhost:5000/api';

export const handlers = [
  // --- AUTH ---
  // # felipe - Torna o login dinâmico para identificar barbeiros e clientes
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(300);
    const { email } = await request.json() as any;

    // Busca nas coleções do mock db
    const barbeiros = db.getAll('barbeiros');
    const clientes = db.getAll('clientes');

    let role = 'admin'; // Fallback
    let userId = 1;
    let userName = email.split('@')[0];

    const b = barbeiros.find(u => u.email === email);
    const c = clientes.find(u => u.email === email);

    if (b) {
      role = 'barbeiro';
      userId = b.id!;
      userName = b.nome;
    } else if (c) {
      role = 'cliente';
      userId = c.id!;
      userName = c.nome;
    } else if (!email.includes('admin')) {
      // Se não for admin conhecido e não estiver no banco, retorna erro
      return HttpResponse.json({ erro: "Usuário não encontrado no mock database" }, { status: 401 });
    }

    const usuario = { id: userId, nome: userName, email, role };
    db.setSession(usuario);

    return HttpResponse.json({
      sucesso: true,
      mensagem: `Login (${role}) realizado com sucesso`,
      dados: {
        token: 'fake-jwt-token',
        usuario
      }
    }, { status: 200 });
  }),

  // Mock de Cadastro (Register) - Registra como cliente com validação de email único
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    await delay(500);
    const { nome, email, telefone } = await request.json() as any;
    
    // Validação: email já existe?
    const clientes = db.getAll('clientes');
    const barbeiros = db.getAll('barbeiros');
    if (clientes.find(c => c.email === email) || barbeiros.find(b => b.email === email)) {
      return HttpResponse.json({ erro: 'Este e-mail já está cadastrado.' }, { status: 409 });
    }

    const newCliente = db.add('clientes', { nome, email, telefone: telefone || '', data_cadastro: new Date().toISOString() });
    const usuario = { id: newCliente.id, nome, email, role: 'cliente' as const };
    db.setSession(usuario);

    return HttpResponse.json({
      sucesso: true,
      dados: {
        token: 'fake-jwt-token-registered',
        usuario
      }
    }, { status: 201 });
  }),

  // Mock de Recuperação de Senha
  http.post(`${API_BASE}/auth/forgot-password`, async () => {
    await delay(800);
    return HttpResponse.json({ message: 'E-mail de recuperação enviado com sucesso se o usuário existir.' }, { status: 200 });
  }),

  // --- DASHBOARD ---
  http.get(`${API_BASE}/dashboard`, async ({ request }) => {
    await delay(600);
    const url = new URL(request.url);
    const dias = Number(url.searchParams.get('dias') || 30);
    
    // Simulando escala de dados por "dias"
    const fator = dias / 30;

    return HttpResponse.json({
      periodo_inicio: "2026-03-16T00:00:00Z",
      periodo_fim: "2026-04-15T23:59:59Z",
      receita_total: 3420.5 * fator,
      agendamentos_total: Math.round(98 * fator),
      agendamentos_concluidos: Math.round(76 * fator),
      agendamentos_cancelados: Math.round(12 * fator),
      agendamentos_pendentes: Math.round(10 * fator),
      ticket_medio: 45.01,
      top_5_horarios: [
        { hora: 9, total_agendamentos: Math.round(14 * fator) },
        { hora: 10, total_agendamentos: Math.round(11 * fator) },
        { hora: 14, total_agendamentos: Math.round(8 * fator) },
        { hora: 16, total_agendamentos: Math.round(7 * fator) },
        { hora: 18, total_agendamentos: Math.round(5 * fator) }
      ],
      receita_diaria: [
        { data: "2026-04-10", receita: 150.0 * fator, agendamentos_concluidos: 3, agendamentos_pendentes: 0 },
        { data: "2026-04-11", receita: 200.0 * fator, agendamentos_concluidos: 4, agendamentos_pendentes: 1 },
        { data: "2026-04-12", receita: 280.0 * fator, agendamentos_concluidos: 6, agendamentos_pendentes: 1 },
        { data: "2026-04-13", receita: 400.0 * fator, agendamentos_concluidos: 8, agendamentos_pendentes: 2 },
        { data: "2026-04-14", receita: 320.0 * fator, agendamentos_concluidos: 7, agendamentos_pendentes: 0 },
        { data: "2026-04-15", receita: 180.0 * fator, agendamentos_concluidos: 4, agendamentos_pendentes: 3 }
      ],
      barbeiros_desempenho: [
        {
          barbeiro_id: 1,
          barbeiro_nome: "Pedro",
          total_agendamentos: Math.round(30 * fator),
          agendamentos_concluidos: Math.round(25 * fator),
          agendamentos_cancelados: Math.round(2 * fator),
          receita_total: 1200.0 * fator,
          tempo_total_minutos: 900 * fator,
          servicos_realizados: [
            { nome: "Corte", quantidade: 15, preco_unitario: 40.0, receita: 600.0 },
            { nome: "Barba", quantidade: 10, preco_unitario: 30.0, receita: 300.0 }
          ],
          taxa_conclusao: 83.3
        },
        {
          barbeiro_id: 2,
          barbeiro_nome: "Carlos",
          total_agendamentos: Math.round(24 * fator),
          agendamentos_concluidos: Math.round(19 * fator),
          agendamentos_cancelados: Math.round(3 * fator),
          receita_total: 980.0 * fator,
          tempo_total_minutos: 760 * fator,
          servicos_realizados: [
            { nome: "Corte", quantidade: 10, preco_unitario: 40.0, receita: 400.0 }
          ],
          taxa_conclusao: 79.17
        }
      ]
    }, { status: 200 });
  }),

  http.post(`${API_BASE}/auth/refresh`, async () => {
    await delay(200);
    return HttpResponse.json({ msg: "Sessão renovada (mock)" }, { status: 200 });
  }),

  http.post(`${API_BASE}/auth/logout`, async () => {
    await delay(100);
    db.setSession(null);
    return HttpResponse.json({ msg: "Logout realizado com sucesso (mock)" }, { status: 200 });
  }),

  // # felipe - Garante que a role seja mantida corretamente na renovação de sessão
  http.get(`${API_BASE}/auth/protected`, async () => {
    await delay(300);
    const sessionUser = db.getSession();
    
    if (!sessionUser) {
      return HttpResponse.json({ erro: "Sessão expirada no mock" }, { status: 401 });
    }

    return HttpResponse.json({
      sucesso: true,
      dados: {
        usuario: sessionUser
      }
    }, { status: 200 });
  }),


  // --- CLIENTES ---
  http.get(`${API_BASE}/clientes/`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);

    return HttpResponse.json({ dados: db.getPaginated('clientes', page, per_page) });
  }),

  http.post(`${API_BASE}/clientes/`, async ({ request }) => {
    const data = await request.json();
    const newCliente = db.add('clientes', data);
    return HttpResponse.json({ dados: { cliente: newCliente } }, { status: 201 });
  }),

  http.patch(`${API_BASE}/clientes/:id`, async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    db.update('clientes', Number(id), data);
    return HttpResponse.json({ mensagem: 'Cliente atualizado' });
  }),

  http.delete(`${API_BASE}/clientes/:id`, async ({ params }) => {
    const { id } = params;
    db.delete('clientes', Number(id));
    return HttpResponse.json({ mensagem: 'Cliente deletado' });
  }),

  // --- BARBEIROS ---
  http.get(`${API_BASE}/barbeiros/`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);

    return HttpResponse.json({ dados: db.getPaginated('barbeiros', page, per_page) });
  }),

  http.post(`${API_BASE}/barbeiros/`, async ({ request }) => {
    const data = await request.json();
    const newBarbeiro = db.add('barbeiros', data);
    return HttpResponse.json({ dados: { barbeiro: newBarbeiro } }, { status: 201 });
  }),

  http.patch(`${API_BASE}/barbeiros/:id`, async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    db.update('barbeiros', Number(id), data);
    return HttpResponse.json({ mensagem: 'Barbeiro atualizado' });
  }),

  http.delete(`${API_BASE}/barbeiros/:id`, async ({ params }) => {
    const { id } = params;
    db.delete('barbeiros', Number(id));
    return HttpResponse.json({ mensagem: 'Barbeiro deletado' });
  }),

  // --- SERVIÇOS ---
  http.get(`${API_BASE}/servicos/`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);

    return HttpResponse.json({ dados: db.getPaginated('servicos', page, per_page) });
  }),

  http.post(`${API_BASE}/servicos/`, async ({ request }) => {
    const data = await request.json();
    const newServico = db.add('servicos', data);
    return HttpResponse.json({ dados: { servico: newServico } }, { status: 201 });
  }),

  http.patch(`${API_BASE}/servicos/:id`, async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    db.update('servicos', Number(id), data);
    return HttpResponse.json({ mensagem: 'Serviço atualizado' });
  }),

  http.delete(`${API_BASE}/servicos/:id`, async ({ params }) => {
    const { id } = params;
    db.delete('servicos', Number(id));
    return HttpResponse.json({ mensagem: 'Serviço deletado' });
  }),

  // --- AGENDAMENTOS ---
  http.get(`${API_BASE}/agendamento/`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);

    return HttpResponse.json({ dados: db.getPaginated('agendamentos', page, per_page) });
  }),

  http.post(`${API_BASE}/agendamento/`, async ({ request }) => {
    const data = await request.json();
    const newAgend = db.add('agendamentos', data);
    return HttpResponse.json({ dados: { agendamento: newAgend } }, { status: 201 });
  }),

  http.patch(`${API_BASE}/agendamento/:id`, async ({ params, request }) => {
    const { id } = params;
    const data = await request.json();
    db.update('agendamentos', Number(id), data);
    return HttpResponse.json({ mensagem: 'Agendamento atualizado' });
  }),

  http.delete(`${API_BASE}/agendamento/:id`, async ({ params }) => {
    const { id } = params;
    db.delete('agendamentos', Number(id));
    return HttpResponse.json({ mensagem: 'Agendamento deletado' });
  })
];
