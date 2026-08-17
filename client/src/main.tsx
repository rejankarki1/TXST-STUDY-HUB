import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { AppProvider } from '@/state/AppState'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster
          position="bottom-right"
          mobileOffset={{ top: 12 }}
          toastOptions={{
            className:
              'rounded-lg! border! border-border! bg-surface! text-foreground! text-[13px]! shadow-md!',
          }}
        />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
