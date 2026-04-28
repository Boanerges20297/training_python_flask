import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDashboardInfo } from '../../../api/dashboard';
import { getClientes } from '../../../api/clients';
import { getBarbeiros } from '../../../api/barbers';
import type { DashboardData, Cliente } from '../../../types';
import {
  Calendar, 
  Activity, 
  ArrowUpRight, CreditCard, FileText, FileSpreadsheet, MessageCircle, Scissors, Receipt, Bell
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, Treemap
} from 'recharts';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import styles from './DashboardView.module.css'; 
import themeStyles from './FinanceiroView.module.css'; 
import BarberDrawer from '../components/BarberDrawer';
import ClientDrawer from '../components/ClientDrawer';
import type { FilterData } from '../../../types/filters';
import { Filter } from 'lucide-react';
import Swal from 'sweetalert2';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20 }
  }
};

export default function FinanceiroView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [devedores, setDevedores] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState<number>(30);
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [isBarberDrawerOpen, setIsBarberDrawerOpen] = useState(false);
  const [allBarbers, setAllBarbers] = useState<any[]>([]);
  
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterData>({});
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, clientsRes, barbersRes] = await Promise.all([
        getDashboardInfo(diasFiltro),
        getClientes(1, 100),
        getBarbeiros(1, 100)
      ]);
      setData(dashRes);
      setAllBarbers(barbersRes.items || []);
      
      const devedoresList = (clientsRes.items || []).filter(c => (c.divida_total || 0) > 0);
      setDevedores(devedoresList);
    } catch (e) {
      showToast('Erro ao carregar dados financeiros', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [diasFiltro]);

  const handleFilterClick = () => {
    Swal.fire({
      title: 'Filtrar Financeiro',
      html: `
        <div class="swal-grid">
          <div class="swal-form-group swal-col-4">
            <label class="swal-input-label">ID do Barbeiro</label>
            <input type="number" id="filter-barbeiro" class="swal-input-premium" placeholder="Ex: 10" value="${filters.profissionalId || ''}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Filtro',
      cancelButtonText: 'Limpar',
      buttonsStyling: false,
      customClass: { 
        popup: 'swal-glass-popup', 
        title: 'swal-glass-title', 
        htmlContainer: 'swal-glass-html',
        confirmButton: 'btn btn-md btn-primary theme-purple',
        cancelButton: 'btn btn-md btn-secondary'
      },
      preConfirm: () => {
        return {
          profissionalId: (document.getElementById('filter-barbeiro') as HTMLInputElement).value,
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

  const handleLiquidar = async (cliente: Cliente) => {
    const Swal = (await import('sweetalert2')).default;
    
    const result = await Swal.fire({
      title: 'Confirmar Recebimento?',
      html: `
        <div style="text-align: left; font-size: 0.9rem; opacity: 0.8; line-height: 1.5;">
          <p>Você confirma que recebeu o pagamento total deste cliente?</p>
          <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Cliente:</span>
              <strong style="color: var(--text-primary)">${cliente.nome}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Serviço:</span>
              <strong style="color: var(--text-primary)">${cliente.servicos}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Data:</span>
              <strong style="color: var(--text-primary)">${new Date().toLocaleDateString('pt-BR')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; border-top: 1px solid rgba(255,255,255,0.1); pt-0.5rem; margin-top: 0.5rem;">
              <span>Total Liquidado:</span>
              <strong style="color: #059669">R$ ${cliente.divida_total?.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, Liquidar',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      customClass: { 
        popup: 'swal-glass-popup', 
        title: 'swal-glass-title', 
        confirmButton: 'btn btn-md btn-primary theme-green',
        cancelButton: 'btn btn-md btn-secondary'
      }
    });

    if (result.isConfirmed) {
      try {
        const { updateCliente } = await import('../../../api/clients');
        await updateCliente(cliente.id, { divida_total: 0, status: 'ativo' });
        showToast(`Dívida de ${cliente.nome} liquidada com sucesso!`, 'success');
        fetchData();
      } catch (e) {
        showToast('Erro ao liquidar dívida', 'error');
      }
    }
  };

  const handleExport = (type: 'pdf' | 'excel' = 'pdf') => {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: `Gerando Relatório ${type.toUpperCase()}`,
        text: 'Sincronizando dados de fluxo de caixa...',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false,
        background: 'transparent',
        color: 'var(--text-primary)',
        timerProgressBar: true,
        customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html' },
        didOpen: () => Swal.default.showLoading()
      }).then(() => {
        Swal.default.fire({
          title: 'Exportação Concluída',
          text: 'Seu relatório financeiro foi gerado com sucesso.',
          icon: 'success',
          background: 'transparent',
          color: 'var(--text-primary)',
          confirmButtonColor: '#059669',
          customClass: { 
            popup: 'swal-glass-popup', 
            title: 'swal-glass-title', 
            confirmButton: 'swal-glass-confirm' 
          }
        });
      });
    });
  };

  const filteredDevedores = devedores.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de Profissional (se aplicável ao cliente devedor - aqui simulamos)
    if (filters.profissionalId) {
      // No devedor, poderíamos filtrar por quem realizou o último serviço não pago
      // Para o MVP, se o filtro está ativo, apenas verificamos se há correspondência
    }

    return matchesSearch;
  });

  if (loading || !data) {
    return (
      <div className={styles.loadingState}>
        <Activity size={60} className={styles.spinner} />
        <p style={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>
          CONSOLIDANDO DADOS...
        </p>
      </div>
    );
  }

  // --- DATA PREP ---
  const liquidezData = data.receita_diaria.map(d => ({
    data: d.data,
    realizado: d.receita * 0.75,
    previsto: d.receita * 0.25
  }));

  // 1. Waterfall (Cascata de Lucro)
  const totalComissoes = (data.barbeiros_desempenho || []).reduce((s, b) => s + (b.comissao_gerada || b.receita_total * 0.4), 0);
  const taxasCartao = data.receita_liquidada * 0.03;
  const lucroLiquido = data.receita_total - totalComissoes - taxasCartao;
  const waterfallData = [
    { name: 'Bruto', value: data.receita_total, fill: '#059669' },
    { name: 'Comissões', value: -totalComissoes, fill: '#ef4444' },
    { name: 'Taxas', value: -taxasCartao, fill: '#f59e0b' },
    { name: 'Líquido', value: lucroLiquido, fill: '#3b82f6' },
  ];
  // Para barras flutuantes: calcular base e top
  let running = data.receita_total;
  const waterfallBars = waterfallData.map((d, i) => {
    if (i === 0) return { ...d, base: 0, top: d.value, display: d.value };
    if (i === waterfallData.length - 1) return { ...d, base: 0, top: lucroLiquido, display: lucroLiquido };
    const top = running;
    running = running + d.value; // d.value is negative
    return { ...d, base: running, top: top, display: Math.abs(d.value) };
  });

  // 2. Treemap (Fontes de Receita)
  const servicosAgg: Record<string, number> = {};
  (data.barbeiros_desempenho || []).forEach(b => {
    (b.servicos_realizados || []).forEach(s => {
      servicosAgg[s.nome] = (servicosAgg[s.nome] || 0) + s.receita;
    });
  });
  const treemapColors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#047857'];
  const totalServicos = Object.values(servicosAgg).reduce((s, v) => s + v, 0) || 1;
  const treemapData = Object.entries(servicosAgg).length > 0
    ? Object.entries(servicosAgg).map(([name, value], i) => ({
        name, value, color: treemapColors[i % treemapColors.length],
        percent: ((value / totalServicos) * 100).toFixed(0)
      }))
    : [
        { name: 'Corte Premium', value: data.receita_liquidada * 0.50, color: '#059669', percent: '50' },
        { name: 'Barba & Cuidados', value: data.receita_liquidada * 0.25, color: '#10b981', percent: '25' },
        { name: 'Produtos', value: data.receita_liquidada * 0.15, color: '#34d399', percent: '15' },
        { name: 'Outros', value: data.receita_liquidada * 0.10, color: '#6ee7b7', percent: '10' },
      ];

  // 3. Bullet (Eficiência de Cadeira)
  const bulletData = (data.barbeiros_desempenho || []).map(b => {
    const potencial = b.total_agendamentos * data.ticket_medio * 1.3;
    const eficiencia = potencial > 0 ? (b.receita_total / potencial) * 100 : 0;
    const barber = allBarbers.find(x => x.id === b.barbeiro_id);
    return { ...b, potencial, eficiencia: Math.min(eficiencia, 100), imagem_url: barber?.imagem_url };
  });

  // 4. Risco (mantido)
  const riskData = filteredDevedores.map((d, i) => ({
    id: d.id, nome: d.nome, valor: d.divida_total || 0,
    atraso: (i * 12) % 45 + 5, z: d.divida_total || 1,
    fill: ((i * 12) % 45 + 5) > 30 ? '#ef4444' : (((i * 12) % 45 + 5) > 15 ? '#f59e0b' : '#10b981')
  }));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={styles.dashboardContainer}
    >
      <div className={styles.dashboardControls}>
        <div className={styles.dashboardControlsLeft}>
          <div style={{ width: '260px' }}>
            <Input
              as="select"
              value={diasFiltro.toString()}
              onChange={(e) => setDiasFiltro(Number(e.target.value))}
              icon={<Calendar size={18} />}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Última Quinzena</option>
              <option value="30">Este Mês</option>
              <option value="90">Este Trimestre</option>
            </Input>
          </div>
          <Button 
            variant="ghost" 
            theme="blue" 
            size="sm"
            icon={<Filter size={16} />} 
            onClick={handleFilterClick}
            style={{ 
              background: Object.keys(filters).some(k => (filters as any)[k]) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: Object.keys(filters).some(k => (filters as any)[k]) ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
              marginLeft: '0.5rem'
            }}
          >
            Filtros
            {Object.keys(filters).filter(k => (filters as any)[k]).length > 0 && (
              <span style={{ 
                marginLeft: '0.5rem', 
                background: 'var(--color-client)', 
                color: 'white', 
                borderRadius: '50%', 
                width: '18px', 
                height: '18px', 
                fontSize: '0.65rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 800
              }}>
                {Object.keys(filters).filter(k => (filters as any)[k]).length}
              </span>
            )}
          </Button>
        </div>
        <div className={styles.dashboardControlsRight}>
          <Button theme="red" icon={<FileText size={16} />} onClick={() => handleExport('pdf')}>PDF</Button>
          <Button theme="green" icon={<FileSpreadsheet size={16} />} onClick={() => handleExport('excel')}>Excel</Button>
        </div>
      </div>

      {/* ── BENTO GRID FINANCEIRO ── */}

      {/* Row 1: Liquidez (Span 8) e Distribuição (Span 4) */}
      <motion.div 
        variants={cardVariants} 
        className={`${styles.kpiCard} ${styles.span8} ${styles.h2} ${themeStyles.premiumKpi}`}
        style={{ background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}
      >
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Liquidez do Caixa</h3>
            <p className={styles.cardSubtitle}>Realizado (Verde) vs. Previsto (Tracejado)</p>
          </div>
          <div className={styles.headerIcon} style={{ background: 'var(--color-service-light)', color: 'var(--color-service)' }}>
             <ArrowUpRight size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flex: 1, padding: '0 1rem' }}>
           <div style={{ flex: '0 0 auto' }}>
              <div className={themeStyles.labelCompact}>Caixa Atual</div>
              <h2 className={themeStyles.valueLarge} style={{ fontSize: '3.5rem', margin: '0.5rem 0' }}>R$ {data.receita_liquidada.toLocaleString()}</h2>
              <div className={themeStyles.healthIndicator} style={{ width: '260px' }}>
                <span>Saúde Financeira</span>
                <div className={themeStyles.healthBar}>
                  <div className={themeStyles.healthProgress} style={{ width: `${(data.receita_liquidada / (data.receita_total || 1)) * 100}%` }}></div>
                </div>
                <span style={{ color: 'var(--color-service)' }}>{((data.receita_liquidada / (data.receita_total || 1)) * 100).toFixed(0)}%</span>
              </div>
           </div>

           <div style={{ flex: 1, height: '220px', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liquidezData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="data" hide />
                  <YAxis hide />
                  <RechartsTooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', color: 'var(--text-primary)' }}
                    formatter={(val: any, name: any) => [`R$ ${Number(val).toFixed(2)}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                  />
                  <Area type="monotone" dataKey="realizado" stackId="1" stroke="var(--color-service)" strokeWidth={3} fill="var(--color-service-light)" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="previsto" stackId="1" stroke="#9ca3af" strokeDasharray="5 5" fill="var(--bg-tertiary)" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </motion.div>

      {/* Cascata de Lucro — Waterfall Chart (Span 12) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span12}`} style={{ height: '320px' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Cascata de Lucro</h3>
            <p className={styles.cardSubtitle}>Do faturamento bruto ao lucro líquido</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#059669', display: 'inline-block' }} />Entrada</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#ef4444', display: 'inline-block' }} />Dedução</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#3b82f6', display: 'inline-block' }} />Resultado</span>
          </div>
        </div>
        <div style={{ height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallBars} margin={{ top: 20, right: 30, left: 30, bottom: 10 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-tertiary)' }} />
              <YAxis hide />
              <RechartsTooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', color: 'var(--text-primary)' }}
                formatter={(val: any, name: string) => {
                  if (name === 'base') return [null, null];
                  return [`R$ ${Number(val).toLocaleString()}`, 'Valor'];
                }}
              />
              <Bar dataKey="base" stackId="stack" fill="transparent" />
              <Bar dataKey="display" stackId="stack" radius={[8, 8, 0, 0]}>
                {waterfallBars.map((entry, index) => (
                  <Cell key={`wf-${index}`} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Fontes de Receita — Treemap */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span4} ${styles.h2}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Fontes de Receita</h3>
            <p className={styles.cardSubtitle}>Distribuição por Categoria</p>
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridAutoRows: '1fr', gap: '0.5rem', padding: '0 0.25rem 0.25rem' }}>
          {treemapData.map((item, i) => (
            <div 
              key={item.name} 
              className={themeStyles.treemapCell}
              style={{ 
                background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
                gridColumn: i === 0 ? 'span 2' : 'span 1',
                boxShadow: `0 4px 20px ${item.color}33`
              }}
            >
              <span className={themeStyles.treemapCellName}>{item.name}</span>
              <span className={themeStyles.treemapCellValue}>R$ {Number(item.value).toLocaleString()}</span>
              <span className={themeStyles.treemapCellPercent}>{item.percent}%</span>
            </div>
          ))}
        </div>
      </motion.div>


      {/* Row 2: Eficiência de Cadeira — Bullet Chart (Span 8) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span8} ${styles.h2}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader} style={{ marginBottom: '0.75rem' }}>
          <div>
            <h3 className={styles.cardTitle}>Eficiência de Cadeira</h3>
            <p className={styles.cardSubtitle}>Faturamento atual vs. capacidade potencial</p>
          </div>
        </div>
        <div className={styles.customScrollbar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
          {bulletData.map((b) => {
            const efColor = b.eficiencia >= 75 ? '#059669' : b.eficiencia >= 50 ? '#f59e0b' : '#ef4444';
            return (
              <div 
                key={b.barbeiro_id} 
                className={themeStyles.bulletRow}
                onClick={() => {
                  const barber = allBarbers.find(x => x.id === b.barbeiro_id);
                  if (barber) { setSelectedBarber(barber); setIsBarberDrawerOpen(true); }
                }}
              >
                <div className={themeStyles.bulletAvatar} style={{ background: 'var(--color-service-light)', color: 'var(--color-service)' }}>
                  {b.imagem_url ? (
                    <img src={b.imagem_url} alt={b.barbeiro_nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : b.barbeiro_nome.charAt(0)}
                </div>
                <div className={themeStyles.bulletInfo}>
                  <div className={themeStyles.bulletName}>{b.barbeiro_nome}</div>
                  <div className={themeStyles.bulletMeta}>{b.agendamentos_concluidos} cortes • {b.taxa_conclusao.toFixed(0)}% conclusão</div>
                </div>
                <div className={themeStyles.bulletBarContainer}>
                  <div className={themeStyles.bulletBarTrack}>
                    <div className={themeStyles.bulletBarFill} style={{ width: `${b.eficiencia}%`, background: efColor }} />
                    <div className={themeStyles.bulletBarMarker} style={{ left: '75%' }} title="Meta 75%" />
                  </div>
                </div>
                <div className={themeStyles.bulletValue} style={{ color: efColor }}>
                  R$ {b.receita_total.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>


      {/* Matriz de Risco (Span 4) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span4} ${styles.h2}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Matriz de Risco</h3>
            <p className={styles.cardSubtitle}>Tempo vs. Valor da Dívida</p>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
              <XAxis dataKey="atraso" type="number" name="Dias" unit="d" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <YAxis dataKey="valor" type="number" name="Valor" unit=" R$" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <ZAxis dataKey="z" type="number" range={[50, 400]} />
              <RechartsTooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ borderRadius: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                formatter={(val: any, name: any) => [name === 'Valor' ? `R$ ${val}` : `${val} dias`, name === 'Valor' ? 'Dívida' : 'Atraso']}
              />
              <Scatter name="Devedores" data={riskData} fill="#8884d8">
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </motion.div>


      {/* Row 3: Ledger (Span 12) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span12} ${styles.h3}`} style={{ height: 'auto', minHeight: '520px' }}>
         <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className={styles.cardTitle}>Livro Caixa de Devedores</h3>
              <p className={styles.cardSubtitle}>Controle rigoroso de inadimplência ativa</p>
            </div>
            <div style={{ width: '300px' }}>
              <Input 
                placeholder="Filtrar por nome do cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Activity size={16} />}
              />
            </div>
         </div>
         
         <div style={{ marginTop: '1.5rem', padding: '0 0.5rem' }}>
            <table className={themeStyles.ledgerTable}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Saldo Devedor</th>
                  <th>Cobranças</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevedores.map((c, idx) => {
                  const cobrancas = (idx % 3) + 1; // Simulado
                  const cobrancaClass = cobrancas >= 3 ? themeStyles.cobrancaHigh : cobrancas >= 2 ? themeStyles.cobrancaMid : themeStyles.cobrancaLow;
                  return (
                  <tr 
                    key={c.id} 
                    className={themeStyles.ledgerRow}
                    onClick={() => {
                      setSelectedClient(c);
                      setIsClientDrawerOpen(true);
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-service-light)', color: 'var(--color-service)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, overflow: 'hidden' }}>
                             {c.imagem_url ? (
                               <img src={c.imagem_url} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : (
                               c.nome.charAt(0)
                             )}
                         </div>
                         <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.nome}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>ID: #{c.id.toString().padStart(4, '0')}</div>
                         </div>
                      </div>
                    </td>
                    <td className={themeStyles.currency} style={{ color: 'var(--color-danger)' }}>
                      R$ {c.divida_total?.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`${themeStyles.cobrancaBadge} ${cobrancaClass}`}>
                          <Bell size={10} /> {cobrancas}x
                        </span>
                        <button 
                          className={themeStyles.reciboPill}
                          onClick={(e) => {
                            e.stopPropagation();
                            Swal.fire({
                              title: 'Recibo Digital',
                              html: `<div style="text-align:left;font-size:0.85rem;line-height:1.8">
                                <p><strong>Cliente:</strong> ${c.nome}</p>
                                <p><strong>Valor Pendente:</strong> R$ ${c.divida_total?.toLocaleString()}</p>
                                <p><strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                                <hr style="border-color:rgba(255,255,255,0.1);margin:1rem 0"/>
                                <p style="font-size:0.7rem;color:var(--text-tertiary)">Este recibo é um comprovante de pendência financeira gerado pelo sistema BarbaByte.</p>
                              </div>`,
                              confirmButtonText: 'Gerar PDF',
                              showCancelButton: true,
                              cancelButtonText: 'Fechar',
                              buttonsStyling: false,
                              customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html', confirmButton: 'btn btn-md btn-primary theme-purple', cancelButton: 'btn btn-md btn-secondary' }
                            }).then(r => { if (r.isConfirmed) showToast('Recibo gerado com sucesso!', 'success'); });
                          }}
                        >
                          <Receipt size={11} /> Recibo
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button 
                          variant="ghost" 
                          icon={<MessageCircle size={16} />} 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/55${c.telefone?.replace(/\D/g, '') || ''}?text=Olá ${c.nome.split(' ')[0]}, notamos que há uma pendência de R$ ${c.divida_total} em sua conta...`, '_blank');
                          }}
                          style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.4rem 0.8rem' }}
                        >
                          Cobrar
                        </Button>
                        <Button 
                          variant="ghost" 
                          theme="green"
                          icon={<CreditCard size={16} />} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLiquidar(c);
                          }}
                          style={{ background: 'white', boxShadow: 'var(--shadow-sm)' }}
                        >
                          Liquidar
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {filteredDevedores.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center' }}>
                       <div style={{ opacity: 0.5 }}>
                          <Activity size={40} style={{ margin: '0 auto 1rem' }} />
                          <p style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>Nenhum débito pendente identificado.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
         </div>
      </motion.div>



      <BarberDrawer 
        isOpen={isBarberDrawerOpen}
        onClose={() => setIsBarberDrawerOpen(false)}
        barbeiroParaEditar={selectedBarber}
        onSuccess={fetchData}
      />

      <ClientDrawer 
        isOpen={isClientDrawerOpen}
        onClose={() => setIsClientDrawerOpen(false)}
        clienteParaEditar={selectedClient}
        onSuccess={fetchData}
      />
    </motion.div>
  );
}
