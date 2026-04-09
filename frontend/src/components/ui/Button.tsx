import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'normal' |'danger' | 'ghost';
  theme?: 'blue' | 'green' | 'purple' | 'amber' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      theme = 'blue',
      size = 'md',
      isLoading = false,
      icon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Agrupa as classes: base, variant, theme e modifiers
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const themeClass = `theme-${theme}`;
    const sizeClass = `btn-${size}`;
    const widthClass = fullWidth ? 'w-full' : '';
    const loadingClass = isLoading ? 'is-loading' : '';

    const combinedClassName = [
      baseClass,
      variantClass,
      themeClass,
      sizeClass,
      widthClass,
      loadingClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          icon && <span className="btn-icon">{icon}</span>
        )}
        <span className="btn-text">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
