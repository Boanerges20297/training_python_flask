import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDashboardInfo } from '../../../api/dashboard';
import { getClientes } from '../../../api/clients';
import { getBarbeiros } from '../../../api/barbers';
import type { DashboardData, Cliente } from '../../../types';
import {
  Calendar, 
  Activity, 
  ArrowUpRight, CreditCard, FileText, FileSpreadsheet, MessageCircle, PieChart as PieChartIcon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
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
        <div style="display: flex; flex-direction: column; gap: 1.25rem; text-align: left; padding: 0.5rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">ID do Barbeiro</label>
            <input type="number" id="filter-barbeiro" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: 10" value="${filters.profissionalId || ''}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Filtro',
      cancelButtonText: 'Limpar',
      confirmButtonColor: 'var(--color-primary)',
      background: 'transparent',
      customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html' },
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
              <strong style="color: var(--text-primary)">Corte de Cabelo</strong>
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
      background: 'transparent',
      color: 'var(--text-primary)',
      confirmButtonColor: '#059669',
      customClass: { 
        popup: 'swal-glass-popup', 
        title: 'swal-glass-title', 
        confirmButton: 'swal-glass-confirm',
        cancelButton: 'swal-glass-cancel'
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

  // --- MOCK DATA FOR CHARTS ---
  const liquidezData = data.receita_diaria.map(d => ({
    data: d.data,
    realizado: d.receita * 0.75, // Simula a porção já liquidada
    previsto: d.receita * 0.25  // Simula a porção pendente
  }));

  const categoriasData = [
    { name: 'Corte Premium', value: data.receita_liquidada * 0.55, color: '#059669' },
    { name: 'Barba & Cuidados', value: data.receita_liquidada * 0.25, color: '#10b981' },
    { name: 'Produtos', value: data.receita_liquidada * 0.15, color: '#34d399' },
    { name: 'Outros', value: data.receita_liquidada * 0.05, color: '#6ee7b7' },
  ];

  const riskData = filteredDevedores.map((d, i) => {
    const atraso = (i * 12) % 45 + 5; // Simula dias de atraso de 5 a 50
    return {
      id: d.id,
      nome: d.nome,
      valor: d.divida_total || 0,
      atraso: atraso,
      z: d.divida_total || 1, // bubble size
      fill: atraso > 30 ? '#ef4444' : (atraso > 15 ? '#f59e0b' : '#10b981')
    };
  });

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
        </div>
        <div className={styles.dashboardControlsRight}>
          <Button 
            variant="ghost" 
            theme="blue" 
            size="sm"
            icon={<Filter size={16} />} 
            onClick={handleFilterClick}
            style={{ 
              background: Object.keys(filters).some(k => (filters as any)[k]) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: Object.keys(filters).some(k => (filters as any)[k]) ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
              marginRight: '0.5rem'
            }}
          >
            Filtros
          </Button>
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

      {/* Distribuição de Receita (Span 4) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span4} ${styles.h2}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Fontes de Receita</h3>
            <p className={styles.cardSubtitle}>Distribuição por Categoria</p>
          </div>
          <div className={styles.headerIcon} style={{ background: 'var(--color-appointment-light)', color: 'var(--color-appointment)' }}>
            <PieChartIcon size={20} />
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoriasData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoriasData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(val: any) => [`R$ ${Number(val).toLocaleString()}`, 'Receita']}
                contentStyle={{ borderRadius: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Corte</div>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>55%</span>
          </div>
        </div>
      </motion.div>

      {/* Row 2: Performance de Barbeiros (Span 8) */}
      <motion.div variants={cardVariants} className={`${styles.chartCard} ${styles.span8} ${styles.h2}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className={styles.cardHeader} style={{ marginBottom: '1rem' }}>
          <div>
            <h3 className={styles.cardTitle}>Performance por Profissional</h3>
            <p className={styles.cardSubtitle}>Comissão gerada vs. Retenção do salão</p>
          </div>
        </div>
        <div className={`${styles.customScrollbar}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
          {(data.barbeiros_desempenho || []).map((barbeiro) => {
            const comissao = barbeiro.comissao_gerada || (barbeiro.receita_total * 0.4);
            const retencao = barbeiro.receita_total - comissao;
            
            return (
            <div 
              key={barbeiro.barbeiro_id} 
              style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => {
                const b = allBarbers.find(x => x.id === barbeiro.barbeiro_id);
                if (b) { setSelectedBarber(b); setIsBarberDrawerOpen(true); }
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-service)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-service-light)', color: 'var(--color-service)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
                    {barbeiro.barbeiro_nome.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{barbeiro.barbeiro_nome}</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{barbeiro.agendamentos_concluidos} cortes</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>R$ {barbeiro.receita_total.toLocaleString()}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Total Faturado</p>
                </div>
              </div>
              
              {/* Barra de Progresso Sutil (Comissão vs Retenção) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--color-service)' }}>Comissão (R$ {comissao.toLocaleString()})</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>Salão (R$ {retencao.toLocaleString()})</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(comissao / (barbeiro.receita_total || 1)) * 100}%`, background: 'var(--color-service)', borderRadius: '3px' }} />
                </div>
              </div>
            </div>
          )})}
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
                  <th>Cliente Beneficiário</th>
                  <th>Saldo Devedor Acumulado</th>
                  <th style={{ textAlign: 'right' }}>Ações de Liquidação</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevedores.map(c => (
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
                         <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-service-light)', color: 'var(--color-service)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
                             {c.nome.charAt(0)}
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
                ))}
                {filteredDevedores.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '4rem', textAlign: 'center' }}>
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
