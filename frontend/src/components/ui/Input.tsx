// Gabriel (Dev 1) — Componente Input inteligente e polimórfico
// Migrado para CSS Modules. Todas as funções de máscara e limpeza foram PRESERVADAS.
import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export type InputMaskType = 'phone' | 'currency' | 'none';

// Interface flexível para suportar input, select e textarea
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  as?: 'input' | 'select' | 'textarea';
  mask?: InputMaskType;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  label?: string;
  error?: string;
  rows?: number;
  asSelect?: boolean;
}

// ── Funções de Formatação (exportadas para uso externo) ──

export const formatPhone = (value: string) => {
  if (!value) return "";
  let digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    return digits.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  }
};

export const formatCurrency = (value: string | number) => {
  if (value === undefined || value === null) return "";
  const numericValue = typeof value === 'string' ? value.replace(/\D/g, "") : value.toString();
  const floatValue = (parseFloat(numericValue) || 0) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(floatValue);
};

/**
 * Converte "R$ 1.250,50" em um número float 1250.50 pronto para o banco.
 */
export const cleanCurrency = (value: string): number => {
  if (!value) return 0;
  const cleanValue = value
    .replace(/\D/g, "")
    .replace(/(\d+)(\d{2})$/, "$1.$2");
  return parseFloat(cleanValue) || 0;
};

/**
 * Remove parênteses, espaços e hifens do telefone para salvar apenas números.
 */
export const cleanPhone = (value: string): string => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

const Input = forwardRef<any, InputProps>(
  ({ as = 'input', mask = 'none', icon, rightElement, label, error, onChange, className, type, value, children, ...props }, ref) => {
    
    // Lógica de máscara de telefone e moeda no onChange
    const handleChange = (e: React.ChangeEvent<any>) => {
      if (!onChange) return;

      if (as === 'input' && mask === 'phone') {
        e.target.value = formatPhone(e.target.value);
      } else if (as === 'input' && mask === 'currency') {
        e.target.value = e.target.value.replace(/\D/g, "");
      }
      
      onChange(e);
    };

    // Bloqueia caracteres inválidos em inputs numéricos
    const handleKeyDown = (e: React.KeyboardEvent<any>) => {
      if (as === 'input' && type === 'number') {
        if (['e', 'E', '+', '-'].includes(e.key)) {
          e.preventDefault();
        }
      }
      if (props.onKeyDown) props.onKeyDown(e);
    };

    // Formata o valor de exibição para máscara de moeda
    let displayValue = value;
    if (as === 'input' && mask === 'currency' && value !== undefined) {
       const safeValue = Array.isArray(value) ? value[0] : value;
       displayValue = formatCurrency(safeValue as string | number);
    }

    // Renderiza o elemento correto (input, select ou textarea)
    const renderElement = () => {
      const commonProps = {
        ...props,
        ref,
        value: displayValue,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
      };

      if (as === 'select') {
        return (
          <select {...(commonProps as any)} className={className}>
            {children}
          </select>
        );
      }

      if (as === 'textarea') {
        return (
          <textarea {...(commonProps as any)} className={className} />
        );
      }

      return (
        <input
          {...(commonProps as any)}
          className={className}
          type={type === 'number' && mask === 'currency' ? 'text' : type}
        />
      );
    };

    // Classes do CSS Module compostas
    const groupClasses = [
      styles.inputGroup,
      icon ? styles.hasIcon : '',
      props.rightElement ? styles.hasRightElement : '',
      as === 'textarea' ? styles.isTextarea : '',
    ].filter(Boolean).join(' ');

    return (
      <div className={styles.formGroup}>
        {label && <label>{label}</label>}
        <div className={groupClasses}>
          {icon && <span className={`${styles.inputIcon} ${as === 'textarea' ? styles.iconAtTop : ''}`}>{icon}</span>}
          {renderElement()}
          {props.rightElement && <div className={styles.rightElement}>{props.rightElement}</div>}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
