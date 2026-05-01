import React, { useState, useEffect } from 'react';
import { createAgendamento, updateAgendamento } from '../../../api/appointments';
import type { Cliente, Servico, Agendamento, Barbeiro } from '../../../types';
import { User, ShoppingBag, Calendar, FileText, Plus, Edit2, Scissors, Clock, AlertTriangle, Info, History, DollarSign, Ban } from 'lucide-react';
import Swal from 'sweetalert2';
import { Drawer } from '../../../components/ui/Drawer';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import drawerStyles from '../../../components/ui/Drawer.module.css';
import { getSpecialtyLabel } from '../constants/specialties';

import TimeSlotPicker from '../../../components/ui/TimeSlotPicker';
import { notifyDebt, notifyNewAppointment } from '../../../utils/notifications';

interface AppointmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientes: Cliente[];
  servicos: Servico[];
  barbeiros: Barbeiro[];
  allAgendamentos: Agendamento[];
  agendamentoParaEditar?: Agendamento | null;
}

const AppointmentDrawer: React.FC<AppointmentDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientes,
  servicos,
  barbeiros,
  allAgendamentos,
  agendamentoParaEditar
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    cliente_id: '',
    servicos_ids: [] as number[],
    barbeiro_id: '',
    selectedDate: '',
    selectedSlot: '',
    customTime: '',
    observacoes: ''
  });
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isTogglingPago, setIsTogglingPago] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (agendamentoParaEditar) {
        const fullDate = agendamentoParaEditar.data_agendamento || '';
        const datePart = fullDate.split('T')[0] || '';
        const timePart = fullDate.split('T')[1]?.slice(0, 5) || '';
        
        setFormData({
          cliente_id: String(agendamentoParaEditar.cliente_id),
          servicos_ids: agendamentoParaEditar.servicos_ids || [],
          barbeiro_id: String(agendamentoParaEditar.barbeiro_id),
          selectedDate: datePart,
          selectedSlot: timePart,
          customTime: timePart,
          observacoes: agendamentoParaEditar.observacoes || ''
        });
        setUseCustomTime(false);
        setMode('view');
      } else {
        setFormData({ 
          cliente_id: '', 
          servicos_ids: [], 
          barbeiro_id: '', 
          selectedDate: new Date().toISOString().split('T')[0], 
          selectedSlot: '', 
          customTime: '',
          observacoes: '' 
        });
        setUseCustomTime(false);
        setMode('edit');
      }
    }
  }, [isOpen, agendamentoParaEditar]);

  // # Gabriel (Admin) - Toggle Pagamento (Atribuir/Remover Inadimplência)
  const handleTogglePago = async () => {
    if (!agendamentoParaEditar) return;
    const isPago = agendamentoParaEditar.pago;
    
    const result = await Swal.fire({
      title: isPago ? 'Reverter Pagamento?' : 'Confirmar Pagamento?',
      html: `
        <div style="text-align: left; font-size: 0.9rem; opacity: 0.85; line-height: 1.6;">
          <p>${isPago 
            ? 'Ao reverter, este agendamento será marcado como <strong style="color: #ef4444">não pago</strong> e o valor será adicionado à dívida do cliente.'
            : 'Ao confirmar, este agendamento será marcado como <strong style="color: #10b981">pago</strong> e o valor será removido da dívida do cliente.'
          }</p>
          <div style="background: rgba(255,255,255,0.04); padding: 1rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.08); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-tertiary)">Cliente:</span>
              <strong style="color: var(--text-primary)">${selectedClient?.nome || 'N/A'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.5rem; margin-top: 0.5rem;">
              <span style="color: var(--text-tertiary)">Valor:</span>
              <strong style="color: ${isPago ? '#ef4444' : '#10b981'}">R$ ${agendamentoParaEditar.preco?.toLocaleString() || '0'}</strong>
            </div>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: isPago ? 'Sim, Reverter' : 'Sim, Confirmar',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-glass-title',
        htmlContainer: 'swal-glass-html',
        confirmButton: `btn btn-md btn-primary ${isPago ? 'theme-purple' : 'theme-green'}`,
        cancelButton: 'btn btn-md btn-secondary'
      }
    });

    if (result.isConfirmed) {
      setIsTogglingPago(true);
      try {
        const ok = await updateAgendamento(agendamentoParaEditar.id, { pago: !isPago });
        if (ok) {
          showToast(
            isPago ? 'Pagamento revertido. Inadimplência atribuída.' : 'Pagamento confirmado com sucesso!',
            isPago ? 'warning' : 'success'
          );
          
          if (isPago) {
            notifyDebt(selectedClient?.nome || 'Cliente', agendamentoParaEditar.preco || 0);
          }
          onSuccess();
          onClose();
        } else {
          showToast('Erro ao atualizar status de pagamento.', 'error');
        }
      } catch {
        showToast('Erro ao processar solicitação.', 'error');
      } finally {
        setIsTogglingPago(false);
      }
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!agendamentoParaEditar) return;
    
    const result = await Swal.fire({
      title: 'Alterar Status?',
      text: `Deseja marcar este agendamento como ${newStatus.toUpperCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Voltar',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-glass-title',
        htmlContainer: 'swal-glass-html',
        confirmButton: 'btn btn-md btn-primary theme-purple',
        cancelButton: 'btn btn-md btn-secondary'
      }
    });

    if (result.isConfirmed) {
      setIsUpdatingStatus(true);
      try {
        const payload: Partial<Agendamento> = { status: newStatus };
        // Se for concluído, podemos sugerir marcar como pago também, mas vamos manter separado por enquanto
        const ok = await updateAgendamento(agendamentoParaEditar.id, payload);
        if (ok) {
          showToast(`Status atualizado para ${newStatus}!`, 'success');
          onSuccess();
          onClose();
        } else {
          showToast('Erro ao atualizar status.', 'error');
        }
      } catch {
        showToast('Erro técnico ao processar status.', 'error');
      } finally {
        setIsUpdatingStatus(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const timeToUse = useCustomTime ? formData.customTime : formData.selectedSlot;
    const finalData = `${formData.selectedDate}T${timeToUse}:00`;

    if (!agendamentoParaEditar && new Date(finalData) < new Date()) {
      showToast("Não é possível agendar horários no passado.", 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedServices = servicos.filter(s => formData.servicos_ids.includes(s.id));
      const totalPreco = selectedServices.reduce((sum, s) => sum + s.preco, 0);

      const payload = {
        cliente_id: parseInt(formData.cliente_id),
        servicos_ids: formData.servicos_ids,
        barbeiro_id: parseInt(formData.barbeiro_id),
        data_agendamento: finalData,
        observacoes: formData.observacoes,
        preco: totalPreco
      };

      if (!payload.cliente_id || payload.servicos_ids.length === 0 || !payload.barbeiro_id || !timeToUse) {
        throw "Preencha todos os campos obrigatórios.";
      }

        if (agendamentoParaEditar) {
          const ok = await updateAgendamento(agendamentoParaEditar.id, payload);
          if (!ok) throw "Erro ao atualizar agendamento.";
          showToast('Agendamento atualizado com sucesso!', 'success');
        } else {
          await createAgendamento(payload as any);
          showToast('Horário reservado com sucesso!', 'success');
          notifyNewAppointment(selectedClient?.nome || 'Novo Cliente', timeToUse);
        }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err || 'Erro ao processar agendamento.';
      showToast(String(msg), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auxiliares para o View Mode
  const selectedClient = clientes.find(c => String(c.id) === formData.cliente_id);
  const selectedServices = servicos.filter(s => formData.servicos_ids.includes(s.id));
  const selectedBarber = barbeiros.find(b => b.id && String(b.id) === formData.barbeiro_id);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'view' ? 'Detalhes do Agendamento' : (agendamentoParaEditar ? "Editar Horário" : "Novo Agendamento")}
      subtitle={mode === 'view' ? 'Resumo da reserva' : (agendamentoParaEditar ? 'Atualize os dados da reserva.' : 'Preencha os campos para reservar um horário.')}
      icon={<Calendar size={20} color="var(--color-appointment)" />}
      iconBg="var(--color-appointment-light)"
      iconBorder="var(--color-appointment-border)"
      footer={
        mode === 'view' ? (
          <>
            <Button
              theme="purple"
              onClick={() => setMode('edit')}
              icon={<Edit2 size={18} />}
            >
              Editar Agendamento
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </>
        ) : (
          <>
            <Button
              theme="purple"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={mode === 'edit' && !!selectedClient && (selectedClient.divida_total || 0) > 0}
              icon={agendamentoParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
            >
              {agendamentoParaEditar ? 'Salvar Alterações' : 'Confirmar Reserva'}
            </Button>
            <Button variant="ghost" onClick={() => agendamentoParaEditar ? setMode('view') : onClose()} disabled={isSubmitting}>
              Cancelar
            </Button>
          </>
        )
      }
    >
      {mode === 'view' && agendamentoParaEditar ? (
        <div className={drawerStyles.bentoGrid}>
          {/* 1. Card Hero: Cliente (Largura Total) */}
          <div className={`${drawerStyles.bentoCard} ${drawerStyles.bentoHeaderGroup} ${drawerStyles.span2}`}>
            <div className={drawerStyles.photoCard} style={{ padding: '0.5rem' }}>
              {selectedClient?.imagem_url ? (
                <img 
                  src={selectedClient.imagem_url} 
                  alt={selectedClient.nome} 
                  className={drawerStyles.heroAvatar}
                  style={{ width: '80px', height: '80px', borderRadius: '1.5rem' }}
                />
              ) : (
                <div className={drawerStyles.heroAvatar} style={{ 
                  width: '80px', height: '80px', borderRadius: '1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-client-light)', color: 'var(--color-client)',
                  fontSize: '1.75rem', fontWeight: '800'
                }}>
                  {selectedClient?.nome.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="badge badge-blue badge-corner">ID #{selectedClient?.id}</span>
              <span className={drawerStyles.subcardLabel}>Cliente</span>
              <h2 style={{ fontSize: '1.15rem' }}>{selectedClient?.nome || 'N/A'}</h2>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{selectedClient?.email}</p>
            </div>
          </div>

          {/* 2. Layout Masonry: Data/Hora e Status (Lado a Lado) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Coluna Esquerda: Horário e Status Stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Card de Horário */}
              <div className={drawerStyles.bentoCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', position: 'relative', padding: '1.25rem' }}>
                <span className="badge badge-purple badge-corner">ID #{agendamentoParaEditar.id}</span>
                <span className={drawerStyles.subcardLabel}>Horário</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-purple)', fontWeight: 800, fontSize: '1.1rem' }}>
                  <Clock size={18} />
                  {new Date(agendamentoParaEditar.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {new Date(agendamentoParaEditar.data_agendamento).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Card de Status */}
              <div className={drawerStyles.bentoCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', padding: '1.25rem' }}>
                <span className={drawerStyles.subcardLabel}>Status Atual</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="pill" style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.65rem', 
                    background: agendamentoParaEditar.status === 'concluido' 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : agendamentoParaEditar.status === 'cancelado' 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : 'rgba(168, 85, 247, 0.1)', 
                    color: agendamentoParaEditar.status === 'concluido' 
                      ? '#10b981' 
                      : agendamentoParaEditar.status === 'cancelado' 
                        ? '#ef4444' 
                        : '#a855f7',
                    border: `1px solid ${agendamentoParaEditar.status === 'concluido' 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : agendamentoParaEditar.status === 'cancelado' 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : 'rgba(168, 85, 247, 0.2)'}`,
                    textTransform: 'uppercase', width: 'fit-content',
                    fontWeight: 800
                  }}>
                    {agendamentoParaEditar.status || 'Pendente'}
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: AÇÕES DE STATUS ═══ */}
            <div className={drawerStyles.bentoCard} style={{ background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
              <span className={drawerStyles.subcardLabel} style={{ marginBottom: '1rem', display: 'block' }}>Ações de Fluxo</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
                {agendamentoParaEditar.status !== 'concluido' && (
                  <Button 
                    size="md" 
                    theme="green" 
                    icon={<DollarSign size={18} />} 
                    onClick={() => handleUpdateStatus('concluido')}
                    disabled={isUpdatingStatus}
                    style={{ width: '100%' }}
                  >
                    Concluir
                  </Button>
                )}
                
                {agendamentoParaEditar.status !== 'cancelado' && (
                  <Button 
                    size="md" 
                    theme="red" 
                    variant="secondary"
                    icon={<Ban size={18} />} 
                    onClick={() => handleUpdateStatus('cancelado')}
                    disabled={isUpdatingStatus}
                    style={{ width: '100%' }}
                  >
                    Cancelar
                  </Button>
                )}

                {(agendamentoParaEditar.status === 'concluido' || agendamentoParaEditar.status === 'cancelado') && (
                  <Button 
                    size="md" 
                    theme="purple" 
                    icon={<Clock size={18} />} 
                    onClick={() => handleUpdateStatus('pendente')}
                    disabled={isUpdatingStatus}
                    style={{ width: '100%' }}
                  >
                    Reabrir
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Card de Pagamento (Toggle Inadimplência) */}
          {agendamentoParaEditar.status === 'concluido' && (
            <div 
              className={drawerStyles.bentoCard} 
              onClick={handleTogglePago}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', 
                cursor: isTogglingPago ? 'wait' : 'pointer',
                opacity: isTogglingPago ? 0.6 : 1,
                transition: 'all 0.3s ease',
                background: agendamentoParaEditar.pago 
                  ? 'rgba(16, 185, 129, 0.04)' 
                  : 'rgba(239, 68, 68, 0.04)',
                border: `1px solid ${agendamentoParaEditar.pago 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : 'rgba(239, 68, 68, 0.15)'}`,
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: agendamentoParaEditar.pago 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                color: agendamentoParaEditar.pago ? '#10b981' : '#ef4444',
                flexShrink: 0
              }}>
                {agendamentoParaEditar.pago ? <DollarSign size={20} /> : <Ban size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <span className={drawerStyles.subcardLabel}>Pagamento</span>
                <div style={{ 
                  fontWeight: 700, fontSize: '0.9rem',
                  color: agendamentoParaEditar.pago ? '#10b981' : '#ef4444'
                }}>
                  {agendamentoParaEditar.pago ? 'Pago' : 'Inadimplente'}
                </div>
              </div>
              <div style={{ 
                fontSize: '0.65rem', fontWeight: 700, 
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {agendamentoParaEditar.pago ? 'Reverter ›' : 'Liquidar ›'}
              </div>
            </div>
          )}

          {/* 3. Alertas e Notas (Dinâmicos) */}
          {(selectedBarber && !selectedBarber.ativo || agendamentoParaEditar.observacoes) && (
            <div className={drawerStyles.bentoGrid}>
              {selectedBarber && !selectedBarber.ativo && (
                <div className={drawerStyles.cardAlert}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={18} color="#f87171" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
                      Aviso de Inatividade
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    O profissional <strong>{selectedBarber.nome}</strong> está inativo ou afastado no momento.
                  </p>
                </div>
              )}

              {agendamentoParaEditar.observacoes && (
                <div className={drawerStyles.bentoCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Info size={18} color="var(--text-tertiary)" />
                    <span className={drawerStyles.subcardLabel}>Observações</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    {agendamentoParaEditar.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. Cards de Detalhes */}
          <div className={drawerStyles.bentoGrid}>
            {/* Card de Serviços (Lista Premium) */}
            <div className={drawerStyles.bentoCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShoppingBag size={18} color="var(--color-service)" />
                <span className={drawerStyles.subcardLabel}>Serviços Selecionados</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedServices.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '0.75rem', background: 'var(--color-service-light)', color: 'var(--color-service)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                        <Scissors size={14} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.nome}</span>
                          <span className="badge badge-green">#{s.id}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{s.duracao_minutos} min</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      R$ {Number(s.preco).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Total</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4ade80' }}>
                  R$ {selectedServices.reduce((sum, s) => sum + s.preco, 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Card de Barbeiro (Hierarquia Refatorada) */}
            <div className={drawerStyles.bentoCard} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {selectedBarber?.imagem_url ? (
                  <img src={selectedBarber.imagem_url} className={drawerStyles.heroAvatar} style={{ width: '58px', height: '58px', borderRadius: '1rem' }} />
                ) : (
                  <div style={{ padding: '0.75rem', borderRadius: '1rem', background: 'var(--color-barber-light)', color: 'var(--color-barber)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Scissors size={25} />
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={drawerStyles.subcardLabel}>Profissional</span>
                    <span className="badge badge-amber">#{selectedBarber?.id}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {selectedBarber?.nome || 'Não selecionado'}
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', color: 'var(--text-tertiary)', 
                    display: 'flex', flexWrap: 'wrap', gap: '0.25rem' 
                  }}>
                    {selectedBarber?.especialidades?.map(e => (
                      <span key={e} className="pill" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem' }}>
                        {getSpecialtyLabel(e)}
                      </span>
                    ))}
                  </div>
                </div>
            </div>
          </div>

          {/* 5. System Info (Auditoria) */}
          <div className={drawerStyles.bentoGrid} style={{ marginTop: '0.5rem' }}>
            <div className={drawerStyles.bentoCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={16} color="var(--text-tertiary)" />
                <span className={drawerStyles.subcardLabel}>Informações do Sistema</span>
              </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Cadastrado em:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {agendamentoParaEditar.data_criacao 
                  ? new Date(agendamentoParaEditar.data_criacao).toLocaleString('pt-BR') 
                  : 'Não disponível'}
              </span>
            </div>
            {agendamentoParaEditar.data_atualizacao && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Atualizado em:</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {new Date(agendamentoParaEditar.data_atualizacao).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
          {/* # Gabriel (Finanças) - Banner de Bloqueio para Inadimplentes*/}
          {selectedClient && (selectedClient.divida_total || 0) > 0 && (
            <div className={drawerStyles.bentoCard} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', marginBottom: '1.5rem', animation: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bloqueio de Inadimplência</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ef4444' }}>R$ {selectedClient.divida_total?.toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    Este cliente possui débitos pendentes. Novos agendamentos estão temporariamente bloqueados.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <Input
              label="Cliente"
              as="select"
              icon={<User size={18} />}
              required
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
            >
              <option value="">Selecione um cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} (#{c.id})</option>)}
            </Input>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block' }}>
              Serviços
            </label>
            <div className={drawerStyles.checkboxGrid} style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {servicos.map(s => (
                <label key={s.id} className={drawerStyles.customCheckbox}>
                  <input 
                    type="checkbox" 
                    checked={formData.servicos_ids.includes(s.id)} 
                    onChange={(e) => {
                      const ids = e.target.checked 
                        ? [...formData.servicos_ids, s.id] 
                        : formData.servicos_ids.filter(id => id !== s.id);
                      setFormData({ ...formData, servicos_ids: ids });
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.nome}</div>
                      <span className="badge badge-green">#{s.id}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      R$ {Number(s.preco).toFixed(2)} • {s.duracao_minutos} min
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <Input
              label="Profissional"
              as="select"
              icon={<Scissors size={18} />}
              required
              value={formData.barbeiro_id}
              onChange={(e) => setFormData({ ...formData, barbeiro_id: e.target.value })}
            >
              <option value="">Selecione um profissional...</option>
              {barbeiros
                .filter(b => b.ativo && (formData.servicos_ids.length === 0 || formData.servicos_ids.every(id => b.servicos_ids?.includes(id))))
                .map(b => <option key={b.id} value={b.id}>{b.nome} (#{b.id})</option>)}
            </Input>
          </div>

          <div className="form-group">
            <Input
              label="Data do Agendamento"
              type="date"
              icon={<Calendar size={18} />}
              required
              min={new Date().toISOString().split('T')[0]}
              value={formData.selectedDate}
              onChange={(e) => setFormData({ ...formData, selectedDate: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Horário
              </label>
              <button 
                type="button" 
                onClick={() => setUseCustomTime(!useCustomTime)}
                style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--color-purple)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {useCustomTime ? 'Usar slots sugeridos' : 'Definir horário manual'}
              </button>
            </div>

            {useCustomTime ? (
              <Input
                type="time"
                icon={<Clock size={18} />}
                required
                value={formData.customTime}
                onChange={(e) => setFormData({ ...formData, customTime: e.target.value })}
              />
            ) : (
              <TimeSlotPicker
                date={formData.selectedDate}
                barbeiroId={parseInt(formData.barbeiro_id)}
                servicoDuracao={servicos.filter(s => formData.servicos_ids.includes(s.id)).reduce((sum, s) => sum + s.duracao_minutos, 0) || 30}
                agendamentos={allAgendamentos}
                selectedSlot={formData.selectedSlot}
                onSlotSelect={(slot) => setFormData({ ...formData, selectedSlot: slot })}
                theme="purple"
              />
            )}
          </div>

          <div className="form-group">
            <Input
              label="Observações (Opcional)"
              as="textarea"
              icon={<FileText size={18} />}
              rows={3}
              maxLength={250}
              placeholder="Ex: Cabelo muito comprido, lavagem especial..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
        </form>
      )}
    </Drawer>
  );
};

export default AppointmentDrawer;
