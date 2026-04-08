import React, { useState } from 'react';
import { createAgendamento } from '../../../api/appointments';
import type { Cliente, Servico } from '../../../types';
import { User, ShoppingBag, Calendar, FileText, Loader2, CheckCircle2, Plus } from 'lucide-react';
import Modal from '../../Modal';
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
    >

      <div className="modal-body-content">
        {success ? (
          <div className="success-state">
            <div className="success-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <CheckCircle2 size={48} color="#8b5cf6" />
            </div>
            <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Agendado!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>O horário foi reservado com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modern-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group-modern">
                <label>Cliente</label>
                <div className="input-group-modern">
                  <User size={18} className="input-icon" />
                  <select
                    required
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group-modern">
                <label>Serviço</label>
                <div className="input-group-modern">
                  <ShoppingBag size={18} className="input-icon" />
                  <select
                    required
                    value={formData.servico_id}
                    onChange={(e) => setFormData({ ...formData, servico_id: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {Number(s.preco).toFixed(2)}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group-modern">
              <label>Data e Horário</label>
              <div className="input-group-modern">
                <Calendar size={18} className="input-icon" />
                <input
                  type="datetime-local"
                  required
                  min={today}
                  max="2099-12-31T23:59"
                  value={formData.data_agendamento}
                  onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label>Observações (Opcional)</label>
              <div className="input-group-modern">
                <FileText size={18} className="input-icon" style={{ top: '1rem', transform: 'none' }} />
                <textarea
                  rows={3}
                  maxLength={250}
                  placeholder="Ex: Cabelo muito comprido, lavagem especial..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="modal-footer-modern">
              <button
                type="button"
                onClick={onClose}
                className="btn-glass-secondary"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-premium-primary"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AppointmentModal;
