import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import './Auth.css';

interface AuthContainerProps {
  onLoginSuccess: (user: any) => void;
}

type AuthView = 'login' | 'register' | 'forgot-password';

const AuthContainer: React.FC<AuthContainerProps> = ({ onLoginSuccess }) => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <Login 
            onLoginSuccess={onLoginSuccess} 
            onNavigate={(view: AuthView) => setCurrentView(view)} 
          />
        );
      case 'register':
        return (
          <Register 
            onRegisterSuccess={(user) => onLoginSuccess(user)}
            onNavigate={(view: AuthView) => setCurrentView(view)} 
          />
        );
      case 'forgot-password':
        return (
          <ForgotPassword 
            onNavigate={(view: AuthView) => setCurrentView(view)} 
          />
        );
      default:
        return <Login onLoginSuccess={onLoginSuccess} onNavigate={() => setCurrentView('login')} />;
    }
  };

  return (
    <div className="auth-container">
      {renderView()}
    </div>
  );
};

export default AuthContainer;
