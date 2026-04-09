import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

// # Gabriel (Dev 1)
// Um diálogo de confirmação que aparece no topo da tela (estilo pop-up de alerta).
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar", 
  onConfirm, 
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className={`confirm-dialog-top ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <AlertTriangle size={24} />
        </div>
        
        <div className="confirm-content">
          <h4>{title}</h4>
          <p>{message}</p>
        </div>

        <div className="confirm-actions">
          <button className="confirm-btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`confirm-btn-action ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>

        <button className="confirm-close-x" onClick={onCancel}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ConfirmDialog;
