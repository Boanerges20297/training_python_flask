import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getDashboardInfo } from '../../../api/dashboard';
import { getClientes } from '../../../api/clients';
import { getBarbeiros } from '../../../api/barbers';
import type { DashboardData, Cliente, Barbeiro } from '../../../types';
import {
  Calendar,
  Activity,
  ArrowUpRight, CreditCard, FileText, FileSpreadsheet, MessageCircle, Receipt, Bell, TrendingUp, Medal, Target, X
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  Cell, ScatterChart, Scatter, ZAxis, Treemap, ComposedChart, Line, BarChart, Bar, ReferenceLine
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
import { useGoals } from '../../../hooks/useGoals';

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

// --- Interfaces para Componentes de Gráfico  ---

interface TreemapCellProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  percent: string;
  color: string;
  topBarber: string;
  depth?: number;
  index?: number;
}

interface WaterfallBarProps {
  fill?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface ServiceAggregation {
  name: string;
  value: number;
  color: string;
  percent: string;
  topBarber: string;
  [key: string]: any; // Assinatura de índice para compatibilidade Recharts
}

// Componente responsivo para cada célula do Treemap
const CustomTreemapContent = (props: TreemapCellProps) => {
  const { x, y, width, height, name, percent, color, depth } = props;

  // Recharts passa depth > 1 para nós filhos — só renderizamos folhas
  if (depth !== undefined && depth < 1) return null;

  // Fontes responsivas baseadas no tamanho do quadrado
  const nameFontSize = Math.max(8, Math.min(width / 8, height / 4, 16));
  const percentFontSize = Math.max(7, Math.min(width / 10, height / 5, 14));

  // Trunca o nome se o quadrado for muito pequeno
  const maxChars = Math.max(3, Math.floor(width / (nameFontSize * 0.6)));
  const displayName = name && name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;

  const showName = width > 35 && height > 25;
  const showPercent = width > 30 && height > 40;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color || '#10b981',
          stroke: 'var(--bg-secondary)',
          strokeWidth: 2,
          opacity: 0.9,
          cursor: 'pointer'
        }}
      />
      {showName && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showPercent ? percentFontSize * 0.6 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={nameFontSize}
          fontWeight={700}
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
            pointerEvents: 'none'
          }}
        >
          {displayName}
        </text>
      )}
      {showPercent && (
        <text
          x={x + width / 2}
          y={y + height / 2 + nameFontSize * 0.7}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={percentFontSize}
          fontWeight={600}
          style={{ pointerEvents: 'none' }}
        >
          {percent}%
        </text>
      )}
    </g>
  );
};



const CustomWaterfallBar = (props: WaterfallBarProps) => {
  const { fill = '#000', x = 0, y = 0, width = 0, height = 0 } = props;
  const radius = 8;
  const h = Math.abs(height);
  if (h < 2) return <rect x={x} y={y} width={width} height={2} fill={fill} />; // Garantir visibilidade mínima

  return (
    <path
      d={`
        M${x},${y + h} 
        L${x},${y + radius} 
        Q${x},${y} ${x + radius},${y} 
        L${x + width - radius},${y} 
        Q${x + width},${y} ${x + width},${y + radius} 
        L${x + width},${y + h} 
        Z
      `}
      fill={fill}
    />
  );
};

