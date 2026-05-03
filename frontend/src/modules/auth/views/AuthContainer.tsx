// AuthContainer — Com animação de Swap (Framer Motion) e Theme Toggle
import React, { useState, useRef } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { Navigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import authBgLogin from '../../../assets/images/auth-bg.png';
import authBgRegister from '../../../assets/images/auth-register-bg.png'; 
import styles from './Auth.module.css';

interface AuthContainerProps {}

type AuthView = 'login' | 'register' | 'forgot-password';

const AuthContainer: React.FC<AuthContainerProps> = () => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const constraintsRef = useRef(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Define se o formulário deve estar na esquerda ou direita
  // Login e ForgotPassword na direita (padrão), Register na esquerda (swap)
  // Define o tema de cores baseado na view
  const theme = currentView === 'register' ? 'registerTheme' : currentView === 'login' ? 'loginTheme' : 'forgotPasswordTheme';
  const isReversed = currentView === 'register';

  // Lógica para trocar a imagem dependendo da view
  const currentImage = currentView === 'register' ? authBgRegister : authBgLogin;

  const renderView = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.15, // Mais rápido para evitar rastro
            ease: "easeOut" 
          }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          {currentView === 'login' && (
            <Login onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
          {currentView === 'register' && (
            <Register onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
          {currentView === 'forgot-password' && (
            <ForgotPassword onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div 
      className={`${styles.authContainer} ${styles[theme]}`} 
      ref={constraintsRef}
    >
      {/* ── Seletor de Tema Arrastável (UX Fun factor) ── */}
      <div className={styles.themeToggleWrapper}>
        <ThemeToggle />
      </div>

      <div className={styles.contentBox}>
        {renderView()}
      </div>
    </div>
  );
};

export default AuthContainer;
