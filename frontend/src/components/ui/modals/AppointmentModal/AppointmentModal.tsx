import React, { useState } from 'react';
import { createAgendamento } from '../../../../api/appointments';
import type { Cliente, Servico } from '../../../../types';
import { User, ShoppingBag, Calendar, FileText, Plus } from 'lucide-react';
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
}

// # Gabriel (Dev 1) - Refatorado para usar o Modal genérico com personalização Purple/Large.
const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientes,
  servicos
}) => {
  const [formData, setFormData] = useState({
    cliente_id: '',
    servico_id: '',
    data_agendamento: '',
    observacoes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // # Gabriel (Dev 1) - Obtém a data e hora atual no formato ISO simplificado para o atributo 'min'
  const today = new Date().toISOString().slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // # Gabriel (Dev 1) - Reforçando regra aqui no front: Validação de data retroativa
    if (formData.data_agendamento < today) {
      setError("Não é possível agendar horários no passado.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        cliente_id: parseInt(formData.cliente_id),
        servico_id: parseInt(formData.servico_id),
        data_agendamento: formData.data_agendamento,
        observacoes: formData.observacoes,
        barbeiro_id: 1 // Usando ID padrão conforme simplificação
      };

      if (!payload.cliente_id || !payload.servico_id || !payload.data_agendamento) {
        throw "Preencha todos os campos obrigatórios.";
      }

      await createAgendamento(payload as any);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setFormData({ cliente_id: '', servico_id: '', data_agendamento: '', observacoes: '' });
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err || 'Erro ao agendar horário.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agendar Horário"
      variant="purple"
      subtitle='Escolha o cliente, o serviço e o horário.'
      size="lg"
      feedback={success ? {
        type: 'success',
        title: 'Agendado!',
        message: 'O horário foi reservado com sucesso.'
      } : null}
    >

      <div className="modal-body-content">
        <form onSubmit={handleSubmit} className="modern-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
          </div>

          <div className="form-group-modern">
            <label>Data e Horário</label>
            <Input
              type="datetime-local"
              icon={<Calendar size={18} />}
              required
              min={today}
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
              icon={<Plus size={18} />}
            >
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AppointmentModal;
