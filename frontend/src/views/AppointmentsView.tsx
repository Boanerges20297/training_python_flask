import { useEffect, useState } from 'react';
import { getAgendamentos, type Agendamento } from '../api/api';
import { Calendar, User, ShoppingBag, Clock, Plus, Loader2 } from 'lucide-react';

export default function AppointmentsView() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgendamentos().then(data => {
      setAgendamentos(data);
      setLoading(false);
    });
  }, []);

  return (
    <section className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="#8b5cf6" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Agenda da Barbearia</h2>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.875rem' }}>
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
                <th>Cliente ID</th>
                <th>Serviço ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.length > 0 ? (
                agendamentos.map((agendamento) => (
                  <tr key={agendamento.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="#a78bfa" />
                        {new Date(agendamento.data_agendamento).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} color="#a78bfa" />
                        Cliente #{agendamento.cliente_id}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingBag size={14} color="#a78bfa" />
                        Serviço #{agendamento.servico_id}
                      </div>
                    </td>
                    <td><span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>Confirmado</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Nenhum agendamento encontrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
