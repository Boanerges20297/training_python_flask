import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Popover.css';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  anchorEl: HTMLElement | null;
  themeColor?: string;
}

/**
 * # Gabriel (Arquitetura)
 * Componente de Popover Premium com posicionamento dinâmico.
 * Segue a paleta de cores da View onde está inserido.
 */
const Popover: React.FC<PopoverProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  anchorEl,
  themeColor = '#3b82f6'
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();

  return (
    <div 
      ref={popoverRef}
      className="popover-premium popover-animate-in"
      style={{
        position: 'fixed',
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
        '--popover-theme': themeColor
      } as React.CSSProperties}
    >
      <div className="popover-header">
        <span className="popover-title">{title}</span>
        <button onClick={onClose} className="popover-close">
          <X size={14} />
        </button>
      </div>
      <div className="popover-body">
        {content || <span className="text-muted italic">Nenhuma observação registrada.</span>}
      </div>
      <div className="popover-arrow"></div>
    </div>
  );
};

export default Popover;
