// Select — Componente de seleção estilizado com suporte a ícones
import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, icon, label, error, placeholder = 'Selecione...', className, ...props }, ref) => {
    const wrapperClasses = [
      styles.selectWrapper,
      icon ? styles.hasIcon : '',
    ].filter(Boolean).join(' ');

    return (
      <div className={styles.formGroup}>
        {label && <label>{label}</label>}
        <div className={wrapperClasses}>
          {icon && <span className={styles.selectIcon}>{icon}</span>}
          <select
            ref={ref}
            className={`${styles.selectElement} ${className || ''}`}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={styles.chevron}>
            <ChevronDown size={16} />
          </span>
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
