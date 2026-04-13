import React from 'react';
import { Loader2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import type { LucideIcon } from 'lucide-react';
import './DataTable.css';


export interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
}

export interface DataTableProps<T> {
  title: string;
  icon: LucideIcon;
  loading: boolean;
  data: T[];
  columns: Column<T>[];
  addButtonText?: string;
  onAddClick?: () => void;
  themeColor?: string;
  buttonTheme?: 'blue' | 'green' | 'purple' | 'amber' | 'slate';
  buttonVariant?: 'primary' | 'secondary' | 'danger' | 'normal' | 'ghost';
  buttonSize?: 'sm' | 'md' | 'lg';
  emptyStateIcon: LucideIcon;
  emptyStateText?: string;
  id?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

/*
 * # Gabriel (Dev 1)
 * Componente universal de tabela para as Views administrativas.
 */
function DataTable<T>({
  title,
  icon: Icon,
  loading,
  data,
  columns,
  addButtonText,
  onAddClick,
  themeColor = '#3b82f6',
  buttonTheme = 'blue',
  buttonVariant = 'normal',
  buttonSize = 'md',
  emptyStateIcon: EmptyIcon,
  emptyStateText = 'Nenhum registro encontrado no sistema.',
  id,
  pagination
}: DataTableProps<T>) {
  return (
    <section className="card animate-in" id={id}>
      {/* Cabeçalho da Tabela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon size={20} color={themeColor} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>{title}</h2>
        </div>
        {addButtonText && onAddClick && (
          <Button 
            onClick={onAddClick} 
            theme={buttonTheme}
            variant={buttonVariant}
            size={buttonSize}
            icon={<Plus size={16} />}
          >
            {addButtonText}
          </Button>
        )}
      </div>

      {/* Corpo / Tabela */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color={themeColor} />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    style={{ 
                      textAlign: col.align || 'center',
                      ...col.headerStyle 
                    }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, rowIdx) => (
                  <tr key={rowIdx} className="fade-in">
                    {columns.map((col, colIdx) => (
                      <td 
                        key={colIdx} 
                        style={{ 
                          textAlign: col.align || 'center',
                          ...col.style 
                        }}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                    <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                      <EmptyIcon size={48} style={{ margin: '0 auto' }} />
                    </div>
                    {emptyStateText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé de Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Página <strong>{pagination.currentPage}</strong> de {pagination.totalPages}
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              title="Página Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              title="Próxima Página"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DataTable;
