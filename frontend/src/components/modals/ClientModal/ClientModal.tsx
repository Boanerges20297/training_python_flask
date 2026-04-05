import React, { useState, useEffect } from 'react';
import { createCliente, updateCliente } from '../../../api/clients';
import type { Cliente } from '../../../types';
import { User, Phone, Mail, Loader2, CheckCircle2, Plus, Edit2, Lock } from 'lucide-react';
import Modal from '../../Modal';
import './ClientModal.css';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteParaEditar?: Cliente | null;
}

// # Gabriel (Dev 1)
// Refatorado para usar o Modal genérico e evitar código repetido.
const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSuccess, clienteParaEditar }) => {
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // # Ian (Dev 2)
  // Preenche o formulário com os dados do cliente ao abrir para edição.
  useEffect(() => {
    if (isOpen) {
      if (clienteParaEditar) {
        setFormData({
          nome: clienteParaEditar.nome,
          email: clienteParaEditar.email,
          telefone: clienteParaEditar.telefone,
          senha: '', // # Gabriel (Dev 1) - Senha não é editada aqui por segurança
        });
      } else {
        setFormData({ nome: '', email: '', telefone: '', senha: '' });
      }
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, clienteParaEditar]);

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

    if (!clienteParaEditar && !formData.senha) {  // # Gabriel (Dev 1) - Validação de senha para novo cliente
      setError("A senha é obrigatória para o cadastro.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (clienteParaEditar) {
        const successEdit = await updateCliente(clienteParaEditar.id, {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone
        });
        if (!successEdit) throw new Error("Erro ao atualizar cliente.");
      } else {
        await createCliente(formData);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg = err.message || err.response?.data?.erro || 'Erro ao processar solicitação. Tente novamente.';
      setError(msg);
      // Hierarquia de Notificações: Erros no modal NÃO dispara Toast (já está no error-message)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clienteParaEditar ? "Editar Cliente" : "Cadastrar Cliente"}
      variant="blue"
      subtitle={clienteParaEditar ? "Atualize os dados do cliente." : "Insira os dados para cadastrar o cliente na base."}
    >

      <div className="modal-body-content">
        {success ? (
          <div className="success-state">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={48} color="#22c55e" />
            </div>
            <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Sucesso!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {clienteParaEditar ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.'}
            </p>
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
                  maxLength={100}
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
                    maxLength={15}
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
                    maxLength={100}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* # Gabriel (Dev 1) - O campo de senha só aparece quando um novo cliente está sendo criado */}
            {!clienteParaEditar && (
               <div className="form-group-modern">
               <label>Senha de Acesso</label>
               <div className="input-group-modern">
                 <Lock size={18} className="input-icon" />
                 <input
                   type="password"
                   placeholder="Mínimo 6 caracteres"
                   required
                   minLength={6}
                   maxLength={20}
                   value={formData.senha}
                   onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                 />
               </div>
             </div>
            )}

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
                    {clienteParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
                    <span>{clienteParaEditar ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
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
