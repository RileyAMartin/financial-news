import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import { TerminalProvider } from './context/TerminalContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TerminalProvider>
      <App />
    </TerminalProvider>
  </StrictMode>,
)
