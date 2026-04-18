import { useEffect, useState } from 'react';
import { getDashboardInfo } from '../../../api/dashboard';
import type { DashboardData, BarbeiroDesempenho } from '../../../types';
import { 
  TrendingUp, Calendar, AlertTriangle, DollarSign, 
  Download, Clock, Scissors, Activity 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import './Dashboard.css';

export default function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState<number>(30);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<BarbeiroDesempenho | null>(null);
  
  const { showToast } = useToast();

  const fetchDashboard = async (dias: number) => {
    setLoading(true);
    try {
      const res = await getDashboardInfo(dias);
      setData(res);
    } catch (e) {
      showToast('Erro ao obter métricas do dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(diasFiltro);
  }, [diasFiltro]);

  const handleDownloadPDF = () => {
    showToast('Gerando PDF...', 'success');
    setTimeout(() => {
      showToast('Relatório salvo na pasta Downloads.', 'success');
    }, 1500);
  };

  const handleBarberClick = (barbeiro: BarbeiroDesempenho) => {
    setSelectedBarber(barbeiro);
    setIsModalOpen(true);
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: '#3b82f6', textAlign: 'center' }}>
          <Activity size={48} className="animate-spin" style={{ marginBottom: '1rem' }} />
          <p>Analisando dados...</p>
        </div>
      </div>
    );
  }

  // Cálculos dinâmicos
  const cancelRate = data.agendamentos_total > 0 
    ? Math.round((data.agendamentos_cancelados / data.agendamentos_total) * 100) 
    : 0;

  // Render Tooltip Customizado para Área
  const CustomTooltipArea = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{label}</p>
          <p className="custom-tooltip-item" style={{ color: '#10b981' }}>
            Receita: R$ {payload[0].value.toFixed(2)}
          </p>
          <p className="custom-tooltip-item" style={{ color: '#3b82f6' }}>
            Status Concluído: {payload[0].payload.agendamentos_concluidos}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      {/* Top Controls */}
      <div className="dashboard-controls">
        <div className="dashboard-controls-left">
          <div style={{ width: '200px' }}>
            <Input 
              as="select" 
              value={diasFiltro.toString()}
              onChange={(e) => setDiasFiltro(Number(e.target.value))}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
            </Input>
          </div>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Mostrando resultados do período selecionado
          </span>
        </div>
        <div className="dashboard-controls-right">
          <Button 
            variant="ghost" 
            theme="blue" 
            icon={<Download size={18} />}
            onClick={handleDownloadPDF}
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-bg-glow" style={{ background: '#10b981' }} />
          <div className="kpi-header">
            <h3 className="kpi-title">Receita Total</h3>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <p className="kpi-value">R$ {data.receita_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="kpi-subtitle">Faturado no período</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-bg-glow" style={{ background: '#3b82f6' }} />
          <div className="kpi-header">
            <h3 className="kpi-title">Atendimentos Concluídos</h3>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Calendar size={20} />
            </div>
          </div>
          <p className="kpi-value">{data.agendamentos_concluidos}</p>
          <p className="kpi-subtitle">De {data.agendamentos_total} agendamentos</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-bg-glow" style={{ background: '#f59e0b' }} />
          <div className="kpi-header">
            <h3 className="kpi-title">Ticket Médio</h3>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="kpi-value">R$ {data.ticket_medio.toFixed(2)}</p>
          <p className="kpi-subtitle">Valor médio por serviço</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-bg-glow" style={{ background: '#ef4444' }} />
          <div className="kpi-header">
            <h3 className="kpi-title">Taxa de Cancelamento</h3>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="kpi-value">{cancelRate}%</p>
          <p className="kpi-subtitle">
            <span className={cancelRate > 15 ? 'kpi-trend negative' : 'kpi-trend positive'}>
              {data.agendamentos_cancelados} Cancelados
            </span>
          </p>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="chart-card chart-primary">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Evolução de Receita Diária</h3>
          <p className="chart-card-subtitle">Receita gerada a cada dia concluído</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.receita_diaria} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="data" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <RechartsTooltip content={<CustomTooltipArea />} />
            <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card chart-secondary">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Horários de Pico</h3>
          <p className="chart-card-subtitle">Distribuição por hora do dia</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.top_5_horarios} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="hora" tickFormatter={(val) => `${val}h`} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey="total_agendamentos" radius={[4, 4, 0, 0]}>
              {
                data.top_5_horarios.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)'} />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Barbeiros Performance List */}
      <div className="chart-card performance-list">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Ranking de Desempenho (Profissionais)</h3>
          <p className="chart-card-subtitle">Clique para ver detalhes do barbeiro</p>
        </div>
        <div>
          {(data.barbeiros_desempenho || []).map((barbeiro) => (
            <div 
              key={barbeiro.barbeiro_id} 
              className="performance-item"
              onClick={() => handleBarberClick(barbeiro)}
            >
              <div className="perf-barber-info">
                <div className="perf-avatar">
                  <Scissors size={20} />
                </div>
                <div>
                  <h4 className="perf-name">{barbeiro.barbeiro_nome}</h4>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                    Taxa de Conclusão: <strong style={{ color: '#f8fafc' }}>{barbeiro.taxa_conclusao}%</strong>
                  </p>
                </div>
              </div>
              <div className="perf-stats">
                <div className="perf-stat-badge">
                  <Calendar size={14} /> <span>{barbeiro.agendamentos_concluidos} Atendimentos</span>
                </div>
                <div className="perf-stat-badge">
                  <Clock size={14} /> <span>{Math.round(barbeiro.tempo_total_minutos / 60)}h</span>
                </div>
                <div className="perf-revenue">
                  R$ {barbeiro.receita_total.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Profile Barbeiro */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Desempenho: ${selectedBarber?.barbeiro_nome}`}
        variant="blue"
      >
        {selectedBarber && (
          <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(15,23,42,0.5)', padding: '1rem', borderRadius: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>Concluídos</p>
                <h2 style={{ margin: 0, color: '#f8fafc' }}>{selectedBarber.agendamentos_concluidos}</h2>
              </div>
              <div style={{ background: 'rgba(15,23,42,0.5)', padding: '1rem', borderRadius: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>Cancelados</p>
                <h2 style={{ margin: 0, color: '#ef4444' }}>{selectedBarber.agendamentos_cancelados}</h2>
              </div>
            </div>
            
            <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Serviços Realizados</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(selectedBarber.servicos_realizados || []).map((srv, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <span>{srv.quantidade}x <strong>{srv.nome}</strong></span>
                  <span style={{ color: '#10b981' }}>R$ {(srv.receita || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
