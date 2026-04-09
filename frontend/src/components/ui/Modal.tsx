import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;        
  onClose: () => void;    
  title: string;          
  children: React.ReactNode; 
  variant?: 'blue' | 'purple' | 'green' | 'amber' | 'default'; // # Gabriel (Dev 1) - Cores dinâmicas
  subtitle?: string;
  size?: 'md' | 'lg';
  feedback?: {
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  } | null;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  variant = 'default',
  subtitle,
  size = 'md',
  feedback = null
}) => {
    useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]); 

  if (!isOpen) return null;

  const renderFeedbackIcon = () => {
    switch (feedback?.type) {
      case 'success': return <CheckCircle2 size={48} className="feedback-icon success" />;
      case 'error': return <AlertCircle size={48} className="feedback-icon error" />;
      case 'warning': return <AlertTriangle size={48} className="feedback-icon warning" />;
      default: return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-content-premium ${variant} ${size}`}>
        <div className="modal-header-refined">
          <div className="header-text-container">
            <h3>{title}</h3>
            {subtitle && <p className="modal-subtitle-text">{subtitle}</p>}
          </div>
          <button className="close-btn-premium" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body-refined">
          {feedback ? (
            <div className="feedback-state animate-in">
              <div className={`feedback-icon-wrapper ${feedback.type}`}>
                {renderFeedbackIcon()}
              </div>
              <h3 className="feedback-title">{feedback.title}</h3>
              <p className="feedback-message">{feedback.message}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
