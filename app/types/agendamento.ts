/**
 * Interface para armazenar os dados do agendamento
 */
export interface AgendamentoData {
    selectedService: { id: number, name: string }[];
    selectedBarber: number | null;
    selectedDate: Date | undefined;
    selectedTime: string;
}