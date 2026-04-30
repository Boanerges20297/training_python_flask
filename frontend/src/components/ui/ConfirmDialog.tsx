import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import './ConfirmDialog.css';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-close-btn" onClick={onCancel} aria-label="Fechar">
          <X size={20} />
        </button>

        <div className={`confirm-icon-wrapper ${type}`}>
          {type === 'danger' ? <AlertCircle size={40} /> : <AlertTriangle size={40} />}
        </div>
        
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        
        <div className="confirm-actions">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            theme={type === 'danger' ? 'red' : 'purple'} 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
