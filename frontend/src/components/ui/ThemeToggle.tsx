import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeContext } from '../providers/ThemeProvider';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeContext();

  return (
    <div className={styles.container}>
      <div className={styles.toggleWrapper}>
        {/* Background deslizante */}
        <motion.div 
          className={styles.slider}
          animate={{ x: theme === 'light' ? 0 : 36 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        <button
          className={`${styles.button} ${theme === 'light' ? styles.active : ''}`}
          onClick={() => setTheme('light')}
          aria-label="Tema claro"
        >
          <motion.div
            animate={{ 
              rotate: theme === 'light' ? 0 : 90,
              scale: theme === 'light' ? 1.1 : 0.9,
              color: theme === 'light' ? '#f59e0b' : '#94a3b8'
            }}
          >
            <Sun size={18} />
          </motion.div>
        </button>

        <button
          className={`${styles.button} ${theme === 'dark' ? styles.active : ''}`}
          onClick={() => setTheme('dark')}
          aria-label="Tema escuro"
        >
          <motion.div
            animate={{ 
              rotate: theme === 'dark' ? 0 : -90,
              scale: theme === 'dark' ? 1.1 : 0.9,
              color: theme === 'dark' ? '#6366f1' : '#94a3b8'
            }}
          >
            <Moon size={18} />
          </motion.div>
        </button>
      </div>
    </div>
  );
}

