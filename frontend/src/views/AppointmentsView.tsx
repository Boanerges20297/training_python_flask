import { useEffect, useState } from 'react';
import { getAgendamentos } from '../api/appointments';
import { getClientes } from '../api/clients';
import { getServicos } from '../api/services';
import type { Agendamento, Cliente, Servico } from '../types';
import { Calendar, User, ShoppingBag, Clock, Plus, Loader2 } from 'lucide-react';
import AppointmentModal from '../components/modals/AppointmentModal/AppointmentModal';

// Componentes de Agendamentos, gerência de estados
export default function AppointmentsView() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para buscar dados
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

  // Hook para buscar dados
  useEffect(() => {
    fetchData();
  }, []);

  // Função para abrir modal de novo agendamento
  const handleNewAppointment = () => {
    setIsModalOpen(true);
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

      {/* Componente Modal Refatorado */}
      <AppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        clientes={clientes}
        servicos={servicos}
      />
    </section>
  );
}
