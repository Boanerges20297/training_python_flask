// BarberDrawer — Drawer de criação/edição de barbeiros
import React, { useState, useEffect } from 'react';
import { createBarbeiro, updateBarbeiro } from '../../../api/barbers';
import { getServicos } from '../../../api/services';
import type { Barbeiro, Servico } from '../../../types';
import { User, Phone, Mail, Plus, Edit2, Lock, ToggleLeft, ToggleRight, Scissors, History, TrendingUp, DollarSign, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAgendamentos } from '../../../api/appointments';
import { getClientes } from '../../../api/clients';
import { Drawer } from '../../../components/ui/Drawer';
import Input, { cleanPhone } from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import ImageUpload from '../../../components/ui/ImageUpload';
import { SPECIALTIES, getSpecialtyLabel } from '../constants/specialties';
import drawerStyles from '../../../components/ui/Drawer.module.css';
import { notify } from '../../../utils/notifications';

interface BarberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  barbeiroParaEditar?: Barbeiro | null;
}

const BarberDrawer: React.FC<BarberDrawerProps> = ({ isOpen, onClose, onSuccess, barbeiroParaEditar }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ 
    nome: '', 
    email: '', 
    telefone: '', 
    senha: '', 
    ativo: true,
    justificativa: '',
    servicos_ids: [] as number[],
    especialidades: [] as string[],
    imagem_url: ''
  });
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [activeTab, setActiveTab] = useState<'dados' | 'financeiro'>('dados');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTermHistory, setSearchTermHistory] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (barbeiroParaEditar) {
        setFormData({
          nome: barbeiroParaEditar.nome,
          email: barbeiroParaEditar.email,
          telefone: barbeiroParaEditar.telefone,
          senha: '',
          ativo: barbeiroParaEditar.ativo,
          justificativa: barbeiroParaEditar.justificativa || '',
          servicos_ids: barbeiroParaEditar.servicos_ids || [],
          especialidades: barbeiroParaEditar.especialidades || [],
          imagem_url: barbeiroParaEditar.imagem_url || ''
        });
        setMode('view');
      } else {
        setFormData({ nome: '', email: '', telefone: '', senha: '', ativo: true, justificativa: '', servicos_ids: [], especialidades: [], imagem_url: '' });
        setMode('edit');
      }

      const fetchServicos = async () => {
        try {
          const response = await getServicos(1, 100);
          setServicos(response.items || []);
        } catch (err) {
          console.error("Erro ao carregar serviços:", err);
        }
      };
      fetchServicos();

      if (barbeiroParaEditar) {
        fetchFinancialHistory();
      }
    }
  }, [isOpen, barbeiroParaEditar]);

  const fetchFinancialHistory = async () => {
    if (!barbeiroParaEditar) return;
    setLoadingHistory(true);
    try {
      const [agends, cls] = await Promise.all([
        getAgendamentos(1, 100),
        getClientes(1, 100)
      ]);
      
      // Filtrar agendamentos deste barbeiro que estão concluídos
      const filtered = (agends.items || []).filter((a: any) => 
        a.barbeiro_id === barbeiroParaEditar.id && a.status === 'concluido'
      );
      
      setHistory(filtered);
      setClientes(cls.items || []);
    } catch (e) {
      console.error("Erro ao carregar histórico financeiro do barbeiro", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.telefone.replace(/\D/g, "").length < 10) {
      showToast("Por favor, insira um telefone válido com DDD.", 'error');
      return;
    }
    if (!isValidEmail(formData.email)) {
      showToast("Por favor, insira um e-mail válido.", 'error');
      return;
    }
    if (!barbeiroParaEditar && !formData.senha) {
      showToast("A senha é obrigatória para o cadastro.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (barbeiroParaEditar) {
        const { senha, ...updateData } = formData;
        const payload = { ...updateData, telefone: cleanPhone(formData.telefone) };
        const success = await updateBarbeiro(barbeiroParaEditar.id!, payload);
        if (!success) throw new Error("Erro ao atualizar barbeiro.");
        
        if (barbeiroParaEditar.ativo && !payload.ativo) {
          notify({
            title: 'Profissional Desativado',
            message: `${payload.nome} foi marcado como inativo. Motivo: ${payload.justificativa || 'Não informado'}`,
            type: 'warning'
          });
        }
        
        showToast('Perfil atualizado com sucesso!', 'success');
      } else {
        const payload = { ...formData, telefone: cleanPhone(formData.telefone) };
        await createBarbeiro(payload);
        showToast('Barbeiro adicionado ao time!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || err.response?.data?.erro || 'Erro ao processar solicitação.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'view' ? barbeiroParaEditar?.nome || "Detalhes" : (barbeiroParaEditar ? "Editar Barbeiro" : "Novo Barbeiro")}
      subtitle={mode === 'view' ? (barbeiroParaEditar?.especialidades?.map(e => getSpecialtyLabel(e)).join(', ') || 'Profissional') : (barbeiroParaEditar ? "Atualize o perfil do profissional." : "Adicione um novo profissional ao time.")}
      icon={<Scissors size={20} color="var(--color-barber)" />}
      iconBg="var(--color-barber-light)"
      iconBorder="var(--color-barber-border)"
      footer={
        mode === 'view' ? (
          <>
            <Button
              theme="amber"
              onClick={() => setMode('edit')}
              icon={<Edit2 size={18} />}
            >
              Editar Informações
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </>
        ) : (
          <>
            <Button
              theme="amber"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              icon={barbeiroParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
            >
              {barbeiroParaEditar ? "Salvar Alterações" : "Adicionar Barbeiro"}
            </Button>
            <Button variant="ghost" onClick={() => barbeiroParaEditar ? setMode('view') : onClose()} disabled={isSubmitting}>
              Cancelar
            </Button>
          </>
        )
      }
    >
      {mode === 'view' && barbeiroParaEditar && (
        <div className={drawerStyles.glassTabs}>
          <button 
            onClick={() => setActiveTab('dados')}
            className={`${drawerStyles.tabButton} ${activeTab === 'dados' ? drawerStyles.tabButtonActive : ''}`}
          >
            Dados Gerais
          </button>
          <button 
            onClick={() => setActiveTab('financeiro')}
            className={`${drawerStyles.tabButton} ${activeTab === 'financeiro' ? drawerStyles.tabButtonActive : ''}`}
          >
            Financeiro
          </button>
        </div>
      )}

      {mode === 'view' && barbeiroParaEditar ? (
        activeTab === 'dados' ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className={drawerStyles.bentoGrid}
        >
          {/* Header Group: Foto e Nome Lado a Lado */}
          <div className={drawerStyles.bentoHeaderGroup}>
            {/* Card da Foto (Quadrado) */}
            <div className={`${drawerStyles.bentoCard} ${drawerStyles.photoCard}`} style={{ padding: '1rem' }}>
              {barbeiroParaEditar.imagem_url ? (
                <img 
                  src={barbeiroParaEditar.imagem_url} 
                  alt={barbeiroParaEditar.nome} 
                  className={drawerStyles.heroAvatar}
                  style={{ width: '100px', height: '100px' }}
                />
              ) : (
                <div className={drawerStyles.heroAvatar} style={{ 
                  width: '100px', height: '100px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-barber-light)', color: 'var(--color-barber)',
                  fontSize: '2.5rem', fontWeight: '800'
                }}>
                  {barbeiroParaEditar.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Card do Nome com ID */}
            <div className={`${drawerStyles.bentoCard} ${drawerStyles.nameCard}`} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
              <span className="badge badge-amber badge-corner">ID #{barbeiroParaEditar.id}</span>
              <span className={drawerStyles.subcardLabel}>Profissional</span>
              <h2 style={{ fontSize: '1.25rem' }}>{barbeiroParaEditar.nome}</h2>
              <div style={{ 
                fontSize: '0.7rem', color: 'var(--text-tertiary)', 
                display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
                marginTop: '0.65rem'
              }}>
                {barbeiroParaEditar.especialidades?.length > 0 ? (
                  barbeiroParaEditar.especialidades.map(e => (
                    <span key={e} className="pill">
                      {getSpecialtyLabel(e)}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Sem especialidade</span>
                )}
              </div>
            </div>
          </div>

          {/* Badge de Status (Card Bento Único) */}
          <div className={drawerStyles.bentoCard} style={{ padding: '1rem 1.5rem' }}>
             <div style={{ 
                display: 'inline-flex', padding: '0.4rem 1rem', 
                borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700, 
                background: barbeiroParaEditar.ativo ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)', 
                color: barbeiroParaEditar.ativo ? '#4ade80' : '#f87171',
                border: `1px solid ${barbeiroParaEditar.ativo ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
              }}>
                {barbeiroParaEditar.ativo ? '● DISPONÍVEL / ATIVO' : '● AFASTADO / INATIVO'}
              </div>
          </div>

          {/* Card de Contatos Único com Subcards */}
          <div className={drawerStyles.bentoCard}>
            <span className={drawerStyles.subcardLabel} style={{ marginBottom: '1rem', display: 'block' }}>Informações de Contato</span>
            <div className={drawerStyles.bentoContactGroup}>
              <div className={drawerStyles.bentoSubcard}>
                <span className={drawerStyles.subcardLabel}>E-mail</span>
                <span className={drawerStyles.subcardValue}>{barbeiroParaEditar.email}</span>
              </div>
              <div className={drawerStyles.bentoSubcard}>
                <span className={drawerStyles.subcardLabel}>Telefone</span>
                <span className={drawerStyles.subcardValue}>{barbeiroParaEditar.telefone}</span>
              </div>
            </div>
          </div>

          {/* Bento de Justificativa (Se inativo) */}
          {!barbeiroParaEditar.ativo && barbeiroParaEditar.justificativa && (
            <div className={drawerStyles.bentoCard} style={{ background: 'rgba(248, 113, 113, 0.03)' }}>
              <span className={drawerStyles.subcardLabel} style={{ color: '#f87171' }}>Motivo do Afastamento</span>
              <p style={{ margin: '0.75rem 0 0 0', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {barbeiroParaEditar.justificativa}
              </p>
            </div>
          )}

          {/* Serviços Atribuídos */}
          <div className={drawerStyles.bentoCard}>
             <span className={drawerStyles.subcardLabel} style={{ marginBottom: '0.75rem', display: 'block' }}>Serviços Realizados</span>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                {barbeiroParaEditar.servicos_ids && barbeiroParaEditar.servicos_ids.length > 0 ? (
                  barbeiroParaEditar.servicos_ids.map(id => {
                    const serv = servicos.find(s => s.id === id);
                    return (
                      <span key={id} style={{ padding: '0.5rem 0.85rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        {serv?.nome || `Serviço #${id}`}
                      </span>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Nenhum serviço vinculado.</span>
                )}
             </div>
          </div>

          {/* Seção de Auditoria */}
          <div className={drawerStyles.bentoCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} color="var(--text-tertiary)" />
              <span className={drawerStyles.subcardLabel}>Informações do Sistema</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Cadastrado em:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {barbeiroParaEditar.data_cadastro 
                  ? new Date(barbeiroParaEditar.data_cadastro).toLocaleString('pt-BR') 
                  : 'Não disponível'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Atualizado em:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {barbeiroParaEditar.data_atualizacao 
                  ? new Date(barbeiroParaEditar.data_atualizacao).toLocaleString('pt-BR') 
                  : 'Nenhuma alteração registrada'}
              </span>
            </div>
          </div>
        </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className={drawerStyles.bentoGrid}
          >
            {/* Indicadores Financeiros do Barbeiro */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={drawerStyles.bentoCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <TrendingUp size={16} color="var(--color-service)" />
                  <span className={drawerStyles.subcardLabel}>Receita Gerada</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  R$ {history.reduce((acc, a) => acc + (a.preco || 0), 0).toLocaleString()}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>Faturamento Bruto Total</p>
              </div>
              <div className={drawerStyles.bentoCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <DollarSign size={16} color="var(--color-barber)" />
                  <span className={drawerStyles.subcardLabel}>Comissão Estimada</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-barber)', marginTop: '0.25rem' }}>
                  R$ {(history.reduce((acc, a) => acc + (a.preco || 0), 0) * (barbeiroParaEditar.comissao_percentual || 40) / 100).toLocaleString()}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>Taxa: {barbeiroParaEditar.comissao_percentual || 40}%</p>
              </div>
            </div>

            <div className={drawerStyles.bentoCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span className={drawerStyles.subcardLabel}>Auditoria de Produção</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                  {history.length} Atendimentos
                </span>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <Input 
                  placeholder="Buscar no histórico (cliente, serviço)..." 
                  value={searchTermHistory}
                  onChange={(e) => setSearchTermHistory(e.target.value)}
                  icon={<TrendingUp size={16} />}
                  size="sm"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loadingHistory ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Carregando auditoria...</div>
                ) : history.length > 0 ? (
                  history
                    .filter(a => {
                      const cli = clientes.find(c => c.id === a.cliente_id);
                      const servs = servicos.filter(s => (a.servicos_ids || [a.servico_id]).includes(s.id));
                      const term = searchTermHistory.toLowerCase();
                      return cli?.nome.toLowerCase().includes(term) || 
                             servs.some(s => s.nome.toLowerCase().includes(term));
                    })
                    .sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime())
                    .map(a => {
                      const servs = servicos.filter(s => (a.servicos_ids || [a.servico_id]).includes(s.id));
                      const cli = clientes.find(c => c.id === a.cliente_id);
                      const comissaoPercent = barbeiroParaEditar.comissao_percentual || 40;
                      
                      return (
                        <div key={a.id} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-service-light)', color: 'var(--color-service)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {cli?.imagem_url ? (
                              <img src={cli.imagem_url} alt={cli.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <CheckCircle size={18} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {servs.length > 0 ? servs.map(s => s.nome).join(' + ') : 'Serviço'}
                              </span>
                              <span style={{ fontWeight: 800, color: 'var(--text-primary)', marginLeft: '0.5rem' }}>R$ {a.preco?.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              <span>{cli?.nome || 'Cliente'} • {new Date(a.data_agendamento).toLocaleDateString('pt-BR')}</span>
                              <span style={{ color: 'var(--color-barber)', fontWeight: 600 }}>+ R$ {(a.preco * comissaoPercent / 100).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                    <TrendingUp size={40} style={{ margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>Nenhum histórico financeiro encontrado.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
        <ImageUpload 
          label="Foto do Barbeiro"
          value={formData.imagem_url}
          onChange={(base64) => setFormData({ ...formData, imagem_url: base64 })}
          helperText="Foto quadrada recomendada."
        />
        <Input
          label="Nome do Barbeiro"
          type="text"
          icon={<User size={18} />}
          placeholder="Nome completo"
          required
          maxLength={100}
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          autoFocus
        />

        <div>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block' }}>
            Especialidades do Profissional
          </label>
          <div className={drawerStyles.checkboxGrid}>
            {SPECIALTIES.map(spec => (
              <label key={spec.value} className={drawerStyles.customCheckbox}>
                <input
                  type="checkbox"
                  checked={formData.especialidades.includes(spec.value)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      especialidades: checked 
                        ? [...prev.especialidades, spec.value] 
                        : prev.especialidades.filter(v => v !== spec.value)
                    }));
                  }}
                />
                <span>{spec.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={drawerStyles.drawerGrid}>
          <Input
            label="Telefone"
            mask="phone"
            type="tel"
            icon={<Phone size={18} />}
            placeholder="(00) 00000-0000"
            required
            maxLength={15}
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />
          <Input
            label="E-mail"
            type="email"
            icon={<Mail size={18} />}
            placeholder="email@barbearia.com"
            required
            maxLength={100}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        {!barbeiroParaEditar && (
          <Input
            label="Senha Provisória"
            type="password"
            icon={<Lock size={18} />}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            maxLength={20}
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
          />
        )}

        {/* Seleção de Serviços Múltiplos Customizada */}
        <div>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block' }}>
            Serviços Realizados
          </label>
          <div className={drawerStyles.checkboxGrid}>
            {servicos.length > 0 ? servicos.map(servico => (
              <label key={servico.id} className={drawerStyles.customCheckbox}>
                <input
                  type="checkbox"
                  checked={formData.servicos_ids.includes(servico.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      servicos_ids: checked 
                        ? [...prev.servicos_ids, servico.id] 
                        : prev.servicos_ids.filter(id => id !== servico.id)
                    }));
                  }}
                />
                <span>{servico.nome}</span>
              </label>
            )) : (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Nenhum serviço disponível.</span>
            )}
          </div>
        </div>

        {/* Toggle de Disponibilidade */}
        <div>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
            Disponibilidade
          </label>
          <button
            type="button"
            className={`${drawerStyles.statusToggle} ${formData.ativo ? drawerStyles.active : drawerStyles.inactive}`}
            onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
          >
            {formData.ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            <span>{formData.ativo ? 'Ativo — Trabalhando' : 'Inativo — Afastado'}</span>
          </button>
        </div>

        {/* Justificativa (só aparece ou habilita se inativo) */}
        {!formData.ativo && (
          <Input
            as="textarea"
            label="Justificativa da Inatividade"
            placeholder="Descreva o motivo do afastamento..."
            rows={3}
            value={formData.justificativa}
            onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
            required={!formData.ativo}
          />
        )}
      </form>
      )}
    </Drawer>
  );
};

export default BarberDrawer;
