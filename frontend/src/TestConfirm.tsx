import { useState } from 'react';
import ConfirmDialog from './components/ui/ConfirmDialog';

export default function TestConfirm() {
  const [open, setOpen] = useState(true);
  return (
    <ConfirmDialog 
      isOpen={open}
      title="Teste de Confirmar"
      message="Esta é uma mensagem de teste para verificar a estilização premium."
      onConfirm={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      type="danger"
    />
  );
}
