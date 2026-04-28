// ClientDrawer — Drawer de criação/edição de clientes
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createCliente, updateCliente } from '../../../api/clients';
import type { Cliente } from '../../../types';
import { User, Phone, Mail, Plus, Edit2, Lock, Users, History } from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import Input, { cleanPhone } from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import ImageUpload from '../../../components/ui/ImageUpload';
import drawerStyles from '../../../components/ui/Drawer.module.css';
import { getAgendamentos, updateAgendamento } from '../../../api/appointments';
import { getBarbeiros } from '../../../api/barbers';
import { getServicos } from '../../../api/services';
import type { Agendamento, Barbeiro, Servico } from '../../../types';
import { DollarSign, CheckCircle, Undo2 } from 'lucide-react';
import { notifyDebt } from '../../../utils/notifications';

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteParaEditar?: Cliente | null;
}

const ClientDrawer: React.FC<ClientDrawerProps> = ({ isOpen, onClose, onSuccess, clienteParaEditar }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', senha: '', observacoes: '', imagem_url: '' });
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [activeTab, setActiveTab] = useState<'dados' | 'financeiro'>('dados');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<Agendamento[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (clienteParaEditar) {
        setFormData({
          nome: clienteParaEditar.nome,
          email: clienteParaEditar.email,
          telefone: clienteParaEditar.telefone,
          senha: '',
          observacoes: clienteParaEditar.observacoes || '',
          imagem_url: clienteParaEditar.imagem_url || ''
        });
        setMode('view');
        setActiveTab('dados');
        fetchFinancialHistory();
      } else {
        setFormData({ nome: '', email: '', telefone: '', senha: '', observacoes: '', imagem_url: '' });
        setMode('edit');
        setActiveTab('dados');
      }
    }
  }, [isOpen, clienteParaEditar]);

  const fetchFinancialHistory = async () => {
    if (!clienteParaEditar) return;
    try {
      const [agends, barbs, servs] = await Promise.all([
        getAgendamentos(1, 100),
        getBarbeiros(1, 100),
        getServicos(1, 100)
      ]);
      setHistory(agends.items.filter(a => a.cliente_id === clienteParaEditar.id));
      setBarbeiros(barbs.items);
      setServicos(servs.items);
    } catch (e) {
      console.error("Erro ao carregar histórico financeiro", e);
    } finally {
    }
  };

  const handleLiquidarItem = async (agendamentoId: number, preco: number = 0, servicoNome: string = 'Serviço', barbeiroNome: string = 'Barbeiro') => {
    const Swal = (await import('sweetalert2')).default;
    
    const result = await Swal.fire({
      title: 'Confirmar Pagamento?',
      html: `
        <div style="text-align: left; font-size: 0.9rem; opacity: 0.8; line-height: 1.5;">
          <p>Você confirma o recebimento do valor para o serviço abaixo?</p>
          <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Serviço:</span>
              <strong style="color: var(--text-primary)">${servicoNome}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Profissional:</span>
              <strong style="color: var(--text-primary)">${barbeiroNome}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; border-top: 1px solid rgba(255,255,255,0.1); pt-0.5rem; margin-top: 0.5rem;">
              <span>Valor:</span>
              <strong style="color: #059669">R$ ${preco.toLocaleString()}</strong>
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
      const ok = await updateAgendamento(agendamentoId, { pago: true });
      if (ok) {
        showToast("Pagamento registrado!", 'success');
        fetchFinancialHistory();
        onSuccess(); 
      }
    }
  };

  // # Gabriel (Admin) - Reverter Pagamento (Atribuir Inadimplência)
  const handleReverterPagamento = async (agendamentoId: number, preco: number = 0, servicoNome: string = 'Serviço', barbeiroNome: string = 'Barbeiro') => {
    const Swal = (await import('sweetalert2')).default;
    
    const result = await Swal.fire({
      title: 'Reverter Pagamento?',
      html: `
        <div style="text-align: left; font-size: 0.9rem; opacity: 0.85; line-height: 1.6;">
          <p>O agendamento será marcado como <strong style="color: #ef4444">não pago</strong> e o valor será adicionado à dívida do cliente.</p>
          <div style="background: rgba(255,255,255,0.04); padding: 1rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.08); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-tertiary)">Serviço:</span>
              <strong style="color: var(--text-primary)">${servicoNome}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-tertiary)">Profissional:</span>
              <strong style="color: var(--text-primary)">${barbeiroNome}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.5rem; margin-top: 0.5rem;">
              <span>Valor a reverter:</span>
              <strong style="color: #ef4444">R$ ${preco.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, Reverter',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      customClass: { 
        popup: 'swal-glass-popup', 
        title: 'swal-glass-title', 
        htmlContainer: 'swal-glass-html',
        confirmButton: 'btn btn-md btn-danger',
        cancelButton: 'btn btn-md btn-secondary'
      }
    });

    if (result.isConfirmed) {
      const ok = await updateAgendamento(agendamentoId, { pago: false });
      if (ok) {
        showToast('Pagamento revertido. Inadimplência atribuída.', 'warning');
        notifyDebt(clienteParaEditar?.nome || 'Cliente', preco);
        fetchFinancialHistory();
        onSuccess();
      } else {
        showToast('Erro ao reverter pagamento.', 'error');
      }
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.telefone.replace(/\D/g, "").length < 10) {
      showToast("Insira um telefone válido com DDD.", 'error');
      return;
    }
    if (!isValidEmail(formData.email)) {
      showToast("Insira um e-mail válido.", 'error');
      return;
    }
    if (!clienteParaEditar && !formData.senha) {
      showToast("A senha é obrigatória para cadastro.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (clienteParaEditar) {
        const { senha, ...updateData } = formData;
        const payload = { ...updateData, telefone: cleanPhone(formData.telefone) };
        const success = await updateCliente(clienteParaEditar.id!, payload);
        if (!success) throw new Error("Erro ao atualizar cliente.");
        showToast('Cliente atualizado com sucesso!', 'success');
      } else {
        const payload = { ...formData, telefone: cleanPhone(formData.telefone) };
        await createCliente(payload);
        showToast('Cliente cadastrado com sucesso!', 'success');
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
      title={mode === 'view' ? clienteParaEditar?.nome || "Detalhes" : (clienteParaEditar ? "Editar Cliente" : "Novo Cliente")}
      subtitle={mode === 'view' ? "Cliente" : (clienteParaEditar ? "Atualize os dados do cliente." : "Cadastre um novo cliente.")}
      icon={<Users size={20} color="var(--color-client)" />}
      iconBg="var(--color-client-light)"
      iconBorder="var(--color-client-border)"
      footer={
        mode === 'view' ? (
          <>
            <Button
              theme="blue"
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
              theme="blue"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              icon={clienteParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
            >
              {clienteParaEditar ? "Salvar Alterações" : "Cadastrar Cliente"}
            </Button>
            <Button variant="ghost" onClick={() => clienteParaEditar ? setMode('view') : onClose()} disabled={isSubmitting}>
              Cancelar
            </Button>
          </>
        )
      }
    >
      {mode === 'view' && clienteParaEditar && (
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
            {(clienteParaEditar.divida_total || 0) > 0 && (
              <span className={drawerStyles.tabBadge}>!</span>
            )}
          </button>
        </div>
      )}

      {mode === 'view' && clienteParaEditar ? (
        activeTab === 'dados' ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className={drawerStyles.bentoGrid}
        >
          {/* Header Group: Foto e Nome Lado a Lado */}
          <div className={drawerStyles.bentoHeaderGroup}>
            {/* Card da Foto (Iniciais ou Imagem) */}
            <div className={`${drawerStyles.bentoCard} ${drawerStyles.photoCard}`} style={{ padding: '1rem' }}>
              {clienteParaEditar.imagem_url ? (
                <img 
                  src={clienteParaEditar.imagem_url} 
                  alt={clienteParaEditar.nome} 
                  className={drawerStyles.heroAvatar}
                  style={{ width: '100px', height: '100px' }}
                />
              ) : (
                <div className={drawerStyles.heroAvatar} style={{ 
                  width: '100px', height: '100px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-client-light)', color: 'var(--color-client)',
                  fontSize: '2.5rem', fontWeight: '800'
                }}>
                  {clienteParaEditar.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Card do Nome com Badge de Cliente */}
            <div className={`${drawerStyles.bentoCard} ${drawerStyles.nameCard}`} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
              <span className="badge badge-blue badge-corner">ID #{clienteParaEditar.id}</span>
              <span className={drawerStyles.subcardLabel}>Nome do Cliente</span>
              <h2 style={{ fontSize: '1.25rem' }}>{clienteParaEditar.nome}</h2>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: '500' }}>
                Fiel à BarbaByte
              </p>
            </div>
          </div>

          {/* Sessão de Contato Bento */}
          <div className={drawerStyles.bentoCard}>
            <span className={drawerStyles.subcardLabel} style={{ marginBottom: '1rem', display: 'block' }}>Informações de Contato</span>
            <div className={drawerStyles.bentoContactGroup}>
              <div className={drawerStyles.bentoSubcard}>
                <span className={drawerStyles.subcardLabel}>E-mail</span>
                <span className={drawerStyles.subcardValue}>{clienteParaEditar.email}</span>
              </div>
              <div className={drawerStyles.bentoSubcard}>
                <span className={drawerStyles.subcardLabel}>Telefone</span>
                <span className={drawerStyles.subcardValue}>{clienteParaEditar.telefone}</span>
              </div>
            </div>
          </div>

          {/* Observações Section Bento */}
          {clienteParaEditar.observacoes && (
            <div className={drawerStyles.bentoCard}>
              <span className={drawerStyles.subcardLabel} style={{ marginBottom: '0.75rem', display: 'block' }}>Observações Internas</span>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {clienteParaEditar.observacoes}
              </p>
            </div>
          )}

          {/* Seção de Auditoria */}
          <div className={drawerStyles.bentoCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} color="var(--text-tertiary)" />
              <span className={drawerStyles.subcardLabel}>Informações do Sistema</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Cadastrado em:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {clienteParaEditar.data_cadastro 
                  ? new Date(clienteParaEditar.data_cadastro).toLocaleString('pt-BR') 
                  : 'Não disponível'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Atualizado em:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {clienteParaEditar.data_atualizacao 
                  ? new Date(clienteParaEditar.data_atualizacao).toLocaleString('pt-BR') 
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
            {/* KPI de Dívida Total */}
            <div className={`${drawerStyles.bentoCard} ${(clienteParaEditar.divida_total || 0) > 0 ? drawerStyles.cardAlert : ''}`} style={{ background: (clienteParaEditar.divida_total || 0) > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(5, 150, 105, 0.05)', border: (clienteParaEditar.divida_total || 0) > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(5, 150, 105, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className={drawerStyles.subcardLabel}>Saldo Devedor</span>
                  <h2 style={{ fontSize: '1.5rem', color: (clienteParaEditar.divida_total || 0) > 0 ? '#ef4444' : '#059669', margin: '0.25rem 0' }}>
                    R$ {(clienteParaEditar.divida_total || 0).toLocaleString()}
                  </h2>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '1rem', background: (clienteParaEditar.divida_total || 0) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(5, 150, 105, 0.1)', color: (clienteParaEditar.divida_total || 0) > 0 ? '#ef4444' : '#059669' }}>
                  <DollarSign size={24} />
                </div>
              </div>
            </div>

            {/* Timeline de Dívidas */}
            <div className={drawerStyles.bentoCard}>
              <span className={drawerStyles.subcardLabel} style={{ marginBottom: '1.25rem', display: 'block' }}>Detalhamento de Pendências</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.filter(a => a.status === 'concluido' && !a.pago).length > 0 ? (
                  history.filter(a => a.status === 'concluido' && !a.pago).map(a => {
                    const serv = servicos.find(s => s.id === a.servico_id);
                    const barb = barbeiros.find(b => b.id === a.barbeiro_id);
                    return (
                      <div key={a.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '2px', height: '10px', background: 'var(--border-color)' }} />
                          {barb?.imagem_url ? (
                            <img src={barb.imagem_url} alt={barb.nome} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(239, 68, 68, 0.2)' }} />
                          ) : (
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', border: '3px solid rgba(239, 68, 68, 0.2)' }} />
                          )}
                          <div style={{ width: '2px', flex: 1, background: 'var(--border-color)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{serv?.nome || 'Serviço'}</span>
                            <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.9rem' }}>R$ {a.preco?.toLocaleString()}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {new Date(a.data_agendamento).toLocaleDateString('pt-BR')} • Profissional: {barb?.nome || 'N/A'}
                          </p>
                          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button size="sm" variant="ghost" icon={<CheckCircle size={14} />} onClick={() => handleLiquidarItem(a.id, a.preco, serv?.nome, barb?.nome)}>Liquidar Este</Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                    <CheckCircle size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.85rem' }}>Nenhum débito pendente para este cliente.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico Recente (Pagos) — com opção de reverter */}
            <div className={drawerStyles.bentoCard}>
               <span className={drawerStyles.subcardLabel} style={{ marginBottom: '1rem', display: 'block' }}>Últimos Serviços Pagos</span>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {history.filter(a => a.status === 'concluido' && a.pago).slice(0, 5).length > 0 ? (
                    history.filter(a => a.status === 'concluido' && a.pago).slice(0, 5).map(a => {
                      const serv = servicos.find(s => s.id === a.servico_id);
                      const barb = barbeiros.find(b => b.id === a.barbeiro_id);
                      return (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                               {barb?.imagem_url ? (
                                 <img src={barb.imagem_url} alt={barb.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                               ) : (
                                 <Scissors size={14} color="var(--text-tertiary)" />
                               )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{serv?.nome || 'Serviço'}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                              {new Date(a.data_agendamento).toLocaleDateString('pt-BR')} • R$ {a.preco?.toLocaleString() || '0'}
                            </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#059669' }}>Pago</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              icon={<Undo2 size={12} />} 
                              onClick={() => handleReverterPagamento(a.id, a.preco, serv?.nome, barb?.nome)}
                              style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', color: 'var(--text-tertiary)' }}
                            >
                              Reverter
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-tertiary)' }}>
                      <p style={{ fontSize: '0.8rem' }}>Nenhum serviço pago recentemente.</p>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
        <ImageUpload 
          label="Foto do Cliente"
          value={formData.imagem_url}
          onChange={(base64) => setFormData({ ...formData, imagem_url: base64 })}
          helperText="Foto quadrada recomendada."
        />
        <Input
          label="Nome Completo"
          type="text"
          icon={<User size={18} />}
          placeholder="Nome do cliente"
          required
          maxLength={100}
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          autoFocus
        />

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
            placeholder="cliente@email.com"
            required
            maxLength={100}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        {!clienteParaEditar && (
          <Input
            label="Senha"
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

        <Input
          as="textarea"
          label="Observações Internas"
          placeholder="Notas sobre o cliente (ex: restrições, preferências...)"
          rows={4}
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
        />
      </form>
      )}
    </Drawer>
  );
};

export default ClientDrawer;
