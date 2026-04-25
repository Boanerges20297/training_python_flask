import React, { useState, useEffect } from 'react';
import { createAgendamento, updateAgendamento } from '../../../api/appointments';
import type { Cliente, Servico, Agendamento, Barbeiro } from '../../../types';
import { User, ShoppingBag, Calendar, FileText, Plus, Edit2, Scissors, Clock } from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import drawerStyles from '../../../components/ui/Drawer.module.css';

interface AppointmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientes: Cliente[];
  servicos: Servico[];
  barbeiros: Barbeiro[];
  agendamentoParaEditar?: Agendamento | null;
}

const AppointmentDrawer: React.FC<AppointmentDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientes,
  servicos,
  barbeiros,
  agendamentoParaEditar
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    cliente_id: '',
    servico_id: '',
    barbeiro_id: '',
    data_agendamento: '',
    observacoes: ''
  });
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (agendamentoParaEditar) {
        const dataFormatada = agendamentoParaEditar.data_agendamento
          ? agendamentoParaEditar.data_agendamento.slice(0, 16)
          : '';
        setFormData({
          cliente_id: String(agendamentoParaEditar.cliente_id),
          servico_id: String(agendamentoParaEditar.servico_id),
          barbeiro_id: String(agendamentoParaEditar.barbeiro_id),
          data_agendamento: dataFormatada,
          observacoes: agendamentoParaEditar.observacoes || ''
        });
        setMode('view');
      } else {
        setFormData({ cliente_id: '', servico_id: '', barbeiro_id: '', data_agendamento: '', observacoes: '' });
        setMode('edit');
      }
    }
  }, [isOpen, agendamentoParaEditar]);

  const today = new Date().toISOString().slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agendamentoParaEditar && formData.data_agendamento < today) {
      showToast("Não é possível agendar horários no passado.", 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedDate = new Date(formData.data_agendamento);
      const hour = selectedDate.getHours();

      if (hour < 8 || hour >= 20) {
        throw "A barbearia funciona apenas das 08h às 20h.";
      }

      const payload = {
        cliente_id: parseInt(formData.cliente_id),
        servico_id: parseInt(formData.servico_id),
        barbeiro_id: parseInt(formData.barbeiro_id),
        data_agendamento: formData.data_agendamento,
        observacoes: formData.observacoes,
      };

      if (!payload.cliente_id || !payload.servico_id || !payload.barbeiro_id || !payload.data_agendamento) {
        throw "Preencha todos os campos obrigatórios.";
      }

      if (agendamentoParaEditar) {
        const ok = await updateAgendamento(agendamentoParaEditar.id, payload);
        if (!ok) throw "Erro ao atualizar agendamento.";
        showToast('Agendamento atualizado com sucesso!', 'success');
      } else {
        await createAgendamento(payload as any);
        showToast('Horário reservado com sucesso!', 'success');
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

  // Helpers para o View Mode
  const selectedClient = clientes.find(c => String(c.id) === formData.cliente_id);
  const selectedService = servicos.find(s => String(s.id) === formData.servico_id);
  const selectedBarber = barbeiros.find(b => String(b.id) === formData.barbeiro_id);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'view' ? 'Detalhes do Agendamento' : (agendamentoParaEditar ? "Editar Horário" : "Novo Agendamento")}
      subtitle={mode === 'view' ? 'Resumo da reserva' : (agendamentoParaEditar ? 'Atualize os dados da reserva.' : 'Preencha os campos para reservar um horário.')}
      icon={<Calendar size={20} color="var(--color-purple)" />}
      iconBg="var(--color-purple-light)"
      iconBorder="var(--color-purple-border)"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Cliente Hero */}
          <div className={drawerStyles.bentoProfile}>
            <div className={drawerStyles.bentoAvatar} style={{ background: 'var(--color-client-light)', color: 'var(--color-client)' }}>
              {selectedClient?.nome.charAt(0).toUpperCase() || '?'}
            </div>
            <div className={drawerStyles.bentoProfileText}>
              <h3>{selectedClient?.nome || 'Cliente não encontrado'}</h3>
              <p>{selectedClient?.email}</p>
            </div>
          </div>

          {/* Details Bento Grid */}
          <div className={drawerStyles.bentoMiniGrid}>
            <div className={drawerStyles.bentoMiniCard}>
              <p>Data e Hora</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-purple)', fontWeight: 700 }}>
                <Clock size={16} />
                {formData.data_agendamento.replace('T', ' ')}
              </div>
            </div>
            <div className={drawerStyles.bentoMiniCard}>
              <p>Serviço</p>
              <h2 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedService?.nome || 'N/A'}
              </h2>
            </div>
          </div>

          {/* Profissional Section */}
          <div className={drawerStyles.bentoSection}>
            <h4 className={drawerStyles.bentoSectionTitle}>Profissional Responsável</h4>
            <div className={drawerStyles.bentoRow}>
              <Scissors size={16} color="var(--color-amber)" />
              <span style={{ fontWeight: 600 }}>{selectedBarber?.nome || 'Barbeiro não selecionado'}</span>
            </div>
          </div>

          {/* Observações Section */}
          {formData.observacoes && (
            <div className={drawerStyles.bentoSection}>
              <h4 className={drawerStyles.bentoSectionTitle}>Observações</h4>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                {formData.observacoes}
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
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
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Input>
          </div>

          <div className="form-group">
            <Input
              label="Serviço"
              as="select"
              icon={<ShoppingBag size={18} />}
              required
              value={formData.servico_id}
              onChange={(e) => setFormData({ ...formData, servico_id: e.target.value })}
            >
              <option value="">Selecione um serviço...</option>
              {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {Number(s.preco).toFixed(2)}</option>)}
            </Input>
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
                .filter(b => b.ativo && (!formData.servico_id || b.servicos_ids?.includes(parseInt(formData.servico_id))))
                .map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </Input>
          </div>

          <div className="form-group">
            <Input
              label="Data e Horário"
              type="datetime-local"
              icon={<Calendar size={18} />}
              required
              min={agendamentoParaEditar ? undefined : today}
              max="2099-12-31T23:59"
              value={formData.data_agendamento}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, data_agendamento: e.target.value })}
            />
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
