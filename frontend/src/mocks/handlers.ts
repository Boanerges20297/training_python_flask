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
  http.get(`${API_BASE}/dashboard/geral`, async ({ request }) => {
    await delay(600);
    const url = new URL(request.url);
    const dias = Number(url.searchParams.get('dias') || 30);
    
    const agendamentos = db.getAll('agendamentos');
    const barbeiros = db.getAll('barbeiros');
    const clientes = db.getAll('clientes');
    
    // Filtro básico de dias (simplificado para o mock)
    const agora = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(agora.getDate() - dias);

    const agendsFiltrados = agendamentos.filter(a => new Date(a.data_agendamento) >= dataLimite);

    const total_dividas = clientes.reduce((acc, c) => acc + (c.divida_total || 0), 0);

    const agendamentos_concluidos = agendsFiltrados.filter(a => a.status === 'concluido').length;
    const agendamentos_cancelados = agendsFiltrados.filter(a => a.status === 'cancelado').length;
    const agendamentos_pendentes = agendsFiltrados.filter(a => a.status === 'pendente').length;

    const desempenhoBarbeiros = barbeiros.map(b => {
      const agendsB = agendsFiltrados.filter(a => a.barbeiro_id === b.id);
      const concluidos = agendsB.filter(a => a.status === 'concluido');
      const receita = concluidos.reduce((acc, a) => acc + (a.preco || 0), 0);
      const comissao = (receita * (b.comissao_percentual || 50)) / 100;
      
      return {
        barbeiro_id: b.id,
        barbeiro_nome: b.nome.split(' ')[0],
        total_agendamentos: agendsB.length,
        agendamentos_concluidos: concluidos.length,
        agendamentos_cancelados: agendsB.filter(a => a.status === 'cancelado').length,
        receita_total: receita,
        comissao_gerada: comissao,
        taxa_conclusao: agendsB.length > 0 ? Math.round((concluidos.length / agendsB.length) * 100) : 0,
        servicos_realizados: [
          { nome: "Serviços Gerais", quantidade: concluidos.length, receita: receita }
        ]
      };
    });

    const receita_diaria = Array.from({length: dias}).map((_, i) => {
      const d = new Date();
      d.setDate(agora.getDate() - (dias - 1 - i));
      return {
        data: d.toISOString().split('T')[0],
        receita: Math.floor(Math.random() * 800) + 200,
        agendamentos_concluidos: Math.floor(Math.random() * 15) + 3
      };
    });

    const receita_total_calc = receita_diaria.reduce((acc, d) => acc + d.receita, 0);

    return HttpResponse.json({
      data: {
        periodo_inicio: dataLimite.toISOString(),
        periodo_fim: agora.toISOString(),
        receita_total: receita_total_calc,
        receita_liquidada: receita_total_calc * 0.8,
        receita_pendente: receita_total_calc * 0.2,
        total_dividas,
        agendamentos_total: agendsFiltrados.length,
        agendamentos_concluidos,
        agendamentos_cancelados,
        agendamentos_pendentes,
        ticket_medio: agendamentos_concluidos > 0 ? receita_total_calc / agendamentos_concluidos : 0,
        top_5_horarios: [8, 10, 12, 14, 16, 18, 20].map(h => ({
          hora: h,
          total_agendamentos: Math.floor(Math.random() * 20) + 5
        })).sort((a, b) => a.hora - b.hora),
        receita_diaria,
        barbeiros_desempenho: desempenhoBarbeiros
      }
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
  http.get(`${API_BASE}/clientes`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);

    return HttpResponse.json({ dados: db.getPaginated('clientes', page, per_page) });
  }),

  http.post(`${API_BASE}/clientes`, async ({ request }) => {
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
  http.get(`${API_BASE}/barbeiros`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);

    return HttpResponse.json({ dados: db.getPaginated('barbeiros', page, per_page) });
  }),

  http.post(`${API_BASE}/barbeiros`, async ({ request }) => {
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
  http.get(`${API_BASE}/agendamento`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const per_page = Number(url.searchParams.get('per_page') || 10);

    return HttpResponse.json({ dados: db.getPaginated('agendamentos', page, per_page) });
  }),

  http.post(`${API_BASE}/agendamento`, async ({ request }) => {
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
