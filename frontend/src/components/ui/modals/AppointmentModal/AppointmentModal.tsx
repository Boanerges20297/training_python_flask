import React, { useState, useEffect } from 'react';
import { createAgendamento, updateAgendamento } from '../../../../api/appointments';
import type { Cliente, Servico, Agendamento, Barbeiro } from '../../../../types';
import { User, ShoppingBag, Calendar, FileText, Plus, Edit2, Scissors } from 'lucide-react';
import Modal from '../../Modal';
import Input from '../../Input';
import Button from '../../Button';
import './AppointmentModal.css';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientes: Cliente[];
  servicos: Servico[];
  barbeiros: Barbeiro[];
  agendamentoParaEditar?: Agendamento | null;
}

// # Gabriel (Dev 1) - Refatorado para suportar criação e edição de agendamentos.
const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientes,
  servicos,
  barbeiros,
  agendamentoParaEditar
}) => {
  const [formData, setFormData] = useState({
    cliente_id: '',
    servico_id: '',
    barbeiro_id: '',
    data_agendamento: '',
    observacoes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (agendamentoParaEditar) {
        // Formata a data para o formato aceito pelo datetime-local
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
      } else {
        setFormData({ cliente_id: '', servico_id: '', barbeiro_id: '', data_agendamento: '', observacoes: '' });
      }
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, agendamentoParaEditar]);

  // # Gabriel (Dev 1) - Obtém a data e hora atual no formato ISO simplificado para o atributo 'min'
  const today = new Date().toISOString().slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // # Gabriel (Dev 1) - Reforçando regra aqui no front: Validação de data retroativa
    if (!agendamentoParaEditar && formData.data_agendamento < today) {
      setError("Não é possível agendar horários no passado.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

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
      } else {
        await createAgendamento(payload as any);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setFormData({ cliente_id: '', servico_id: '', barbeiro_id: '', data_agendamento: '', observacoes: '' });
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err || 'Erro ao processar agendamento.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agendamentoParaEditar ? "Editar Agendamento" : "Agendar Horário"}
      variant="purple"
      subtitle={agendamentoParaEditar ? 'Atualize os dados do agendamento.' : 'Escolha o cliente, o serviço e o horário.'}
      size="lg"
      feedback={success ? {
        type: 'success',
        title: agendamentoParaEditar ? 'Atualizado!' : 'Agendado!',
        message: agendamentoParaEditar ? 'Agendamento atualizado com sucesso.' : 'O horário foi reservado com sucesso.'
      } : null}
    >

      <div className="modal-body-content">
        <form onSubmit={handleSubmit} className="modern-form">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group-modern">
              <label>Cliente</label>
              <Input
                as="select"
                icon={<User size={18} />}
                required
                value={formData.cliente_id}
                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              >
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Input>
            </div>

            <div className="form-group-modern">
              <label>Serviço</label>
              <Input
                as="select"
                icon={<ShoppingBag size={18} />}
                required
                value={formData.servico_id}
                onChange={(e) => setFormData({ ...formData, servico_id: e.target.value })}
              >
                <option value="">Selecione...</option>
                {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {Number(s.preco).toFixed(2)}</option>)}
              </Input>
            </div>

            <div className="form-group-modern">
              <label>Profissional</label>
              <Input
                as="select"
                icon={<Scissors size={18} />}
                required
                value={formData.barbeiro_id}
                onChange={(e) => setFormData({ ...formData, barbeiro_id: e.target.value })}
              >
                <option value="">Selecione...</option>
                {barbeiros
                  .filter(b => b.ativo && (!formData.servico_id || b.servicos_ids?.includes(parseInt(formData.servico_id))))
                  .map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </Input>
            </div>
          </div>

          <div className="form-group-modern">
            <label>Data e Horário</label>
            <Input
              type="datetime-local"
              icon={<Calendar size={18} />}
              required
              min={agendamentoParaEditar ? undefined : today}
              max="2099-12-31T23:59"
              value={formData.data_agendamento}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, data_agendamento: e.target.value })}
            />
          </div>

          <div className="form-group-modern">
            <label>Observações (Opcional)</label>
            <Input
              as="textarea"
              icon={<FileText size={18} />}
              rows={3}
              maxLength={250}
              placeholder="Ex: Cabelo muito comprido, lavagem especial..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-footer-refined">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              theme="purple"
              size="md"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              icon={agendamentoParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
            >
              {agendamentoParaEditar ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AppointmentModal;
