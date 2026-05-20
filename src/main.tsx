import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { IncidentsProvider } from './context/IncidentsProvider.tsx'
import './index.css'
import App from './App.tsx'
import GuestScreen, { isGuestPath } from './GuestScreen.tsx'

function Root() {
  const [guestView, setGuestView] = useState(isGuestPath)

  useEffect(() => {
    const syncRoute = () => setGuestView(isGuestPath())
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  return guestView ? <GuestScreen /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IncidentsProvider>
      <Root />
    </IncidentsProvider>
  </StrictMode>,
)
