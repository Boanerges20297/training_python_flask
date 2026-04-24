import React, { type HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = ({ className, children, ...props }: CardProps) => (
  <div className={`${styles.card} ${className || ''}`} {...props}>
    {children}
  </div>
);

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export const CardHeader = ({ className, title, description, children, ...props }: CardHeaderProps) => (
  <div className={`${styles.header} ${className || ''}`} {...props}>
    {title && <h3 className={styles.title}>{title}</h3>}
    {description && <p className={styles.description}>{description}</p>}
    {children}
  </div>
);

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.content} ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.footer} ${className || ''}`} {...props}>
    {children}
  </div>
);
