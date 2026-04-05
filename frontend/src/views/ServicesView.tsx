import { useEffect, useState } from 'react';
import { getServicos } from '../api/services';
import type { Servico } from '../types';
import { Briefcase, DollarSign, Clock, Plus, Loader2 } from 'lucide-react';
import ServiceModal from '../components/modals/ServiceModal/ServiceModal';
import { useToast } from '../components/Toast';

export default function ServicesView() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchServicos = async () => {
    setLoading(true);
    try {
      const data = await getServicos();
      setServicos(data);
    } catch (e) {
      showToast('Erro ao carregar serviços.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const handleNewService = () => {
    setIsModalOpen(true);
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

      {/* Componente Modal Refatorado */}
      <ServiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchServicos} 
      />
    </section>
  );
}
