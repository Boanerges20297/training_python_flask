import React, { useEffect, useState } from 'react';
import { getAgendamentos } from '../../../api/appointments';
import { getClientes } from '../../../api/clients';
import { getServicos } from '../../../api/services';
import type { Agendamento, Cliente, Servico } from '../../../types';
import BarberAgendaDia from './BarberAgendaDia';
import BarberHistorico from './BarberHistorico';
import StatusModal from './StatusModal';
import './BarberDashboard.css';

interface BarberDashboardProps {
  user: { id: number; nome?: string; role: string };
  activeTab?: string;
}

const BarberDashboard: React.FC<BarberDashboardProps> = ({ user, activeTab = 'agenda' }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteMap, setClienteMap] = useState<Record<number, Cliente>>({});
  const [servicoMap, setServicoMap] = useState<Record<number, Servico>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<Agendamento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // REMOVER QUANDO: Backend implementar JOINs nas rotas de agendamento
      const [agendRes, cliRes, servRes] = await Promise.all([
        getAgendamentos(1, 100),
        getClientes(1, 100),
        getServicos(1, 100),
      ]);

      const meusAgendamentos = agendRes.items
        .filter((a) => a.barbeiro_id === user.id)
        .sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime());

      setAgendamentos(meusAgendamentos);

      const cMap: Record<number, Cliente> = {};
      cliRes.items.forEach((c) => (cMap[c.id] = c));
      setClienteMap(cMap);

      const sMap: Record<number, Servico> = {};
      servRes.items.forEach((s) => (sMap[s.id] = s));
      setServicoMap(sMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="barber-panel">
      <div className="barber-welcome">
        <h2>Olá, {user.nome || 'Barbeiro'}!</h2>
        <p>Confira sua agenda e atenda seus clientes.</p>
      </div>

      {activeTab === 'agenda' && (
        <BarberAgendaDia
          agendamentos={agendamentos}
          clienteMap={clienteMap}
          servicoMap={servicoMap}
          loading={loading}
          onRefresh={fetchData}
          onOpenStatusModal={(a) => {
            setSelectedAppointment(a);
            setIsModalOpen(true);
          }}
        />
      )}

      {activeTab === 'historico' && (
        <BarberHistorico
          agendamentos={agendamentos}
          clienteMap={clienteMap}
          servicoMap={servicoMap}
          loading={loading}
          onRefresh={fetchData}
          onOpenStatusModal={(a) => {
            setSelectedAppointment(a);
            setIsModalOpen(true);
          }}
        />
      )}

      <StatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default BarberDashboard;
