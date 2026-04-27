import React from 'react';
import type { Agendamento } from '../../types';
import { Check, X } from 'lucide-react';
import styles from './TimeSlotPicker.module.css';

interface TimeSlotPickerProps {
  date: string; // YYYY-MM-DD
  barbeiroId: number;
  servicoDuracao: number; // minutos
  agendamentos: Agendamento[];
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  theme?: 'blue' | 'purple' | 'green' | 'amber';
}

const generateSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 8; h < 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots.filter(s => s <= '19:30');
};

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  date,
  barbeiroId,
  servicoDuracao,
  agendamentos,
  selectedSlot,
  onSlotSelect,
  theme = 'blue'
}) => {
  const slots = generateSlots();

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
      const agendEnd = new Date(agendStart.getTime() + 30 * 60000);
      return slotStart < agendEnd && slotEnd > agendStart;
    });
  };

  const isSlotPassado = (slot: string): boolean => {
    const now = new Date();
    const slotDate = new Date(`${date}T${slot}:00`);
    return slotDate <= now;
  };

  if (!date) {
    return <div className={styles.empty}><p>Selecione uma data para ver os horários.</p></div>;
  }

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <div className={styles.grid}>
        {slots.map((slot) => {
          const ocupado = isSlotOcupado(slot);
          const passado = isSlotPassado(slot);
          const disabled = ocupado || passado;
          const selected = selectedSlot === slot;

          return (
            <button
              key={slot}
              type="button"
              className={`${styles.slot} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''} ${ocupado ? styles.ocupado : ''}`}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onSlotSelect(selected ? '' : slot);
              }}
            >
              <span className={styles.time}>{slot}</span>
              {selected && <Check size={14} className={styles.check} />}
              {ocupado && <X size={12} className={styles.x} />}
            </button>
          );
        })}
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotFree}`} /> Livre</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotOcupado}`} /> Ocupado</span>
      </div>
    </div>
  );
};

export default TimeSlotPicker;
