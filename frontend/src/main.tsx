import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './assets/styles/tokens.css'
import './index.css'
import './components/ui/Input.css'  // Estilos legados para modais — remover ao migrar para Drawers
import App from './App.tsx'
import { ToastProvider } from './components/ui/Toast.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { ThemeProvider } from './components/providers/ThemeProvider.tsx'

async function enableMocking() {
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'warn' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>,
  )
})
