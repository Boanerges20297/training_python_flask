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
  // TAB-01: Seleção
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  itemKey?: keyof T | ((item: T) => string | number);
}

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
  searchFilter,
  selectable,
  selectedItems = [],
  onSelectionChange,
  itemKey = 'id' as keyof T
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

  const getItemId = (item: T) => {
    if (typeof itemKey === 'function') return itemKey(item);
    return item[itemKey] as unknown as string | number;
  };

  const isSelected = (item: T) => {
    return selectedItems.some(i => getItemId(i) === getItemId(item));
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedItems.length === filteredData.length && filteredData.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredData);
    }
  };

  const toggleSelectItem = (item: T) => {
    if (!onSelectionChange) return;
    const isCurrentlySelected = isSelected(item);
    if (isCurrentlySelected) {
      onSelectionChange(selectedItems.filter(i => getItemId(i) !== getItemId(item)));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  return (
    <section className={styles.container} id={id}>
      {/* TAB-03: Posicionamento Padronizado */}
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
            {enableSearch && (
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
            )}
            
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
      </div>

      {loading ? (
        <div className={styles.loadingWrapper}>
          <Loader2 className="animate-spin" size={40} color={themeColor} />
          <p>Sincronizando dados...</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {selectable && (
                  <th className={styles.checkboxCell}>
                    <label className={styles.checkboxContainer}>
                      <input 
                        type="checkbox" 
                        checked={filteredData.length > 0 && selectedItems.length === filteredData.length}
                        onChange={toggleSelectAll}
                      />
                      <span className={styles.checkmark}></span>
                    </label>
                  </th>
                )}
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
                  <tr key={rowIdx} className={isSelected(item) ? styles.rowSelected : ''}>
                    {selectable && (
                      <td className={styles.checkboxCell}>
                        <label className={styles.checkboxContainer}>
                          <input 
                            type="checkbox" 
                            checked={isSelected(item)}
                            onChange={() => toggleSelectItem(item)}
                          />
                          <span className={styles.checkmark}></span>
                        </label>
                      </td>
                    )}
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
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.emptyState}>
                    <div className={styles.emptyStateContent}>
                      <div className={styles.emptyIconWrapper}>
                        <EmptyIcon size={64} />
                      </div>
                      <h3>Nenhum resultado</h3>
                      <p>{emptyStateText}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando página <strong>{pagination.currentPage}</strong> de {pagination.totalPages}
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.paginationBtn}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={styles.paginationBtn}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DataTable;
