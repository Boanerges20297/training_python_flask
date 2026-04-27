import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getDashboardInfo } from '../../../api/dashboard';
import type { DashboardData } from '../../../types';
import {
  TrendingUp, Calendar,
  Activity, FileText, FileSpreadsheet, Filter
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import styles from './DashboardView.module.css';
import AppointmentDrawer from '../components/AppointmentDrawer';
import ClientDrawer from '../components/ClientDrawer';
import type { FilterData } from '../../../types/filters';
import { getAgendamentos } from '../../../api/appointments';
import { getClientes } from '../../../api/clients';
import { getBarbeiros } from '../../../api/barbers';
import { getServicos } from '../../../api/services';
import type { Agendamento, Cliente, Barbeiro, Servico } from '../../../types';

import Swal from 'sweetalert2';

// --- ANIMAÇÕES ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } }
};

// --- SUBCOMPONENTES ---

// 1. Badge de Comparação
const ComparisonBadge = ({ value, trend }: { value: number; trend: 'up' | 'down' | 'neutral' }) => {
  const isUp = trend === 'up';
  const color = isUp ? '#10b981' : (trend === 'down' ? '#ef4444' : '#6b7280');
  const bg = isUp ? 'rgba(16, 185, 129, 0.1)' : (trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)');
  const symbol = isUp ? '↑' : (trend === 'down' ? '↓' : '•');

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: bg, color, padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: '0.8rem' }}>{symbol}</span>
      <span>{value}% vs Média</span>
    </div>
  );
};

