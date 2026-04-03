import React, { useState } from 'react';
import { createCliente } from '../../../api/clients';
import { User, Phone, Mail, Loader2, CheckCircle2, Plus } from 'lucide-react';
import Modal from '../../Modal';
import './ClientModal.css';
import { useToast } from '../../Toast';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// # Gabriel (Dev 1)
// Refatorado para usar o Modal genérico e evitar código repetido.
const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();


  // Máscara de Telefone: (00) 00000-0000
  const formatPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.slice(0, 11);
    
    if (value.length <= 10) {
      return value.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      return value.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, telefone: formatted });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.telefone.replace(/\D/g, "").length < 10) {
      setError("Por favor, insira um telefone válido com DDD.");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Por favor, insira um endereço de e-mail válido.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createCliente(formData);
      setSuccess(true);
      showToast('Cliente cadastrado com sucesso!', 'success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao cadastrar cliente. Tente novamente.';
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
      title="Cadastrar Cliente"
      variant="blue"
      subtitle="Insira os dados para cadastrar o cliente na base."
    >

      <div className="modal-body-content">
        {success ? (
          <div className="success-state">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={48} color="#22c55e" />
            </div>
            <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Sucesso!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Cliente cadastrado com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group-modern">
              <label>Nome Completo</label>
              <div className="input-group-modern">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Ex: João Silva" 
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group-modern">
                <label>Telefone</label>
                <div className="input-group-modern">
                  <Phone size={18} className="input-icon" />
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000" 
                    required
                    value={formData.telefone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label>E-mail</label>
                <div className="input-group-modern">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    placeholder="email@exemplo.com" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Cadastrar Cliente</span>
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

export default ClientModal;
