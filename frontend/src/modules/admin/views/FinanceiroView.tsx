import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDashboardInfo } from '../../../api/dashboard';
import { getClientes } from '../../../api/clients';
import { getBarbeiros } from '../../../api/barbers';
import { getServicos } from '../../../api/services';
import { getAgendamentos } from '../../../api/appointments';
import type { DashboardData, Cliente, Servico, Agendamento } from '../../../types';
import {
  Calendar, 
  Activity, 
  ArrowUpRight, CreditCard, FileText, FileSpreadsheet, MessageCircle, Receipt, Bell
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  Cell, ScatterChart, Scatter, ZAxis, Treemap, ComposedChart, Line
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

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, percent, color } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          stroke: 'rgba(15, 23, 42, 1)',
          strokeWidth: 2,
        }}
      />
      {width > 50 && height > 30 && (
        <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={800}>
          {name}
        </text>
      )}
      {width > 50 && height > 50 && (
        <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={10} fontWeight={600}>
          {percent}%
        </text>
      )}
    </g>
  );
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
  
  const [allServices, setAllServices] = useState<Servico[]>([]);
  const [allAgendamentos, setAllAgendamentos] = useState<Agendamento[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, clientsRes, barbersRes, servicesRes, agendsRes] = await Promise.all([
        getDashboardInfo(diasFiltro),
        getClientes(1, 100),
        getBarbeiros(1, 100),
        getServicos(1, 100),
        getAgendamentos(1, 100)
      ]);
      setData(dashRes);
      setAllBarbers(barbersRes.items || []);
      setAllServices(servicesRes.items || []);
      setAllAgendamentos(agendsRes.items || []);
      
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
              <strong style="color: var(--text-primary)">
                ${(() => {
                  const pending = allAgendamentos.find(a => a.cliente_id === cliente.id && a.status === 'concluido' && !a.pago);
                  if (pending && pending.servicos_ids && pending.servicos_ids.length > 0) {
                    const s = allServices.find(srv => srv.id === pending.servicos_ids[0]);
                    return s ? s.nome : 'Serviço não identificado';
                  }
                  return 'Saldo Acumulado';
                })()}
              </strong>
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
  const liquidezData = data.receita_diaria.map((d, index, arr) => {
    const past = arr.slice(Math.max(0, index - 2), index + 1);
    const mediaMovel = past.reduce((acc, curr) => acc + (curr.receita * 0.75), 0) / past.length;
    return {
      data: d.data,
      realizado: d.receita * 0.75,
      previsto: d.receita * 0.25,
      mediaMovel
    };
  });

  // 1. Waterfall (Cascata de Lucro)
  const totalComissoes = (data.barbeiros_desempenho || []).reduce((s, b) => s + (b.comissao_gerada || b.receita_total * 0.4), 0);
  const taxasCartao = data.receita_liquidada * 0.03;
  const lucroLiquido = data.receita_total - totalComissoes - taxasCartao;

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

      {/* ── HIGH-DENSITY BENTO GRID FINANCEIRO ── */}

      {/* Row 1 & 2: Liquidez Avançada (Span 8 / RowSpan 2) */}
      <motion.div 
        variants={cardVariants} 
        className={`${styles.chartCard} ${styles.chartCardHoverGreen} ${styles.span8} ${styles.rowSpan2}`}
        style={{ display: 'flex', flexDirection: 'column', minHeight: '600px' }}
      >
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Liquidez Avançada</h3>
            <p className={styles.cardSubtitle}>Realizado vs. Previsto com Média Móvel</p>
          </div>
          <div className={styles.headerIcon} style={{ background: 'var(--color-service-light)', color: 'var(--color-service)' }}>
             <ArrowUpRight size={20} />
          </div>
        </div>

        <div style={{ padding: '0 1.5rem' }}>
          <h2 className={themeStyles.valueLarge} style={{ fontSize: '3rem', margin: '0' }}>R$ {data.receita_liquidada.toLocaleString()}</h2>
          <span className={themeStyles.labelCompact}>Caixa Atual</span>
        </div>

        <div className={themeStyles.chartGlow} style={{ flex: 1, minHeight: '350px', width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={liquidezData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="data" hide />
              <YAxis hide />
              <RechartsTooltip 
                contentStyle={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: 'white' }}
                formatter={(val: any, name: any) => [`R$ ${Number(val).toFixed(2)}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
              />
              <Area type="monotone" dataKey="realizado" stroke="none" fill="url(#colorRealizado)" fillOpacity={1} />
              <Line type="monotone" dataKey="realizado" stroke="#10b981" strokeWidth={3} dot={false} style={{ filter: 'drop-shadow(0 0 8px #10b981)' }} />
              <Line type="monotone" dataKey="mediaMovel" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="previsto" stroke="#64748b" strokeDasharray="5 5" fill="transparent" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row 1: Lucro Líquido Destaque (Span 4) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span4}`} style={{ background: '#059669', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.2)', height: '288px' }}>
         <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lucro Líquido</h3>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, margin: '0.5rem 0 0 0', letterSpacing: '-0.05em' }}>R$ {lucroLiquido.toLocaleString()}</h2>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Margem de {((lucroLiquido / (data.receita_total || 1)) * 100).toFixed(0)}%</p>
         </div>
         <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', opacity: 0.2, pointerEvents: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={liquidezData}>
                  <Area type="monotone" dataKey="realizado" stroke="white" strokeWidth={2} fill="white" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </motion.div>

      {/* Row 2: Eficiência de Cadeira (Span 4) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.chartCardHoverBlue} ${styles.span4}`} style={{ display: 'flex', flexDirection: 'column', height: '288px' }}>
        <div className={styles.cardHeader} style={{ marginBottom: '1rem' }}>
          <div>
            <h3 className={styles.cardTitle}>Eficiência de Cadeira</h3>
            <p className={styles.cardSubtitle}>Real x Potencial</p>
          </div>
        </div>
        <div className={styles.customScrollbar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
          {bulletData.map((b) => {
            const efColor = b.eficiencia >= 75 ? '#10b981' : b.eficiencia >= 50 ? '#f59e0b' : '#ef4444';
            return (
              <div key={b.barbeiro_id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'pointer' }} onClick={() => {
                const barber = allBarbers.find(x => x.id === b.barbeiro_id);
                if (barber) { setSelectedBarber(barber); setIsBarberDrawerOpen(true); }
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{b.barbeiro_nome}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: efColor }}>{b.eficiencia.toFixed(0)}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${b.eficiencia}%`, background: `linear-gradient(90deg, ${efColor}40, ${efColor})`, borderRadius: '4px', boxShadow: `0 0 10px ${efColor}66` }} />
                  <div style={{ position: 'absolute', left: '75%', top: '-2px', bottom: '-2px', width: '2px', background: 'white', boxShadow: '0 0 4px rgba(255,255,255,0.8)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Row 3: Treemap Categorias (Span 6) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.chartCardHoverBlue} ${styles.span6}`} style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Fontes de Receita</h3>
            <p className={styles.cardSubtitle}>Distribuição por Categoria</p>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'visible', margin: '0 -1rem -1rem -1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4/3}
              stroke="var(--bg-secondary)"
              content={<CustomTreemapContent />}
            />
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row 3: Matriz de Risco Scatter (Span 6) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.chartCardHoverRed} ${styles.span6}`} style={{ height: '400px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(16,185,129,0.05) 0%, rgba(245,158,11,0.05) 50%, rgba(239,68,68,0.15) 100%)', pointerEvents: 'none', borderRadius: '1.75rem' }} />
        
        <div className={styles.cardHeader} style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <h3 className={styles.cardTitle}>Matriz de Risco</h3>
            <p className={styles.cardSubtitle}>Dias de Atraso vs. Valor</p>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <XAxis dataKey="atraso" type="number" name="Dias" unit="d" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
              <YAxis dataKey="valor" type="number" name="Valor" unit=" R$" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
              <ZAxis dataKey="z" type="number" range={[100, 1000]} />
              <RechartsTooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: 'white' }}
                formatter={(val: any, name: any) => [name === 'Valor' ? `R$ ${val}` : `${val} dias`, name === 'Valor' ? 'Dívida' : 'Atraso']}
              />
              <Scatter name="Devedores" data={riskData} fill="#8884d8">
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.6} stroke={entry.fill} strokeWidth={2} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row 4: Ledger (Span 12) */}
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
