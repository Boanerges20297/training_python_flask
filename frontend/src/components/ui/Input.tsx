// Gabriel (Dev 1) - Componente Input inteligente e polimórfico
import React, { forwardRef } from 'react';
import './Input.css';

export type InputMaskType = 'phone' | 'currency' | 'none';

// # Gabriel (Dev 1) - Interface flexível para suportar input, select e textarea
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  as?: 'input' | 'select' | 'textarea';
  mask?: InputMaskType;
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  rows?: number;
  asSelect?: boolean; // Prop auxiliar para garantir cast de tipo se necessário
}

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
  // Remove R$, pontos e troca vírgula por ponto
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
  ({ as = 'input', mask = 'none', icon, label, error, onChange, className, type, value, children, ...props }, ref) => {
    
    const handleChange = (e: React.ChangeEvent<any>) => {
      if (!onChange) return;

      if (as === 'input' && mask === 'phone') {
        e.target.value = formatPhone(e.target.value);
      } else if (as === 'input' && mask === 'currency') {
        e.target.value = e.target.value.replace(/\D/g, "");
      }
      
      onChange(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<any>) => {
      if (as === 'input' && type === 'number') {
        if (['e', 'E', '+', '-'].includes(e.key)) {
          e.preventDefault();
        }
      }
      if (props.onKeyDown) props.onKeyDown(e);
    };

    let displayValue = value;
    if (as === 'input' && mask === 'currency' && value !== undefined) {
       const safeValue = Array.isArray(value) ? value[0] : value;
       displayValue = formatCurrency(safeValue as string | number);
    }

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

    return (
      <div className={`form-group-modern ${className || ''}`}>
        {label && <label>{label}</label>}
        <div className={`input-group-modern ${icon ? 'has-icon' : ''} ${as === 'textarea' ? 'is-textarea' : ''}`}>
          {icon && <span className={`input-icon ${as === 'textarea' ? 'at-top' : ''}`}>{icon}</span>}
          {renderElement()}
        </div>
        {error && <span style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '4px' }}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
