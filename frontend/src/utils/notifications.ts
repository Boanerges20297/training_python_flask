/**
 * Utilitário para disparar notificações no sistema BarbaByte.
 * As notificações aparecem no sino do Header.
 */

export type NotificationType = 'cancel' | 'system' | 'debt' | 'success' | 'info' | 'warning' | 'error';

interface NotifyOptions {
  title: string;
  message: string;
  type?: NotificationType;
  time?: string;
}

/**
 * Dispara uma notificação que será capturada pelo componente Header.
 * 
 * @param options Configurações da notificação
 */
export const notify = (options: NotifyOptions) => {
  const event = new CustomEvent('barbabyte:notificacao', {
    detail: {
      title: options.title,
      message: options.message,
      type: options.type || 'system',
      time: options.time || 'Agora'
    }
  });
  window.dispatchEvent(event);
};

// Atalhos comuns
export const notifyDebt = (clientName: string, amount: number) => {
  notify({
    title: 'Nova Inadimplência',
    message: `${clientName} possui um débito de R$ ${amount.toLocaleString()}`,
    type: 'debt'
  });
};

export const notifyCancel = (clientName: string, serviceName: string) => {
  notify({
    title: 'Agendamento Cancelado',
    message: `${clientName} cancelou: ${serviceName}`,
    type: 'cancel'
  });
};

export const notifyNewAppointment = (clientName: string, time: string) => {
  notify({
    title: 'Novo Agendamento',
    message: `${clientName} agendou para às ${time}`,
    type: 'success'
  });
};
