// Gabriel (Dev 1) - Componente Input inteligente
import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import './Input.css';

export type InputMaskType = 'phone' | 'currency' | 'none';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mask?: InputMaskType;
  icon?: React.ReactNode;
  label?: string;
  error?: string;
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

export const extractCurrencyValue = (formattedString: string) => {
  return (parseFloat(formattedString.replace(/\D/g, "")) || 0) / 100;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ mask = 'none', icon, label, error, onChange, className, type, value, ...props }, ref) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;

      if (mask === 'phone') {
        e.target.value = formatPhone(e.target.value);
      } else if (mask === 'currency') {
        const numericStr = e.target.value.replace(/\D/g, "");
        e.target.value = numericStr; // Envia os digitos brutos por baixo dos panos na string
      }
      
      onChange(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Bloqueio rigoroso para inputs do tipo numero (evita "e", "-", "+")
      if (type === 'number') {
        if (['e', 'E', '+', '-'].includes(e.key)) {
          e.preventDefault();
        }
      }
      // Se tiver prop onKeyDown definida nativamente
      if (props.onKeyDown) props.onKeyDown(e);
    };

    // Resoluçao visual de valor (para currency)
    let displayValue = value;
    if (mask === 'currency' && value !== undefined) {
       // Garantimos que value seja string ou number para a função formatCurrency
       const safeValue = Array.isArray(value) ? value[0] : value;
       displayValue = formatCurrency(safeValue as string | number);
    }

    return (
      <div className={`form-group-modern ${className || ''}`}>
        {label && <label>{label}</label>}
        <div className={`input-group-modern ${icon ? 'has-icon' : ''}`}>
          {icon && <span className="input-icon">{icon}</span>}
          <input
            {...props}
            ref={ref}
            type={type === 'number' && mask === 'currency' ? 'text' : type} // Currency mask precisa de type="text"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        {error && <span style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '4px' }}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Gabriel (Dev 1) - Componente Input inteligente exportado por default
export default Input;
