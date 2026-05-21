import { useEffect, useState } from 'react'
import GuestScreenDesktop from './GuestScreenDesktop.tsx'
import GuestScreenMobile from './GuestScreenMobile.tsx'

export function isGuestPath(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/guest'
}

function useGuestMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isMobile
}

export default function GuestScreen() {
  const isMobile = useGuestMobileViewport()
  return isMobile ? <GuestScreenMobile /> : <GuestScreenDesktop />
}
