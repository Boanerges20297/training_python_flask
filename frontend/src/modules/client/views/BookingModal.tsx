import React, { useState, useEffect } from 'react';
import { createAgendamento } from '../../../api/appointments';
import type { Servico, Barbeiro, Agendamento } from '../../../types';
import { Scissors, ShoppingBag, Calendar, FileText, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import TimeSlotPicker from '../../../components/ui/TimeSlotPicker';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  servicos: Servico[];
  barbeiros: Barbeiro[];
  clienteId: number;
  allAgendamentos: Agendamento[];
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  servicos,
  barbeiros,
  clienteId,
  allAgendamentos,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    servico_id: '',
    barbeiro_id: '',
    data: '', // YYYY-MM-DD
    horario: '', // HH:MM
    observacoes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ servico_id: '', barbeiro_id: '', data: '', horario: '', observacoes: '' });
      setStep(1);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const today = new Date().toISOString().split('T')[0];
  const barbeirosAtivos = barbeiros.filter((b) => b.ativo !== false);
  const servicoSelecionado = servicos.find((s) => s.id === parseInt(formData.servico_id));

  const handleServicoChange = (servicoId: string) => {
    setFormData((prev) => ({ ...prev, servico_id: servicoId, barbeiro_id: '' }));
    const servSelecionado = servicos.find((s) => s.id === parseInt(servicoId));
    if (servSelecionado) {
      const barbeirosDoServico = barbeirosAtivos.filter((b) => b.servicos_ids?.includes(servSelecionado.id));
      if (barbeirosDoServico.length === 1) {
        setFormData((prev) => ({ ...prev, barbeiro_id: String(barbeirosDoServico[0].id) }));
      }
    }
  };

  const canAdvance = formData.servico_id && formData.barbeiro_id;
  const canSubmit = canAdvance && formData.data && formData.horario;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!canSubmit) throw 'Preencha todos os campos obrigatórios.';

      const data_agendamento = `${formData.data}T${formData.horario}:00`;

      const payload = {
        cliente_id: clienteId,
        servico_id: parseInt(formData.servico_id),
        barbeiro_id: parseInt(formData.barbeiro_id),
        data_agendamento,
        observacoes: formData.observacoes,
        status: 'pendente',
      };

      await createAgendamento(payload as any);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err || 'Erro ao criar agendamento.';
      setError(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Escolha o Serviço' : 'Escolha o Horário'}
      variant="blue"
      subtitle={step === 1 ? 'Selecione o serviço e o profissional.' : 'Selecione a data e o horário disponível.'}
      size="lg"
      feedback={
        success
          ? { type: 'success', title: 'Agendado!', message: 'Seu horário foi reservado com sucesso.' }
          : null
      }
    >
      <div className="modal-body-content">
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line" />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          {/* STEP 1: Serviço + Barbeiro */}
          {step === 1 && (
            <>
              <div className="form-group-modern">
                <label>Serviço</label>
                <Input
                  as="select"
                  icon={<ShoppingBag size={18} />}
                  required
                  value={formData.servico_id}
                  onChange={(e) => handleServicoChange(e.target.value)}
                >
                  <option value="">Selecione um serviço...</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} — R$ {Number(s.preco).toFixed(2)} ({s.duracao_minutos} min)
                    </option>
                  ))}
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
                  <option value="">Selecione um profissional...</option>
                  {barbeirosAtivos
                    .filter((b) => !servicoSelecionado || b.servicos_ids?.includes(servicoSelecionado.id))
                    .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome} — {b.especialidades?.[0] || 'Geral'}
                    </option>
                  ))}
                </Input>
              </div>

              {servicoSelecionado && (
                <div className="client-highlight-card">
                  <div className="client-highlight-icon">
                    <ShoppingBag size={22} color="#3b82f6" />
                  </div>
                  <div className="client-highlight-info">
                    <h3 className="text-capitalize">{servicoSelecionado.nome}</h3>
                    <p>
                      R$ {Number(servicoSelecionado.preco).toFixed(2)} • {servicoSelecionado.duracao_minutos} minutos
                    </p>
                  </div>
                </div>
              )}

              <div className="modal-footer-refined">
                <Button type="button" onClick={onClose} variant="secondary" size="sm">
                  Cancelar
                </Button>
                <Button
                  type="button"
                  theme="blue"
                  size="md"
                  icon={<ArrowRight size={18} />}
                  disabled={!canAdvance}
                  onClick={() => setStep(2)}
                >
                  Próximo
                </Button>
              </div>
            </>
          )}

          {/* STEP 2: Data + Horário + Observações */}
          {step === 2 && (
            <>
              <div className="form-group-modern">
                <label>Data</label>
                <Input
                  type="date"
                  icon={<Calendar size={18} />}
                  required
                  min={today}
                  value={formData.data}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, data: e.target.value, horario: '' })
                  }
                />
              </div>

              {/* TimeSlotPicker */}
              <div className="form-group-modern">
                <label>Horário</label>
                <TimeSlotPicker
                  date={formData.data}
                  barbeiroId={parseInt(formData.barbeiro_id)}
                  servicoDuracao={servicoSelecionado?.duracao_minutos || 30}
                  agendamentos={allAgendamentos}
                  selectedSlot={formData.horario}
                  onSlotSelect={(slot) => setFormData({ ...formData, horario: slot })}
                  theme="blue"
                />
              </div>

              <div className="form-group-modern">
                <label>Observações (Opcional)</label>
                <Input
                  as="textarea"
                  icon={<FileText size={18} />}
                  rows={2}
                  maxLength={250}
                  placeholder="Ex: Cabelo muito comprido, lavagem especial..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-footer-refined">
                <Button type="button" variant="secondary" size="sm" icon={<ArrowLeft size={16} />}
                  onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  type="submit"
                  theme="blue"
                  size="md"
                  disabled={!canSubmit || isSubmitting}
                  isLoading={isSubmitting}
                  icon={<Plus size={18} />}
                >
                  Confirmar Agendamento
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default BookingModal;
