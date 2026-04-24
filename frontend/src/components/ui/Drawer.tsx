import React, { useEffect, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';

interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconBorder?: string;
  footer?: React.ReactNode;
}

export const Drawer = ({ 
  isOpen, onClose, title, subtitle, icon, iconBg, iconBorder,
  footer, children, className
}: DrawerProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay} 
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }}
            className={`${styles.drawer} ${className || ''}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerInfo}>
                {icon && (
                  <div 
                    className={styles.headerIcon}
                    style={{ 
                      background: iconBg || 'var(--bg-tertiary)', 
                      borderColor: iconBorder || 'var(--border-light)' 
                    }}
                  >
                    {icon}
                  </div>
                )}
                <div className={styles.headerTextGroup}>
                  {title && <h2 className={styles.title}>{title}</h2>}
                  {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
              </div>
              <button 
                className={styles.closeButton} 
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className={styles.content}>
              {children}
            </div>

            {/* Fixed Footer */}
            {footer && (
              <div className={styles.footer}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }

  return null;
};

