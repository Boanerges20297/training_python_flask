import React, { useState } from 'react';
import { updateAgendamento } from '../../../api/appointments';
import type { Agendamento } from '../../../types';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Agendamento | null;
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose, onSuccess, appointment }) => {
  const [status, setStatus] = useState(appointment?.status || 'pendente');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    setIsSubmitting(true);
    try {
      await updateAgendamento(appointment.id, { status });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar Agendamento"
      variant="amber"
      size="md"
      feedback={success ? { type: 'success', title: 'Atualizado!', message: 'Status alterado com sucesso.' } : null}
    >
      <form onSubmit={handleSubmit} className="modern-form">
        <div className="form-group-modern">
          <label>Alterar Status</label>
          <Input 
            as="select" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            icon={<AlertCircle size={18} />}
          >
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </Input>
        </div>

        <div className="modal-footer-refined" style={{ marginTop: '2rem' }}>
          <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
          <Button theme="amber" type="submit" isLoading={isSubmitting}>Salvar Alteração</Button>
        </div>
      </form>
    </Modal>
  );
};

export default StatusModal;
