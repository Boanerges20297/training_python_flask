import { useEffect, useState } from 'react';
import { getAgendamentos, getClientes, getServicos, createAgendamento, type Agendamento, type Cliente, type Servico } from '../api/api';
import { Calendar, User, ShoppingBag, Clock, Plus, Loader2, X, FileText, CheckCircle2 } from 'lucide-react';

export default function AppointmentsView() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({ 
    cliente_id: '', 
    servico_id: '', 
    data_agendamento: '', 
    observacoes: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agData, clData, svData] = await Promise.all([
        getAgendamentos(),
        getClientes(),
        getServicos()
      ]);
      setAgendamentos(agData);
      setClientes(clData);
      setServicos(svData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNewAppointment = () => {
    setError(null);
    setSuccess(false);
    setFormData({ cliente_id: '', servico_id: '', data_agendamento: '', observacoes: '' });
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
        setIsModalOpen(false);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpers para mapear nomes na tabela
  const getClienteNome = (id: number) => clientes.find(c => c.id === id)?.nome || `Cliente #${id}`;
  const getServicoNome = (id: number) => servicos.find(s => s.id === id)?.nome || `Serviço #${id}`;

  return (
    <section className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="#8b5cf6" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Agenda da Barbearia</h2>
        </div>
        <button onClick={handleNewAppointment} className="btn-primary" style={{ fontSize: '0.875rem', background: '#8b5cf6' }}>
          <Plus size={16} /> Novo Agendamento
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="#8b5cf6" />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data e Hora</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.length > 0 ? (
                agendamentos.map((agendamento) => (
                  <tr key={agendamento.id} className="fade-in">
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="#a78bfa" />
                        {new Date(agendamento.data_agendamento).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} color="#a78bfa" />
                        {getClienteNome(agendamento.cliente_id)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingBag size={14} color="#a78bfa" />
                        {getServicoNome(agendamento.servico_id)}
                      </div>
                    </td>
                    <td><span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>Confirmado</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                    <div style={{ opacity: 0.5, marginBottom: '1rem' }}><Calendar size={48} style={{ margin: '0 auto' }} /></div>
                    Nenhum agendamento encontrado no sistema.
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
          <div className="modal-content glass-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button 
              className="modal-close-btn" 
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              <X size={18} />
            </button>

            <div className="modal-header-modern">
               <h2 className="modal-title-modern">Agendar Horário</h2>
               <p className="modal-subtitle-modern">Escolha o cliente, o serviço e o horário.</p>
            </div>

            <div className="modal-body">
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
                      onClick={handleCloseModal} 
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

        .input-group-modern select,
        .input-group-modern input,
        .input-group-modern textarea {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 3rem;
          background: rgba(2, 6, 23, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          color: #f8fafc;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        
        .input-group-modern select {
          cursor: pointer;
          appearance: none;
        }

        .input-group-modern input:focus,
        .input-group-modern select:focus,
        .input-group-modern textarea:focus {
          outline: none;
          border-color: #8b5cf6;
          background: rgba(2, 6, 23, 0.6);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
        }

        .input-group-modern:focus-within .input-icon {
          color: #8b5cf6;
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
