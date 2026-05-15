// AuthContainer — Com animação de Swap (Framer Motion) e Theme Toggle
import React, { useState, useRef } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import authBgLogin from '../../../assets/images/auth-bg.png';
import authBgRegister from '../../../assets/images/auth-register-bg.png'; 
import styles from './Auth.module.css';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
  // isReversed and currentImage reserved for future layout swap animation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _isReversed = currentView === 'register';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _currentImage = currentView === 'register' ? authBgRegister : authBgLogin;

  const renderView = () => {
    return (
      <AnimatePresence mode="wait">
    
          {currentView === 'login' && (
            <Login onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
          {currentView === 'register' && (
            <Register onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
          {currentView === 'forgot-password' && (
            <ForgotPassword onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
      </AnimatePresence>
    );
  };

  return (
    <div 
      className={`${styles.authContainer} ${styles[theme]}`} 
      ref={constraintsRef}
    >

      <div className={styles.contentBox}>
        {renderView()}
      </div>
    </div>
  );
};

export default AuthContainer;
