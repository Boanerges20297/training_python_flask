import React from 'react';
import { Loader2, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Button from './Button';
import type { LucideIcon } from 'lucide-react';
import styles from './DataTable.module.css';

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
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchFilter?: (item: T, query: string) => boolean;
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
  pagination,
  enableSearch,
  searchPlaceholder = 'Pesquisar...',
  onSearch,
  searchFilter
}: DataTableProps<T>) {
  const [internalQuery, setInternalQuery] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalQuery(val);
    if (onSearch) onSearch(val);
  };

  const filteredData = data.filter((item) => {
    if (!enableSearch || !internalQuery) return true;
    if (searchFilter) return searchFilter(item, internalQuery);
    return JSON.stringify(item).toLowerCase().includes(internalQuery.toLowerCase());
  });

  return (
    <section className={`${styles.container}`} id={id}>
      {/* Cabeçalho da Tabela - Moderno e Bento */}
      <div className={styles.headerRow}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrapper} style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
              <Icon size={22} />
            </div>
            <div>
              <h2 className={styles.title}>{title}</h2>
              <p className={styles.subtitle}>Gerenciamento de dados em tempo real</p>
            </div>
          </div>
          <div className={styles.actionsGroup}>
            {addButtonText && onAddClick && (
              <Button 
                onClick={onAddClick} 
                theme={buttonTheme}
                variant={buttonVariant}
                size={buttonSize}
                icon={<Plus size={18} />}
              >
                {addButtonText}
              </Button>
            )}
          </div>
        </div>

        {enableSearch && (
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="search" 
                placeholder={searchPlaceholder} 
                value={internalQuery}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
            </div>
          </div>
        )}
      </div>


      {/* Corpo / Tabela */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color={themeColor} />
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
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
              {filteredData.length > 0 ? (
                filteredData.map((item, rowIdx) => (
                  <tr key={rowIdx}>
                    {columns.map((col, colIdx) => (
                      <td 
                        key={colIdx} 
                        data-label={col.header}
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
                  <td colSpan={columns.length} className={styles.emptyState}>
                    <div className={styles.emptyIconWrapper}>
                      <EmptyIcon size={48} />
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
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Página <strong>{pagination.currentPage}</strong> de {pagination.totalPages}
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.paginationBtn}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              title="Página Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className={styles.paginationBtn}
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
