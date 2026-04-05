import React, { useState } from 'react';
import { createServico } from '../../../api/services';
import { Tag, DollarSign, Clock, Loader2, CheckCircle2, Plus } from 'lucide-react';
import Modal from '../../Modal';
import './ServiceModal.css';
import { useToast } from '../../Toast';

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
  const { showToast } = useToast();

  // # Gabriel (Dev 1)
  // Função para formatar o preço do serviço.
  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    
    return (Number(digits) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

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
      showToast('Serviço criado com sucesso!', 'success');
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setFormData({ nome: '', preco: '', duracao_minutos: '' });
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err || 'Erro ao cadastrar serviço.';
      setError(msg);
      showToast(msg, 'error');
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
    >

      <div className="modal-body-content">
        {success ? (
          <div className="success-state">
            <div className="success-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Sucesso!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Serviço criado com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group-modern">
              <label>Nome do Serviço</label>
              <div className="input-group-modern">
                <Tag size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Ex: Corte Degradê" 
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group-modern">
                <label>Preço (R$)</label>
                <div className="input-group-modern">
                  <DollarSign size={18} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="0,00" 
                    required
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: formatCurrency(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label>Duração (min)</label>
                <div className="input-group-modern">
                  <Clock size={18} className="input-icon" />
                  <input 
                    type="number" 
                    placeholder="30" 
                    required
                    value={formData.duracao_minutos}
                    onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
                  />
                </div>
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
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Criar Serviço</span>
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

export default ServiceModal;
