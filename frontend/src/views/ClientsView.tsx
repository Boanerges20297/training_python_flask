import { useEffect, useState } from 'react';
import { getClientes, createCliente, type Cliente } from '../api/api';
import { Users, Phone, Mail, Plus, Loader2, X, User, CheckCircle2 } from 'lucide-react';

export default function ClientsView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados do formulário
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    const data = await getClientes();
    setClientes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Máscara de Telefone: (00) 00000-0000
  const formatPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, ""); // Remove tudo que não é dígito
    value = value.slice(0, 11); // Limita em 11 dígitos
    
    if (value.length <= 10) {
      // (00) 0000-0000
      return value
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      // (00) 00000-0000
      return value
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, telefone: formatted });
  };

  const handleNewClient = () => {
    setError(null);
    setSuccess(false);
    setFormData({ nome: '', email: '', telefone: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações locais antes do envio
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
      setTimeout(() => {
        setIsModalOpen(false);
        fetchClientes();
      }, 1500);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="#3b82f6" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Clientes Cadastrados</h2>
        </div>
        <button onClick={handleNewClient} className="btn-primary" style={{ fontSize: '0.875rem' }}>
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="#3b82f6" />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Email</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="fade-in">
                    <td style={{ fontWeight: 600 }}>{cliente.nome}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} color="#60a5fa" />
                        {cliente.telefone}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} color="#60a5fa" />
                        {cliente.email}
                      </div>
                    </td>
                    <td><span className="badge">#{cliente.id}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                    <div style={{ opacity: 0.5, marginBottom: '1rem' }}><Users size={48} style={{ margin: '0 auto' }} /></div>
                    Nenhum cliente encontrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal - Design Premium Aperfeiçoado */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content glass-premium" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn" 
              onClick={handleCloseModal}
              disabled={isSubmitting}
              title="Fechar"
            >
              <X size={18} />
            </button>

            <div className="modal-header-modern">
               <h2 className="modal-title-modern">Cadastrar Cliente</h2>
               <p className="modal-subtitle-modern">Insira os dados para cadastrar o cliente na base.</p>
            </div>

            <div className="modal-body">
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
                      onClick={handleCloseModal} 
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
          </div>
        </div>
      )}

      {/* Estilos Adicionais */}
      <style>{`
        .glass-premium {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          border-radius: 24px;
          padding: 2.5rem;
          width: 100%;
          max-width: 500px;
          position: relative;
          animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
          animation: fade-in 0.2s ease-out;
          padding: 1rem;
        }

        .modal-close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
          transform: rotate(90deg);
        }

        .modal-header-modern {
          margin-bottom: 2rem;
        }

        .modal-title-modern {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0 0 0.5rem 0;
        }

        .modal-subtitle-modern {
          font-size: 0.9rem;
          color: #94a3b8;
          margin: 0;
        }

        .modern-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group-modern {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .form-group-modern label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-group-modern {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #475569;
          transition: all 0.2s;
        }

        .input-group-modern input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 3rem;
          background: rgba(2, 6, 23, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          color: #f8fafc;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .input-group-modern input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(2, 6, 23, 0.6);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }

        .input-group-modern:focus-within .input-icon {
          color: #3b82f6;
          transform: scale(1.1);
        }

        .error-message {
          color: #f87171;
          font-size: 0.85rem;
          background: rgba(239, 68, 68, 0.1);
          padding: 0.8rem;
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .modal-footer-modern {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-glass-secondary {
          flex: 1;
          padding: 0.8rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          border-radius: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-glass-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }

        .btn-premium-primary {
          flex: 2;
          padding: 0.8rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          color: white;
          border-radius: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-premium-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          filter: brightness(1.1);
        }

        .btn-premium-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .success-state {
          text-align: center;
          padding: 2rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .success-icon-wrapper {
          width: 80px;
          height: 80px;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
