import React, { useState } from 'react';
import { createServico } from '../../../api/services';
import { X, Tag, DollarSign, Clock, Loader2, CheckCircle2, Plus } from 'lucide-react';
import './ServiceModal.css';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ nome: '', preco: '', duracao_minutos: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        nome: formData.nome,
        preco: parseFloat(formData.preco.replace(',', '.')),
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
      }, 1500);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-premium" onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close-btn" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          <X size={18} />
        </button>

        <div className="modal-header-modern">
           <h2 className="modal-title-modern">Novo Serviço</h2>
           <p className="modal-subtitle-modern">Cadastre os detalhes do serviço oferecido.</p>
        </div>

        <div className="modal-body">
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
                      onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
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
      </div>
    </div>
  );
};

export default ServiceModal;
