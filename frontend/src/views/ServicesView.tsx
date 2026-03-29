import { useEffect, useState } from 'react';
import { getServicos, type Servico } from '../api/api';
import { Briefcase, DollarSign, Clock, Plus, Loader2 } from 'lucide-react';

export default function ServicesView() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getServicos();
        setServicos(data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={20} color="#10b981" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Serviços Disponíveis</h2>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.875rem' }}>
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
                  <tr key={servico.id}>
                    <td style={{ fontWeight: 600 }}>{servico.nome}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={14} color="#10b981" />
                        R$ {servico.preco.toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="#10b981" />
                        {servico.duracao_minutos} min
                      </div>
                    </td>
                    <td><span className="badge">#{servico.id}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Nenhum serviço encontrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

// export default ServicesView; (Removido para corrigir o erro de exportação duplicada)
