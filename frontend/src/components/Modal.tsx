import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;        
  onClose: () => void;    
  title: string;          
  children: React.ReactNode; 
  variant?: 'blue' | 'purple' | 'green' | 'amber' | 'default'; // # Gabriel (Dev 1) - Cores dinâmicas
  subtitle?: string;
  size?: 'md' | 'lg'; // # Gabriel (Dev 1) - Tamanhos flexíveis
}

// # Gabriel (Dev 1) - Refatoração para arquitetura modular Premium
const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  variant = 'default',
  subtitle,
  size = 'md'
}) => { // # Gabriel (Dev 1) - keydown para a tecla Esc fechar modal e scroll ser travado
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

  // Se o modal não estiver aberto, não renderizamos nada (Early Return)
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div 
        className={`modal-content-premium ${variant} ${size}`} 
      >
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
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
