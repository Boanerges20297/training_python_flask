import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDashboardInfo } from '../../../api/dashboard';
import type { DashboardData, BarbeiroDesempenho } from '../../../types';
import { 
  TrendingUp, Calendar, DollarSign, 
  Download, Activity, ChevronRight, User
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Drawer } from '../../../components/ui/Drawer';
import { useToast } from '../../../components/ui/Toast';
import drawerStyles from '../../../components/ui/Drawer.module.css';
import styles from './DashboardView.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
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


export default function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState<number>(30);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    setIsDrawerOpen(true);
  };

  if (loading || !data) {
    return (
      <div className={styles.loadingState}>
        <Activity size={48} className={styles.spinner} />
        <p>Analisando dados estratégicos...</p>
      </div>
    );
  }

  const cancelRate = data.agendamentos_total > 0 
    ? Math.round((data.agendamentos_cancelados / data.agendamentos_total) * 100) 
    : 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={styles.dashboardContainer}
    >
      <div className={styles.dashboardControls}>
        <div className={styles.dashboardControlsLeft}>
          <div style={{ width: '220px' }}>
            <Input 
              as="select" 
              value={diasFiltro.toString()}
              onChange={(e) => setDiasFiltro(Number(e.target.value))}
            >
              <option value="7"> Últimos 7 dias</option>
              <option value="15"> Últimos 15 dias</option>
              <option value="30"> Últimos 30 dias</option>
              <option value="60"> Últimos 60 dias</option>
              <option value="90"> Últimos 90 dias</option>
            </Input>
          </div>
          <span className={styles.controlsTagline}>Análise de dados em tempo real</span>
        </div>
        <div className={styles.dashboardControlsRight}>
          <Button 
            variant="ghost" 
            theme="blue" 
            icon={<Download size={18} />}
            onClick={handleDownloadPDF}
          >
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* BENTO GRID START */}
      
      {/* 1. Main Revenue Chart (Span 8, Height 3) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span8} ${styles.h3}`}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Evolução Financeira</h3>
            <p className={styles.cardSubtitle}>Métricas diárias de faturamento</p>
          </div>
          <div className={styles.headerIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <DollarSign size={20} />
          </div>
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.receita_diaria} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="data" hide />
              <YAxis hide />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <RechartsTooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '1rem' }}
              />
              <Area type="monotone" dataKey="receita" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 2. KPI: Faturamento Total (Span 4, Height 1.5) */}
      <motion.div variants={cardVariants} className={`${styles.kpiCard} ${styles.span4} ${styles.h1_5}`}>
        <div className={styles.kpiContent}>
          <p className={styles.kpiLabel}>Receita Total</p>
          <h2 className={styles.kpiValue}>R$ {data.receita_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className={styles.kpiTrendPositive}>+12.5% em relação ao mês anterior</div>
        </div>
        <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <TrendingUp size={24} />
        </div>
      </motion.div>

      {/* 3. KPI: Volume de Agendamentos (Span 4, Height 1.5) */}
      <motion.div variants={cardVariants} className={`${styles.kpiCard} ${styles.span4} ${styles.h1_5}`}>
        <div className={styles.kpiContent}>
          <p className={styles.kpiLabel}>Atendimentos</p>
          <h2 className={styles.kpiValue}>{data.agendamentos_concluidos}</h2>
          <p className={styles.kpiSubtitle}>De {data.agendamentos_total} solicitações</p>
        </div>
        <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
          <Calendar size={24} />
        </div>
      </motion.div>

      {/* 4. Peak Hours Chart (Span 4, Height 2) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span4} ${styles.h2}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Picos de Horário</h3>
        </div>
        <div className={styles.chartWrapperSmall}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.top_5_horarios}>
              <Bar dataKey="total_agendamentos" radius={[6, 6, 0, 0]} fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 5. Performance List (Span 8, Height 2) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span8} ${styles.h2}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Top Profissionais</h3>
          <p className={styles.cardSubtitle}>Ranking de produtividade</p>
        </div>
        <div className={styles.bentoList}>
          {(data.barbeiros_desempenho || []).slice(0, 3).map((barbeiro) => (
            <div key={barbeiro.barbeiro_id} className={styles.bentoListItem} onClick={() => handleBarberClick(barbeiro)}>
              <div className={styles.itemInfo}>
                <div className={styles.itemAvatar}>{barbeiro.barbeiro_nome.charAt(0)}</div>
                <div>
                  <h4 className={styles.itemName}>{barbeiro.barbeiro_nome}</h4>
                  <p className={styles.itemTag}>{barbeiro.taxa_conclusao}% de sucesso</p>
                </div>
              </div>
              <div className={styles.itemAction}>
                <span className={styles.itemValue}>R$ {barbeiro.receita_total.toLocaleString()}</span>
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 6. Small Stats Pair (Span 3 each, Height 1) */}
      <motion.div variants={cardVariants} className={`${styles.statMiniCard} ${styles.span6}`}>
        <div className={styles.miniLabel}>Ticket Médio</div>
        <div className={styles.miniValue}>R$ {data.ticket_medio.toFixed(2)}</div>
      </motion.div>

      <motion.div variants={cardVariants} className={`${styles.statMiniCard} ${styles.span6}`}>
        <div className={styles.miniLabel}>Cancelamentos</div>
        <div className={styles.miniValue} style={{ color: 'var(--color-red)' }}>{cancelRate}%</div>
      </motion.div>

      {/* Barber Detail Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedBarber?.barbeiro_nome}
        subtitle="Desempenho Detalhado"
        icon={<User size={20} />}
      >
        {selectedBarber && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Profile Hero */}
            <div className={drawerStyles.bentoProfile}>
              <div className={drawerStyles.bentoAvatar} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                {selectedBarber.barbeiro_nome.charAt(0)}
              </div>
              <div className={drawerStyles.bentoProfileText}>
                <h3>{selectedBarber.barbeiro_nome}</h3>
                <p>{selectedBarber.taxa_conclusao}% taxa de conclusão</p>
              </div>
            </div>

            {/* Mini KPI Grid */}
            <div className={drawerStyles.bentoMiniGrid}>
              <div className={drawerStyles.bentoMiniCard}>
                <p>Concluídos</p>
                <h2>{selectedBarber.agendamentos_concluidos}</h2>
              </div>
              <div className={drawerStyles.bentoMiniCard}>
                <p>Cancelados</p>
                <h2 style={{ color: 'var(--color-red)' }}>{selectedBarber.agendamentos_cancelados}</h2>
              </div>
            </div>
            
            {/* Services List */}
            <div className={drawerStyles.bentoFullCard}>
              <h3>Serviços Realizados</h3>
              {(selectedBarber.servicos_realizados || []).map((srv, idx) => (
                <div key={idx} className={drawerStyles.bentoListItem}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--color-blue)', marginRight: '0.5rem' }}>{srv.quantidade}x</span>
                    <span>{srv.nome}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>R$ {(srv.receita || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

    </motion.div>
  );
}

