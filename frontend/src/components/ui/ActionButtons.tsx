// Gabriel (Dev 1) - Botões de ação feitos por Ian (Dev 2) componentizados
import React from 'react';
import { Edit2, Trash2, Info } from 'lucide-react';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onInfo?: (e: React.MouseEvent) => void;
  editTitle?: string;
  deleteTitle?: string;
  infoTitle?: string;
  theme?: 'blue' | 'green' | 'purple' | 'amber' | 'default';
}

const themeColors = {
  blue: '#60a5fa',
  green: '#4ade80',
  purple: '#a78bfa',
  amber: '#f59e0b',
  default: '#94a3b8'
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onEdit, 
  onDelete, 
  onInfo,
  editTitle = "Editar", 
  deleteTitle = "Excluir",
  infoTitle = "Mais informações",
  theme = 'blue'
}) => {
  const mainColor = themeColors[theme];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
      {onInfo && (
        <button
          onClick={onInfo}
          title={infoTitle}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            color: mainColor, 
            padding: '0.25rem',
            transition: 'all 0.2s',
            opacity: 0.8
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.2)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '0.8';
          }}
          aria-label={infoTitle}
        >
          <Info size={19} />
        </button>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          title={editTitle}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            color: mainColor, 
            padding: '0.25rem',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          aria-label={editTitle}
        >
          <Edit2 size={18} />
        </button>
      )}
      
      {onDelete && (
        <button
          onClick={onDelete}
          title={deleteTitle}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#ef4444', 
            padding: '0.25rem',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          aria-label={deleteTitle}
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
