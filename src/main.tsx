import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ConfirmProvider } from './components/ui/ConfirmDialog'
import './index.css'

// Dev-only render studio for generating gallery stills (see src/dev/RenderStudio.tsx).
if (import.meta.env.DEV && location.pathname === '/__studio') {
  import('./dev/RenderStudio').then(({ default: Studio }) => createRoot(document.getElementById('root')!).render(<Studio />))
} else {
// The shareable single-file build runs inside a sandboxed viewer, so routing
// stays in memory instead of the address bar.
const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : BrowserRouter
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </Router>
  </StrictMode>,
)
}
