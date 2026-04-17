import { useEffect, useState } from 'react';
import { getAgendamentos } from '../../../api/appointments';
// REMOVER QUANDO: Backend implementar JOINs nas rotas de agendamento
import { getServicos } from '../../../api/services';
import { getBarbeiros } from '../../../api/barbers';
import type { Agendamento, Servico, Barbeiro } from '../../../types';
import ClientInicio from './ClientInicio';
import ClientAgendamentos from './ClientAgendamentos';
import BookingModal from './BookingModal';
import './ClientDashboard.css';

interface ClientDashboardProps {
  user: { id: number; nome?: string; email?: string; role: string };
  activeTab?: string;
}

export default function ClientDashboard({ user, activeTab = 'inicio' }: ClientDashboardProps) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // REMOVER QUANDO: Backend implementar JOINs nas rotas de agendamento
  const [servicoMap, setServicoMap] = useState<Record<number, Servico>>({});
  const [barbeiroMap, setBarbeiroMap] = useState<Record<number, Barbeiro>>({});
  const [allServicos, setAllServicos] = useState<Servico[]>([]);
  const [allBarbeiros, setAllBarbeiros] = useState<Barbeiro[]>([]);
  const [allAgendamentos, setAllAgendamentos] = useState<Agendamento[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agendRes, servRes, barbRes] = await Promise.all([
        getAgendamentos(1, 100),
        getServicos(1, 100),
        getBarbeiros(1, 100),
      ]);

      // Todos os agendamentos (para disponibilidade de horários)
      setAllAgendamentos(agendRes.items || []);

      // Filtra apenas os do cliente logado
      const meusAgendamentos = (agendRes.items || []).filter(
        (a) => a.cliente_id === user.id
      );
      setAgendamentos(meusAgendamentos);

      const sMap: Record<number, Servico> = {};
      (servRes.items || []).forEach((s) => (sMap[s.id] = s));
      setServicoMap(sMap);
      setAllServicos(servRes.items || []);

      const bMap: Record<number, Barbeiro> = {};
      (barbRes.items || []).forEach((b) => {
        if (b.id) bMap[b.id] = b;
      });
      setBarbeiroMap(bMap);
      setAllBarbeiros(barbRes.items || []);
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="client-welcome-header">
        <h2>Olá, {user.nome || 'Cliente'}</h2>
      </div>

      {activeTab === 'inicio' && (
        <ClientInicio
          agendamentos={agendamentos}
          servicoMap={servicoMap}
          barbeiroMap={barbeiroMap}
          onOpenBooking={() => setIsBookingOpen(true)}
        />
      )}

      {(activeTab === 'agendamentos' || activeTab === 'agendamentos_cliente') && (
        <ClientAgendamentos
          agendamentos={agendamentos}
          servicoMap={servicoMap}
          barbeiroMap={barbeiroMap}
          loading={loading}
          onRefresh={fetchData}
        />
      )}

      {/* BookingModal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        servicos={allServicos}
        barbeiros={allBarbeiros}
        clienteId={user.id}
        allAgendamentos={allAgendamentos}
      />
    </>
  );
}