// 2. Tooltip Interativo Customizado para Evolução do Fluxo
const FluxoTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const agendamentos = payload[0].payload.agendamentos_concluidos;
    
    let insight = "Fluxo Neutro: Manter Operação";
    if (value < 400) { insight = "Baixa Demanda: Sugerir Promoção Flash"; }
    else if (value > 700) { insight = "Alta Demanda: Foco total em Upsell (Produtos/Combo)"; }

    return (
      <div style={{ background: 'var(--bg-secondary)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
        <p style={{ fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>DIA {label}</p>
        <p style={{ color: 'var(--color-client)', fontSize: '1.5rem', fontWeight: 900 }}>R$ {value.toFixed(2)}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{agendamentos} atendimentos concluídos</p>
        <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {insight}
        </div>
      </div>
    );
  }
  return null;
};


// --- VISÃO PRINCIPAL ---
const DashboardView = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState<number>(30);
  
  const [agendaReal, setAgendaReal] = useState<Agendamento[]>([]);
  const [allClientes, setAllClientes] = useState<Cliente[]>([]);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Agendamento | null>(null);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isClientOpen, setIsClientOpen] = useState(false);

  const [filters, setFilters] = useState<FilterData>({});

  const [allBarbeiros, setAllBarbeiros] = useState<Barbeiro[]>([]);
  const [allServicos, setAllServicos] = useState<Servico[]>([]);
  const [fullAgendamentos, setFullAgendamentos] = useState<Agendamento[]>([]);

  const { showToast } = useToast();

  const fetchDashboard = async (dias: number) => {
    setLoading(true);
    try {
      const [res, agendRes, clientsRes, barbsRes, servsRes, fullAgendRes] = await Promise.all([
        getDashboardInfo(dias),
        getAgendamentos(1, 10),
        getClientes(1, 100),
        getBarbeiros(1, 100),
        getServicos(1, 100),
        getAgendamentos(1, 100) // Para o drawer
      ]);
      setData(res);
      setAgendaReal(agendRes.items || []);
      setAllClientes(clientsRes.items || []);
      setAllBarbeiros(barbsRes.items || []);
      setAllServicos(servsRes.items || []);
      setFullAgendamentos(fullAgendRes.items || []);
    } catch (e) {
      showToast('Erro ao obter métricas do dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(diasFiltro);
  }, [diasFiltro]);

  const filteredAgenda = useMemo(() => {
    return agendaReal.filter(item => {
      if (filters.profissionalId && item.barbeiro_id !== parseInt(filters.profissionalId)) return false;
      if (filters.servicoId && !item.servicos_ids?.includes(parseInt(filters.servicoId))) return false;
      if (filters.status && item.status && !item.status.toLowerCase().includes(filters.status.toLowerCase())) return false;
      return true;
    });
  }, [agendaReal, filters]);

  const handleFilterClick = () => {
    Swal.fire({
      title: 'Filtrar Agenda do Dia',
      html: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; text-align: left; padding: 0.5rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">ID do Profissional</label>
            <input type="number" id="filter-profissional" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: 12" value="${filters.profissionalId || ''}">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">ID do Serviço</label>
            <input type="number" id="filter-servico" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: 5" value="${filters.servicoId || ''}">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">Status</label>
            <input type="text" id="filter-status" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: pendente, concluído..." value="${filters.status || ''}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Filtros',
      cancelButtonText: 'Limpar Tudo',
      confirmButtonColor: 'var(--color-primary)',
      background: 'transparent',
      customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html' },
      preConfirm: () => {
        return {
          profissionalId: (document.getElementById('filter-profissional') as HTMLInputElement).value,
          servicoId: (document.getElementById('filter-servico') as HTMLInputElement).value,
          status: (document.getElementById('filter-status') as HTMLInputElement).value,
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setFilters(result.value);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        setFilters({});
      }
    });
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    Swal.fire({
      title: 'Gerando Relatório',
      text: `Estamos preparando seu arquivo ${type.toUpperCase()}...`,
      icon: 'info',
      timer: 2000,
      showConfirmButton: false,
      background: 'transparent',
      color: 'var(--text-primary)',
      timerProgressBar: true,
      customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html' },
      didOpen: () => { Swal.showLoading(); }
    }).then(() => {
      Swal.fire({
        title: 'Pronto!',
        text: `O download do arquivo ${type.toUpperCase()} iniciará em breve.`,
        icon: 'success',
        background: 'transparent',
        color: 'var(--text-primary)',
        confirmButtonColor: 'var(--color-client)',
        customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html', confirmButton: 'swal-glass-confirm' }
      });
    });
  };

  if (loading || !data) {
    return (
      <div className={styles.loadingState}>
        <Activity size={60} className={styles.spinner} />
        <p style={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>
          PROCESSANDO INTELIGÊNCIA...
        </p>
      </div>
    );
  }

  // --- DATA PREP ---
  const peakHourObj = data.top_5_horarios.length > 0
    ? data.top_5_horarios.reduce((prev, current) => (prev.total_agendamentos > current.total_agendamentos) ? prev : current)
    : null;
  const maxVolume = peakHourObj ? peakHourObj.total_agendamentos : 1;

  // Heatmap Clock Data (24 slices mapping hours 0-23)
  const clockData = Array.from({ length: 24 }).map((_, i) => {
    const entry = data.top_5_horarios.find(h => Math.floor(h.hora) === i);
    const volume = entry ? entry.total_agendamentos : 0;
    const heatIndex = volume / maxVolume; // 0 to 1
    return { name: `${i}h`, value: 1, heat: heatIndex, volume };
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={styles.dashboardContainer}>
      <div className={styles.dashboardControls}>
        <div className={styles.dashboardControlsLeft}>
          <div style={{ width: '260px' }}>
            <Input
              as="select"
              value={diasFiltro.toString()}
              onChange={(e) => setDiasFiltro(Number(e.target.value))}
              icon={<Calendar size={18} />}
            >
              <option value="7">Relatório Semanal</option>
              <option value="15">Relatório Quinzenal</option>
              <option value="30">Relatório Mensal</option>
              <option value="90">Relatório Trimestral</option>
            </Input>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Filter size={16} />}
            onClick={handleFilterClick}
            style={{ 
              background: Object.keys(filters).some(k => (filters as any)[k]) ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
              border: Object.keys(filters).some(k => (filters as any)[k]) ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid transparent'
            }}
          >
            Filtros
          </Button>
        </div>
        <div className={styles.dashboardControlsRight}>
          <Button variant="primary" theme="red" icon={<FileText size={16} />} onClick={() => handleExport('pdf')}>PDF</Button>
          <Button variant="primary" theme="green" icon={<FileSpreadsheet size={16} />} onClick={() => handleExport('excel')}>Excel</Button>
        </div>
      </div>

      {/* ── BENTO GRID FLAT STRUCTURE ── */}
      
      {/* 1. Evolução de Fluxo (Topo Esquerda) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span8} ${styles.h2}`}>
        <div className={styles.cardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 className={styles.cardTitle}>Evolução de Fluxo</h3>
              <ComparisonBadge value={12.4} trend="up" />
            </div>
            <p className={styles.cardSubtitle}>Mapeamento de receita diária e insights interativos</p>
          </div>
          <div className={styles.headerIcon} style={{ background: 'var(--color-client-light)', color: 'var(--color-client)' }}>
            <TrendingUp size={20} />
          </div>
        </div>
        <div style={{ height: '240px', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.receita_diaria} margin={{ top: 10, right: 35, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceitaBento" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-client)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-client)" stopOpacity={0} />
                </linearGradient>
                <filter id="shadowArea" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                  <feOffset dx="0" dy="6" result="offsetblur" />
                  <feComponentTransfer><feFuncA type="linear" slope="0.4" /></feComponentTransfer>
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
              <XAxis 
                dataKey="data" 
                tickFormatter={(val) => { if (!val) return ''; const [, month, day] = val.split('-'); return `${day}/${month}`; }} 
                tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }}
                axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} dy={10}
              />
              <YAxis tickFormatter={(val) => `R$${val}`} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<FluxoTooltip />} cursor={{ stroke: 'var(--color-client)', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area type="monotone" dataKey="receita" stroke="var(--color-client)" strokeWidth={4} fillOpacity={1} fill="url(#colorReceitaBento)" filter="url(#shadowArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 2. Faturamento Bruto (Topo Direita) */}
      <motion.div variants={cardVariants} className={`${styles.kpiCard} ${styles.span4} ${styles.h2}`} style={{ background: 'var(--color-client)', color: 'white', position: 'relative', overflow: 'hidden', padding: '1.75rem' }}>
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '85px', height: '85px', zIndex: 3 }}>
          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" strokeLinecap="round" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="10" strokeDasharray="263.8" strokeDashoffset={263.8 * (1 - 0.85)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease-out', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900 }}>85%</span>
            <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>Meta</span>
          </div>
        </div>
        <div className={styles.kpiContent} style={{ height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2, position: 'relative' }}>
          <div style={{ maxWidth: '65%' }}>
            <p className={styles.kpiLabel} style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Faturamento Bruto</p>
            <h2 className={styles.kpiValue} style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: 'white', marginTop: '0.5rem', lineHeight: 1.1 }}>R$ {data.receita_total.toLocaleString('pt-BR')}</h2>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem' }}>Próximo à meta semanal de R$ {(data.receita_total * 1.15).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          </div>
          <div style={{ height: '110px', marginTop: 'auto', marginLeft: '-1.75rem', marginRight: '-1.75rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.receita_diaria}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="white" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="white" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <RechartsTooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '1rem', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                  formatter={(value: any) => [`R$ ${value}`, 'Faturamento']}
                  labelFormatter={(label) => `Dia: ${label}`}
                />
                <Area type="monotone" dataKey="receita" stroke="white" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFaturamento)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 1 }} />
      </motion.div>

      {/* 3. Agenda do Dia (Esquerda - Ocupa 2 Alturas) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span8} ${styles.h7} ${styles.rowSpan2}`} style={{ display: 'flex', flexDirection: 'column'}}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Agenda do Dia</h3>
            <p className={styles.cardSubtitle}>Fluxo de atendimentos para as próximas horas</p>
          </div>
        </div>
        <div className={styles.timelineScroll} style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
          <div className={styles.timeline}>
            {filteredAgenda.length > 0 ? (
              filteredAgenda.map(item => {
                const cliente = allClientes.find(c => c.id === item.cliente_id);
                return (
                  <div 
                    key={item.id} 
                    className={styles.timelineItem} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedAppointment(item);
                      setIsAppointmentOpen(true);
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1.5rem', 
                      background: 'var(--bg-primary)', 
                      padding: '1.25rem', 
                      borderRadius: '1.75rem', 
                      boxShadow: 'var(--shadow-sm)', 
                      border: '1px solid var(--border-color)', 
                      flex: 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-appointment)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <div style={{ minWidth: '60px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                          {item.data_agendamento ? new Date(item.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800 }}>Hoje</p>
                      </div>
                      <div style={{ width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-client-light)', color: 'var(--color-client)', fontSize: '1.5rem', fontWeight: '800' }}>
                        {cliente?.nome.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cliente?.nome || 'Cliente'}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-purple)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.servicos_ids && item.servicos_ids.length > 1 
                            ? `${allServicos.find(s => s.id === item.servicos_ids[0])?.nome} +${item.servicos_ids.length - 1}`
                            : (allServicos.find(s => s.id === item.servicos_ids?.[0])?.nome || `Agendamento #${item.id}`)
                          }
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-service)' }}>R$ {item.preco?.toLocaleString() || '0'}</p>
                        <span className={styles.badge} style={{ marginTop: '0.4rem', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                <p style={{ fontSize: '0.85rem' }}>Nenhum agendamento para hoje.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4. Ticket Médio (Direita - Acima do Mapa) */}
      <motion.div variants={cardVariants} className={`${styles.kpiCard} ${styles.span4} ${styles.h4}`} style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p className={styles.kpiLabel} style={{ color: 'var(--text-tertiary)' }}>Ticket Médio Diário</p>
            <ComparisonBadge value={5.2} trend="down" />
          </div>
          <h2 className={styles.kpiValue} style={{ fontSize: '3rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>R$ {data.ticket_medio.toFixed(2).replace('.', ',')}</h2>
        </div>
        <div style={{ position: 'relative', height: '140px', marginTop: 'auto', marginLeft: '-20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.receita_diaria}>
               <defs>
                <linearGradient id="colorTicket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-service)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-service)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <RechartsTooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', color: 'var(--text-primary)' }}
                formatter={(value: any, _name: any, props: any) => {
                  const agendamentos = props.payload.agendamentos_concluidos;
                  const ticket = agendamentos > 0 ? (value / agendamentos).toFixed(2) : 0;
                  return [`R$ ${ticket}`, 'Ticket'];
                }}
                labelFormatter={(label) => `Dia: ${label}`}
              />
              <Area type="stepAfter" dataKey="receita" stroke="var(--color-service)" strokeWidth={3} fillOpacity={1} fill="url(#colorTicket)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 5. Mapa de Ocupação (Direita - Abaixo do Ticket) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span4} ${styles.h2}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Mapa de Ocupação</h3>
            <p className={styles.cardSubtitle}>Intensidade por horário</p>
          </div>
          <ComparisonBadge value={24} trend="up" />
        </div>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: '10%', pointerEvents: 'none', border: '1px dashed var(--border-color)', borderRadius: '50%', opacity: 0.3 }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 800 }}>
            <span style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)' }}>00h</span>
            <span style={{ position: 'absolute', top: '50%', right: '5%', transform: 'translateY(-50%)' }}>06h</span>
            <span style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)' }}>12h</span>
            <span style={{ position: 'absolute', top: '50%', left: '5%', transform: 'translateY(-50%)' }}>18h</span>
          </div>
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <PieChart width={180} height={180}>
              <Pie
                data={clockData}
                cx={90} cy={90}
                innerRadius={60} outerRadius={80}
                startAngle={90} endAngle={-270}
                dataKey="value" stroke="none"
                paddingAngle={0}
              >
                {clockData.map((entry, index) => {
                  const hour = parseInt(entry.name);
                  const isWorkHour = hour >= 8 && hour <= 20;
                  let color = 'rgba(255,255,255,0.05)';
                  if (isWorkHour) {
                    if (entry.heat > 0.8) color = '#ff5722';
                    else if (entry.heat > 0.5) color = '#ff9800';
                    else if (entry.heat > 0.2) color = '#ffc107';
                    else color = 'var(--bg-tertiary)';
                  }
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color} 
                      style={{ filter: entry.heat > 0.6 ? 'drop-shadow(0 0 4px ' + color + ')' : 'none' }} 
                    />
                  );
                })}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: '0.8rem' }}
                formatter={(_: any, __: any, props: any) => [`${props.payload.volume} Agendamentos`, `${props.payload.name}`]}
              />
            </PieChart>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Pico</div>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{peakHourObj ? `${Math.floor(peakHourObj.hora)}` : '--'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. Ondas de Demanda (Rodapé Full Width) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span12} ${styles.h2}`}>
        <div className={styles.cardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 className={styles.cardTitle}>Ondas de Demanda</h3>
              <ComparisonBadge value={8.5} trend="neutral" />
            </div>
            <p className={styles.cardSubtitle}>Densidade de fluxo por horário (Ridge Line Plot)</p>
          </div>
        </div>
        <div style={{ height: '260px', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.top_5_horarios} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="ridgeGradBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-appointment)" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="var(--color-appointment)" stopOpacity={0.0}/>
                </linearGradient>
                <filter id="glowRidge" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
              <XAxis dataKey="hora" tickFormatter={(val) => `${val}h`} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} tick={{ fontSize: 13, fill: 'var(--text-tertiary)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
              <RechartsTooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 40, strokeLinecap: 'round' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)' }} formatter={(value: any) => [`${value} Agendamentos`, 'Volume']} labelFormatter={(label) => `Fluxo às ${label}h`} />
              <Area type="monotone" dataKey="total_agendamentos" stroke="var(--color-appointment)" strokeWidth={3} fill="url(#ridgeGradBase)" filter="url(#glowRidge)" activeDot={{ r: 8, fill: "var(--color-appointment)", stroke: "var(--bg-secondary)", strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <AppointmentDrawer 
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        agendamentoParaEditar={selectedAppointment}
        onSuccess={() => fetchDashboard(diasFiltro)}
        clientes={allClientes}
        servicos={allServicos}
        barbeiros={allBarbeiros}
        allAgendamentos={fullAgendamentos}
      />

      <ClientDrawer 
        isOpen={isClientOpen}
        onClose={() => setIsClientOpen(false)}
        clienteParaEditar={selectedClient}
        onSuccess={() => fetchDashboard(diasFiltro)}
      />
    </motion.div>
  );
};

export default DashboardView;
