import { useEffect, useState } from 'react';
import { getServicos, createServico, type Servico } from '../api/api';
import { Briefcase, DollarSign, Clock, Plus, Loader2, X, Tag, CheckCircle2 } from 'lucide-react';

export default function ServicesView() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({ nome: '', preco: '', duracao_minutos: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchServicos = async () => {
    setLoading(true);
    try {
      const data = await getServicos();
      setServicos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const handleNewService = () => {
    setError(null);
    setSuccess(false);
    setFormData({ nome: '', preco: '', duracao_minutos: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Converte valores para números
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
        setIsModalOpen(false);
        fetchServicos();
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
          <Briefcase size={20} color="#10b981" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Serviços Disponíveis</h2>
        </div>
        <button onClick={handleNewService} className="btn-primary" style={{ fontSize: '0.875rem', background: '#10b981' }}>
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="#10b981" />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Preço</th>
                <th>Duração</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {servicos.length > 0 ? (
                servicos.map((servico) => (
                  <tr key={servico.id} className="fade-in">
                    <td style={{ fontWeight: 600 }}>{servico.nome}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={14} color="#10b981" />
                        R$ {Number(servico.preco).toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="#10b981" />
                        {servico.duracao_minutos} min
                      </div>
                    </td>
                    <td><span className="badge" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>#{servico.id}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                    <div style={{ opacity: 0.5, marginBottom: '1rem' }}><Briefcase size={48} style={{ margin: '0 auto' }} /></div>
                    Nenhum serviço encontrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Design Premium */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content glass-premium" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn" 
              onClick={handleCloseModal}
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
                      onClick={handleCloseModal} 
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
      )}

      {/* Estilos Adicionais (Reutilizados para consistência) */}
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
          border-color: #10b981;
          background: rgba(2, 6, 23, 0.6);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        }

        .input-group-modern:focus-within .input-icon {
          color: #10b981;
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
        }

        .btn-premium-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
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
