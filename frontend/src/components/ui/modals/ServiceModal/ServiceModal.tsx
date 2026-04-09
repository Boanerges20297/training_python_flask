import React, { useState } from 'react';
import { createServico } from '../../../../api/services';
import { Tag, DollarSign, Clock, Plus } from 'lucide-react';
import Modal from '../../Modal';
import Input from '../../Input';
import Button from '../../Button';
import './ServiceModal.css';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// # Gabriel (Dev 1)
// Refatorado para usar o Modal genérico e centralizar os estilos de overlay.
const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ nome: '', preco: '', duracao_minutos: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // # Gabriel (Dev 1)
      // Limpeza: Remove "R$", pontos de milhar e troca vírgula por ponto
      const cleanPrice = formData.preco
        .replace(/\D/g, "")
        .replace(/(\d+)(\d{2})$/, "$1.$2");

      const payload = {
        nome: formData.nome,
        preco: parseFloat(cleanPrice),
        duracao_minutos: parseInt(formData.duracao_minutos)
      };

      if (isNaN(payload.preco) || isNaN(payload.duracao_minutos)) {
        throw "Preço ou duração inválidos.";
      }

      await createServico(payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setFormData({ nome: '', preco: '', duracao_minutos: '' });
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err || 'Erro ao cadastrar serviço.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Serviço"
      variant="green"
      subtitle='Cadastre os detalhes do serviço oferecido.'
      feedback={success ? {
        type: 'success',
        title: 'Sucesso!',
        message: 'Serviço criado com sucesso.'
      } : null}
    >

      <div className="modal-body-content">
        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-group-modern">
            <label>Nome do Serviço</label>
            <Input
              type="text"
              icon={<Tag size={18} />}
              placeholder="Ex: Corte Degradê"
              required
              maxLength={255}
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group-modern">
              <label>Preço (R$)</label>
              <Input
                mask="currency"
                icon={<DollarSign size={18} />}
                placeholder="0,00"
                required
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              />
            </div>

            <div className="form-group-modern">
              <label>Duração (min)</label>
              <Input
                type="number"
                icon={<Clock size={18} />}
                min="0"
                placeholder="30"
                required
                value={formData.duracao_minutos}
                onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
              />
            </div>
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              theme="green"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              icon={<Plus size={18} />}
            >
              Criar Serviço
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ServiceModal;
