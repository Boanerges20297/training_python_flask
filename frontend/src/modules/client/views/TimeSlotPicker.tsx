import React from 'react';
import type { Agendamento } from '../../../types';
import { Check, X } from 'lucide-react';

interface TimeSlotPickerProps {
  date: string; // YYYY-MM-DD
  barbeiroId: number;
  servicoDuracao: number; // minutos
  agendamentos: Agendamento[];
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
}

// Gera slots de 30min entre 08:00 e 19:30
const generateSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 8; h < 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 19 || (h === 19 && true)) {
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
  }
  // Remove 19:30+ pois o último serviço precisa terminar até 20h
  return slots.filter(s => s <= '19:30');
};

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  date,
  barbeiroId,
  servicoDuracao,
  agendamentos,
  selectedSlot,
  onSlotSelect,
}) => {
  const slots = generateSlots();

  // Verifica se um slot está ocupado para o barbeiro naquela data
  const isSlotOcupado = (slot: string): boolean => {
    if (!date || !barbeiroId) return false;

    const slotStart = new Date(`${date}T${slot}:00`);
    const slotEnd = new Date(slotStart.getTime() + servicoDuracao * 60000);

    return agendamentos.some((a) => {
      if (a.barbeiro_id !== barbeiroId) return false;
      if (a.status === 'cancelado') return false;

      const agendDate = a.data_agendamento.split('T')[0];
      if (agendDate !== date) return false;

      const agendStart = new Date(a.data_agendamento);
      // Assume duração padrão de 30min se não soubermos a real
      const agendEnd = new Date(agendStart.getTime() + 30 * 60000);

      // Há sobreposição?
      return slotStart < agendEnd && slotEnd > agendStart;
    });
  };

  // Verifica se o slot já passou (para o dia de hoje)
  const isSlotPassado = (slot: string): boolean => {
    const now = new Date();
    const slotDate = new Date(`${date}T${slot}:00`);
    return slotDate <= now;
  };

  if (!date) {
    return (
      <div className="timeslot-empty">
        <p>Selecione uma data para ver os horários disponíveis.</p>
      </div>
    );
  }

  return (
    <div className="timeslot-picker">
      <div className="timeslot-grid">
        {slots.map((slot) => {
          const ocupado = isSlotOcupado(slot);
          const passado = isSlotPassado(slot);
          const disabled = ocupado || passado;
          const selected = selectedSlot === slot;

          return (
            <button
              key={slot}
              type="button"
              className={`timeslot-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${ocupado ? 'ocupado' : ''}`}
              disabled={disabled}
              onClick={() => !disabled && onSlotSelect(slot)}
            >
              <span className="timeslot-time">{slot}</span>
              {selected && <Check size={14} className="timeslot-check" />}
              {ocupado && <X size={12} className="timeslot-x" />}
            </button>
          );
        })}
      </div>
      <div className="timeslot-legend">
        <span className="legend-item"><span className="legend-dot free" /> Disponível</span>
        <span className="legend-item"><span className="legend-dot ocupado" /> Ocupado</span>
        <span className="legend-item"><span className="legend-dot selected" /> Selecionado</span>
      </div>
    </div>
  );
};

export default TimeSlotPicker;
