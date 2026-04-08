import React, { useState, useEffect } from 'react';
import { createBarbeiro, updateBarbeiro } from '../../../api/barbers';
import type { Barbeiro } from '../../../types';
import { User, Phone, Mail, Loader2, CheckCircle2, Plus, Edit2, Award, Lock, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../../Modal';
import './BarbersModal.css';

//Gabriel (Dev 1) - Criação do Modal de Barbeiros seguindo padrão dos outros modais.

interface BarbersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  barbeiroParaEditar?: Barbeiro | null;
}

const BarbersModal: React.FC<BarbersModalProps> = ({ isOpen, onClose, onSuccess, barbeiroParaEditar }) => {
  const [formData, setFormData] = useState({ nome: '', especialidade: '', email: '', telefone: '', senha: '', ativo: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (barbeiroParaEditar) {
        setFormData({
          nome: barbeiroParaEditar.nome,
          especialidade: barbeiroParaEditar.especialidade,
          email: barbeiroParaEditar.email,
          telefone: barbeiroParaEditar.telefone,
          senha: '', // Senha não é editada aqui
          ativo: barbeiroParaEditar.ativo
        });
      } else {
        setFormData({ nome: '', especialidade: '', email: '', telefone: '', senha: '', ativo: true });
      }
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, barbeiroParaEditar]);

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
    
    if (!barbeiroParaEditar && !formData.senha) {
      setError("A senha é obrigatória para o cadastro do barbeiro.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (barbeiroParaEditar) {
        const { senha, ...updateData } = formData; // Na edição não enviamos a senha
        const successEdit = await updateBarbeiro(barbeiroParaEditar.id!, updateData);
        if (!successEdit) throw new Error("Erro ao atualizar dados do barbeiro.");
      } else {
        await createBarbeiro(formData);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg = err.message || err.response?.data?.erro || 'Erro ao processar solicitação. Tente Novamente.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={barbeiroParaEditar ? "Editar Barbeiro" : "Contratar Barbeiro"}
      variant="amber"
      subtitle={barbeiroParaEditar ? "Atualize o perfil do profissional." : "Adicione um novo profissional ao seu time."}
    >

      <div className="modal-body-content">
        {success ? (
          <div className="success-state">
            <div className="success-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <CheckCircle2 size={48} color="#f59e0b" />
            </div>
            <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Sucesso!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {barbeiroParaEditar ? 'Perfil atualizado com sucesso.' : 'Barbeiro adicionado ao time com sucesso.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group-modern">
              <label>Nome do Barbeiro</label>
              <div className="input-group-modern">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Nome completo"
                  required
                  maxLength={100}
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label>Especialidade</label>
              <div className="input-group-modern">
                <Award size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Ex: Cortes Clássicos, Barba..."
                  required
                  maxLength={255}
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
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
                    placeholder="email@barbearia.com"
                    required
                    maxLength={100}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {!barbeiroParaEditar && (
               <div className="form-group-modern">
               <label>Senha Provisória</label>
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

            <div className="form-group-modern">
              <label>Disponibilidade</label>
              <button 
                type="button"
                className={`status-toggle ${formData.ativo ? 'active' : 'inactive'}`}
                onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
              >
                {formData.ativo ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                <span>{formData.ativo ? 'Está trabalhando atualmente' : 'Afastado / Indisponível'}</span>
              </button>
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
                    {barbeiroParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
                    <span>{barbeiroParaEditar ? "Salvar Alterações" : "Adicionar Barbeiro"}</span>
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

export default BarbersModal;