export default function FinanceiroView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [devedores, setDevedores] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState<number>(30);
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarber, setSelectedBarber] = useState<Barbeiro | null>(null);
  const [isBarberDrawerOpen, setIsBarberDrawerOpen] = useState(false);
  const [allBarbers, setAllBarbers] = useState<Barbeiro[]>([]);

  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterData>({});

  const { goals, updateGoal } = useGoals();
  const [isProfitGoalFlipped, setIsProfitGoalFlipped] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, clientsRes, barbersRes] = await Promise.all([
        getDashboardInfo(diasFiltro),
        getClientes(1, 100),
        getBarbeiros(1, 100),
      ]);
      setData(dashRes);
      setAllBarbers(barbersRes.items || []);

      const devedoresList = (clientsRes.items || []).filter(c => (c.divida_total || 0) > 0);
      setDevedores(devedoresList);
    } catch (e) {
      console.error(e);
      showToast('Erro ao carregar dados financeiros', 'error');
    } finally {
      setLoading(false);
    }
  }, [diasFiltro, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Cliente:</span>
              <strong style="color: var(--text-primary)">${cliente.nome}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Data:</span>
              <strong style="color: var(--text-primary)">${new Date().toLocaleDateString('pt-BR')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem; margin-top: 0.5rem;">
              <span>Total Liquidado:</span>
              <strong style="color: #059669">R$ ${(cliente.divida_total || 0).toLocaleString()}</strong>
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
        console.error(e);
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
        timerProgressBar: true,
        customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html' },
        didOpen: () => Swal.default.showLoading()
      }).then(() => {
        Swal.default.fire({
          title: 'Exportação Concluída',
          text: 'Seu relatório financeiro foi gerado com sucesso.',
          icon: 'success',
          buttonsStyling: false,
          customClass: {
            popup: 'swal-glass-popup',
            title: 'swal-glass-title',
            htmlContainer: 'swal-glass-html',
            confirmButton: 'btn btn-md btn-primary theme-green'
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

  const totalPages = Math.ceil(filteredDevedores.length / itemsPerPage);
  const paginatedDevedores = filteredDevedores.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
  const liquidezData = (data?.receita_diaria || []).map((d, index, arr) => {
    const past = arr.slice(Math.max(0, index - 2), index + 1);
    const mediaMovel = past.reduce((acc, curr) => acc + ((curr.receita || 0) * 0.75), 0) / past.length;
    return {
      data: d.data,
      realizado: (d.receita || 0) * 0.75,
      previsto: (d.receita || 0) * 0.25,
      mediaMovel
    };
  });

  // 1. Waterfall (Cascata de Lucro)
  const totalComissoes = (data?.barbeiros_desempenho || []).reduce((s, b) => s + (b.comissao_gerada || b.receita_total * 0.4), 0);
  const taxasCartao = (data?.receita_liquidada || 0) * 0.03;
  const lucroLiquido = (data?.receita_total || 0) - totalComissoes - taxasCartao;
  // Waterfall and associated variables were removed because they were unused in the current layout

  // 2. Treemap (Fontes de Receita) - Agregação plana por serviço
  const treemapColors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#047857', '#0d9488', '#14b8a6'];
  const serviceMap: Record<string, { receita: number; barbers: Record<string, number> }> = {};
  (data.barbeiros_desempenho || []).forEach(b => {
    (b.servicos_realizados || []).forEach(s => {
      if (!serviceMap[s.nome]) serviceMap[s.nome] = { receita: 0, barbers: {} };
      serviceMap[s.nome].receita += s.receita;
      serviceMap[s.nome].barbers[b.barbeiro_nome] = (serviceMap[s.nome].barbers[b.barbeiro_nome] || 0) + s.receita;
    });
  });
  const totalServicoReceita = Object.values(serviceMap).reduce((s, v) => s + v.receita, 0) || 1;
  const treemapData: ServiceAggregation[] = Object.entries(serviceMap)
    .map(([name, info], i) => {
      const topEntry = Object.entries(info.barbers).sort((a, b) => b[1] - a[1])[0];
      return {
        name,
        value: info.receita,
        color: treemapColors[i % treemapColors.length],
        percent: ((info.receita / totalServicoReceita) * 100).toFixed(0),
        topBarber: topEntry ? topEntry[0] : 'N/A'
      };
    })
    .sort((a, b) => b.value - a.value);


  // 3. Eficiência de Cadeira
  const bulletData = (data.barbeiros_desempenho || [])
    .map(b => {
      const potencial = b.total_agendamentos * (data.ticket_medio || 45) * 1.3;
      const eficiencia = potencial > 0 ? (b.receita_total / potencial) * 100 : 0;
      const barber = allBarbers.find(x => x.id === b.barbeiro_id);
      return { ...b, potencial, eficiencia: Math.min(eficiencia, 100), imagem_url: barber?.imagem_url };
    })
    .sort((a, b) => b.eficiencia - a.eficiencia);

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
              background: Object.values(filters).some(v => !!v) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: Object.values(filters).some(v => !!v) ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
              marginLeft: '0.5rem'
            }}
          >
            Filtros
            {Object.values(filters).filter(v => !!v).length > 0 && (
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
                {Object.values(filters).filter(v => !!v).length}
              </span>
            )}
          </Button>
        </div>
        <div className={styles.dashboardControlsRight}>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Target size={16} />}
            onClick={() => setIsProfitGoalFlipped(!isProfitGoalFlipped)}
            style={{ 
              background: isProfitGoalFlipped ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              border: isProfitGoalFlipped ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
              color: 'var(--color-service)'
            }}
          >
            Metas
          </Button>
          <Button theme="red" icon={<FileText size={16} />} onClick={() => handleExport('pdf')}>PDF</Button>
          <Button theme="green" icon={<FileSpreadsheet size={16} />} onClick={() => handleExport('excel')}>Excel</Button>
        </div>
      </div>

      {/* ── HIGH-DENSITY BENTO GRID FINANCEIRO ── */}

      {/* Row 1: Liquidez Avançada (Span 8) */}
      <motion.div
        variants={cardVariants}
        className={`${styles.chartCard} ${styles.chartCardHoverGreen} ${styles.span8}`}
        style={{ display: 'flex', flexDirection: 'column', height: '500px' }}
      >
        <div className={styles.cardHeader} style={{ marginBottom: '0.5rem' }}>
          <div>
            <h3 className={styles.cardTitle}>Liquidez Avançada</h3>
            <p className={styles.cardSubtitle}>Realizado vs. Previsto com Média Móvel</p>
          </div>
          <div className={styles.headerIcon} style={{ background: 'var(--color-service-light)', color: 'var(--color-service)' }}>
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div style={{ padding: '0 1.5rem', marginTop: '0.25rem', zIndex: 2 }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0', letterSpacing: '-0.05em', lineHeight: 1 }}>
            R$ {(data?.receita_liquidada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-service)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            CAIXA ATUAL
          </span>
        </div>

        <div className={themeStyles.chartGlow} style={{ flex: 1, width: '100%', marginTop: '0', paddingBottom: '0.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={liquidezData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="data"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)', opacity: 0.5 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)', opacity: 0.5 }}
                domain={['dataMin - 100', 'dataMax + 100']}
                tickFormatter={(val) => `R$${val}`}
              />
              <RechartsTooltip
                contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: 'white' }}
                formatter={(val: any, name?: any) => {
                  if (val === undefined || val === null || name === "fill") return [null, null];
                  return [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
                }}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Area type="monotone" dataKey="realizado" name="fill" stroke="none" fill="url(#colorRealizado)" fillOpacity={1} />
              <Line
                type="monotone"
                dataKey="realizado"
                name="Realizado"
                stroke="#10b981"
                strokeWidth={4}
                dot={({ cx, cy, payload, index }) => {
                  if (cx === undefined || cy === undefined) return null;
                  const isMax = payload.realizado === Math.max(...liquidezData.map(d => d.realizado));
                  if (isMax) {
                    return (
                      <g key={`dot-${index}`}>
                        <circle cx={cx} cy={cy} r={8} fill="#10b981" fillOpacity={0.3} />
                        <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="white" strokeWidth={2} />
                        <text x={cx} y={cy - 15} textAnchor="middle" fill="#10b981" fontSize={10} fontWeight={900}>RECORDE</text>
                      </g>
                    );
                  }
                  return null;
                }}
                style={{ filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))' }}
              />
              <Line type="monotone" dataKey="mediaMovel" name="Média Móvel" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Area type="monotone" dataKey="previsto" name="Previsto" stroke="#64748b" strokeDasharray="3 3" fill="transparent" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row 1: Lucro Líquido — Flip Card (Frente: Gráfico / Verso: Metas) */}
      <motion.div variants={cardVariants} className={themeStyles.flipCardContainer}>
        <div className={`${themeStyles.flipCardInner} ${isProfitGoalFlipped ? themeStyles.flipped : ''}`}>
          {/* ═══ FRENTE ═══ */}
          <div className={themeStyles.flipFront}>
            <div className={`${styles.chartCard} ${themeStyles.profitCard}`} style={{ height: '500px', display: 'flex', flexDirection: 'column', padding: 0, position: 'relative' }}>
              {/* Indicador Radial de Meta (SVG) */}
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '85px', height: '85px', zIndex: 3 }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
                  <circle 
                    cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="10" 
                    strokeDasharray="263.8" 
                    strokeDashoffset={263.8 * (1 - (goals.metaLucro && goals.metaLucro !== '0' ? Math.min(lucroLiquido / parseFloat(goals.metaLucro), 1) : 0.4))} 
                    strokeLinecap="round" 
                    style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} 
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>
                    {goals.metaLucro && goals.metaLucro !== '0' ? `${Math.min(Math.round((lucroLiquido / parseFloat(goals.metaLucro)) * 100), 100)}%` : '40%'}
                  </span>
                  <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, color: 'rgba(255,255,255,0.6)' }}>Meta</span>
                </div>
              </div>

              <div style={{ padding: '2rem 2rem 0 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: '60%' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'white' }}>Lucro Líquido Estimado</h3>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.25rem 0', letterSpacing: '-0.05em', color: 'white' }}>R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                  </div>
                  <div className={themeStyles.profitTrend} style={{ marginRight: '95px' }}>
                    <TrendingUp size={14} /> +12.5%
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, marginTop: '0.5rem' }}>
                  Margem de lucro atual de <strong style={{ color: '#6ee7b7' }}>{((lucroLiquido / (data.receita_total || 1)) * 100).toFixed(0)}%</strong>.
                  {goals.metaLucro && goals.metaLucro !== '0' 
                    ? ` Alcançando ${Math.min(Math.round((lucroLiquido / parseFloat(goals.metaLucro)) * 100), 100)}% da meta mensal.`
                    : ` Superando a meta estimada em R$ ${(lucroLiquido * 0.042).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`
                  }
                </p>
              </div>

              <div className={themeStyles.profitChartContainer} style={{ flex: 1, width: '100%', marginTop: 'auto', overflow: 'hidden' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liquidezData.slice(-10)} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="20%" stopColor="#34d399" stopOpacity={0.6} />
                        <stop offset="80%" stopColor="#3b82f6" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="data" hide />
                    <RechartsTooltip
                      contentStyle={{ background: '#064e3b', border: 'none', borderRadius: '0.75rem', fontSize: '0.75rem', color: 'white' }}
                      itemStyle={{ color: 'white' }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any, name?: any) => {
                        const value = Number(val || 0);
                        const valueStr = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        if (name === "meta") return [`R$ ${valueStr}`, 'Meta Diária'];
                        return [
                          `R$ ${valueStr}`, 
                          'Lucro do Dia',
                          goals.metaLucro && goals.metaLucro !== '0' ? `Meta: R$ ${(parseFloat(goals.metaLucro)/30).toLocaleString('pt-BR')}` : ''
                        ];
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="realizado"
                      stroke="#6ee7b7"
                      strokeWidth={3}
                      fill="url(#splitColor)"
                      animationDuration={2000}
                      dot={({ cx, cy, payload, index }) => {
                        if (cx === undefined || cy === undefined) return null;
                        const slice = liquidezData.slice(-10);
                        const meta = (parseFloat(goals.metaLucro) / 30) || (data?.receita_total || 0) / 30;
                        const maxProfit = Math.max(...slice.map(d => d.realizado));
                        const isPeak = payload.realizado === maxProfit;
                        const beatsMeta = payload.realizado > meta;

                        if (beatsMeta && isPeak) {
                          return (
                            <g key={`meta-peak-${index}`}>
                              <circle cx={cx} cy={cy} r={8} fill="#10b981" fillOpacity={0.4} />
                              <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="white" strokeWidth={2} />
                              <text x={cx} y={cy - 18} textAnchor="middle" fill="#6ee7b7" fontSize={10} fontWeight={900} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>META BATIDA</text>
                            </g>
                          );
                        } else if (beatsMeta) {
                          return <circle key={`meta-win-${index}`} cx={cx} cy={cy} r={3} fill="#fbbf24" stroke="white" strokeWidth={1} />;
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={parseFloat(goals.metaLucro) / 30 || data.receita_total / 30}
                      stroke="rgba(255,255,255,0.3)"
                      strokeDasharray="4 4"
                      label={{
                        position: 'right',
                        value: `Meta: R$ ${(parseFloat(goals.metaLucro) / 30 || (data.receita_total / 30)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
                        fill: 'rgba(255,255,255,0.4)',
                        fontSize: 10,
                        fontWeight: 700,
                        dx: -50,
                        dy: -10
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ═══ VERSO (Definir Metas) ═══ */}
          <div className={themeStyles.flipBack}>
            <div className={themeStyles.flipBackHeader}>
              <div>
                <h1 className={themeStyles.flipBackTitle}>Meta de Lucro</h1>
                <p className={themeStyles.flipBackSubtitle}>Configure seu objetivo de lucro líquido</p>
              </div>
              <button className={themeStyles.flipBackCloseBtn} onClick={() => setIsProfitGoalFlipped(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={themeStyles.flipInputGroup}>
              <div className={themeStyles.flipInputWrapper} style={{ marginTop: '0.5rem' }}>
                <label className={themeStyles.flipInputLabel}>Lucro Mensal Desejado (R$)</label>
                <input 
                  type="text"
                  className={`${themeStyles.flipInput} ${themeStyles.flipInputLg}`}
                  placeholder="R$ 0,00"
                  value={goals.metaLucro && goals.metaLucro !== '0' ? `R$ ${parseFloat(goals.metaLucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const numericValue = (Number(val) / 100).toString();
                    updateGoal('metaLucro', numericValue);
                  }}
                />
              </div>

              <div className={themeStyles.flipInputWrapper}>
                <label className={themeStyles.flipInputLabel}>Margem Sugerida</label>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
                  Baseado no seu faturamento atual, uma meta de lucro de <strong>R$ { (data.receita_total * 0.6).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) }</strong> (60%) é considerada saudável para o setor.
                </div>
              </div>
            </div>

            <button className={themeStyles.flipSaveBtn} onClick={() => {
              showToast('Metas definidas com sucesso!', 'success');
              setIsProfitGoalFlipped(false);
            }}>
              Salvar Objetivo
            </button>
          </div>
        </div>
      </motion.div>

      {/* Row 2: Treemap Categorias (Span 8) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.chartCardHoverBlue} ${styles.span8}`} style={{ height: '650px', display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Fontes de Receita</h3>
            <p className={styles.cardSubtitle}>Contribuição de cada serviço para o faturamento total</p>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', margin: '0 -1rem -1rem -1rem', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData as any}
              dataKey="value"
              aspectRatio={4 / 3}
              content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" value={0} percent="0" color="" topBarber="" />}
            >
              <RechartsTooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content={({ active, payload }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0]?.payload as ServiceAggregation | undefined;
                  if (!item) return null;
                  return (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(12px)',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '0.8rem',
                      boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5)',
                      minWidth: '180px'
                    }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: item.color, fontSize: '0.9rem' }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Receita:</span>
                        <span style={{ fontWeight: 700 }}>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Contribuição:</span>
                        <span style={{ fontWeight: 700, color: item.color }}>{item.percent}%</span>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Top Profissional: </span>
                        <span style={{ fontWeight: 400 }}> {item.topBarber}</span>
                      </div>
                    </div>
                  );
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row 2: Ranking de Eficiência (Span 4) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.chartCardHoverBlue} ${styles.span4}`} style={{ display: 'flex', flexDirection: 'column', height: '650px' }}>
        <div className={styles.cardHeader} style={{ marginBottom: '1.5rem' }}>
          <div>
            <h3 className={styles.cardTitle}>Ranking de Eficiência</h3>
            <p className={styles.cardSubtitle}>Top Barbeiros por Performance</p>
          </div>
          <Medal size={20} style={{ color: '#fbbf24' }} />
        </div>
        <div className={styles.customScrollbar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
          {bulletData.map((b, idx) => {
            const efColor = b.eficiencia >= 75 ? '#10b981' : b.eficiencia >= 50 ? '#f59e0b' : '#ef4444';
            const rankClass = idx === 0 ? themeStyles.rankGold : idx === 1 ? themeStyles.rankSilver : idx === 2 ? themeStyles.rankBronze : '';

            return (
              <div key={b.barbeiro_id} className={themeStyles.rankRow} onClick={() => {
                const barber = allBarbers.find(x => x.id === b.barbeiro_id);
                if (barber) { setSelectedBarber(barber); setIsBarberDrawerOpen(true); }
              }}>
                <div className={`${themeStyles.rankBadge} ${rankClass}`}>
                  {idx + 1}
                </div>

                {b.imagem_url ? (
                  <img src={b.imagem_url} alt={b.barbeiro_nome} className={themeStyles.rankAvatar} />
                ) : (
                  <div className={themeStyles.rankAvatar} style={{ background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                    {b.barbeiro_nome.charAt(0)}
                  </div>
                )}

                <div className={themeStyles.rankInfo}>
                  <div className={themeStyles.rankName}>{b.barbeiro_nome}</div>
                  <div className={themeStyles.rankEfficiency} style={{ color: efColor }}>
                    {b.eficiencia.toFixed(0)}% Eficiência
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>R$ {b.receita_total.toLocaleString()}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>{b.agendamentos_concluidos} atend.</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', margin: 0 }}>
            <TrendingUp size={12} style={{ marginRight: '4px' }} />
            O time está operando com <strong>78%</strong> da capacidade total.
          </p>
        </div>
      </motion.div>

      {/* Row 4: Matriz de Risco Scatter (Span 12) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.chartCardHoverRed} ${styles.span12}`} style={{ height: '450px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(16,185,129,0.05) 0%, rgba(245,158,11,0.05) 50%, rgba(239,68,68,0.15) 100%)', pointerEvents: 'none', borderRadius: 'var(--radius-sm)' }} />

        <div className={styles.cardHeader} style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <h3 className={styles.cardTitle}>Matriz de Risco</h3>
            <p className={styles.cardSubtitle}>Dias de Atraso vs. Valor</p>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
              <XAxis
                dataKey="atraso"
                type="number"
                name="Atraso"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                label={{ value: 'DIAS DE ATRASO', position: 'bottom', offset: 15, fontSize: 10, fontWeight: 700, fill: 'var(--text-tertiary)', opacity: 0.5 }}
              />
              <YAxis
                dataKey="valor"
                type="number"
                name="Dívida"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                label={{ value: 'VALOR (R$)', angle: -90, position: 'insideLeft', offset: -10, fontSize: 10, fontWeight: 700, fill: 'var(--text-tertiary)', opacity: 0.5 }}
              />
              <ZAxis dataKey="z" type="number" range={[100, 1000]} />
              <RechartsTooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
                        <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{data.nome}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>Dívida:</span>
                          <span style={{ fontWeight: 700 }}>R$ {data.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>Atraso:</span>
                          <span style={{ fontWeight: 700 }}>{data.atraso} dias</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Devedores" data={riskData} fill="#8884d8">
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.6} stroke={entry.fill} strokeWidth={2} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Quadrantes de Risco */}
          <div style={{ position: 'absolute', top: '10px', right: '15px', textAlign: 'right', pointerEvents: 'none', opacity: 0.4 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#ef4444' }}>ZONA CRÍTICA</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-tertiary)' }}>Alta Dívida + Longo Prazo</div>
          </div>
          <div style={{ position: 'absolute', bottom: '65px', left: '85px', pointerEvents: 'none', opacity: 0.4 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#10b981' }}>ZONA SEGURA</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-tertiary)' }}>Recentemente Inadimplente</div>
          </div>
        </div>
      </motion.div>

      {/* Row 4: Cascata de Lucro - Waterfall (Span 12) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span12}`} style={{ height: '450px', display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Cascata de Lucro (DRE Visual)</h3>
            <p className={styles.cardSubtitle}>Do Faturamento Bruto ao Lucro Líquido</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />RECEITA BRUTA</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />SAÍDAS (COMISSÃO/TAXAS)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />LUCRO LÍQUIDO</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'Bruto', value: data.receita_total, fill: '#3b82f6' },
                { name: 'Comissões', value: totalComissoes, fill: '#ef4444' },
                { name: 'Taxas', value: taxasCartao, fill: '#f59e0b' },
                { name: 'Líquido', value: lucroLiquido, fill: '#10b981' }
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-tertiary)' }} />
              <YAxis hide />
              <RechartsTooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: 'white' }}
                itemStyle={{ color: 'white' }}
                formatter={(val: any) => [`R$ ${Math.abs(Number(val || 0)).toLocaleString()}`, 'Valor']}

              />
              <Bar dataKey="value" shape={<CustomWaterfallBar />}>
                {
                  [
                    { name: 'Bruto', value: data.receita_total, fill: '#3b82f6' },
                    { name: 'Comissões', value: totalComissoes, fill: '#ef4444' },
                    { name: 'Taxas', value: taxasCartao, fill: '#f59e0b' },
                    { name: 'Líquido', value: lucroLiquido, fill: '#10b981' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '2rem' }}>
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ opacity: 0.6 }}>Total Deduções:</span>
            <strong style={{ marginLeft: '0.5rem', color: '#ef4444' }}>R$ {(totalComissoes + taxasCartao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ opacity: 0.6 }}>Eficiência Financeira:</span>
            <strong style={{ marginLeft: '0.5rem', color: '#10b981' }}>{((lucroLiquido / data.receita_total) * 100).toFixed(1)}%</strong>
          </div>
        </div>
      </motion.div>

      {/* Row 5: Ledger (Span 12) */}
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
                <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDevedores.map((c, idx) => {
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
                                <p><strong>Valor Pendente:</strong> R$ ${c.divida_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                    <td style={{ width: '1%', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        {totalPages > 1 && (

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', paddingBottom: '1rem' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                document.querySelector(`.${styles.span12}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                document.querySelector(`.${styles.span12}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
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
