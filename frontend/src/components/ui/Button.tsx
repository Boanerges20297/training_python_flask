// Gabriel (Dev 1) — Componente Button com CSS Modules
// Mesma interface pública de antes, agora consumindo Design Tokens
import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'normal' | 'danger' | 'ghost';
  theme?: 'blue' | 'green' | 'purple' | 'amber' | 'slate' | 'red';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

// Mapas de lookup para converter props em classes do CSS Module
const variantMap: Record<string, string> = {
  primary: styles.btnPrimary,
  secondary: styles.btnSecondary,
  normal: styles.btnNormal,
  danger: styles.btnDanger,
  ghost: styles.btnGhost,
};

const themeMap: Record<string, string> = {
  blue: styles.themeBlue,
  purple: styles.themePurple,
  green: styles.themeGreen,
  amber: styles.themeAmber,
  red: styles.themeRed,
  slate: styles.themeSlate,
};

const sizeMap: Record<string, string> = {
  sm: styles.btnSm,
  md: styles.btnMd,
  lg: styles.btnLg,
};

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
    // Monta a string de classes usando o CSS Module
    const combinedClassName = [
      styles.btn,
      variantMap[variant],
      themeMap[theme],
      sizeMap[size],
      fullWidth ? styles.wFull : '',
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
          icon && <span className={styles.btnIcon}>{icon}</span>
        )}
        <span className={styles.btnText}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
