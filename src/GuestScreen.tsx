import { useEffect, useState } from 'react'
import GuestScreenDesktop from './GuestScreenDesktop.tsx'
import GuestScreenMobile from './GuestScreenMobile.tsx'

function normalizedPathname(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export function isGuestPath(): boolean {
  const path = normalizedPathname()
  return path === '/guest' || /^\/guest\/[^/]+$/.test(path)
}

/** Room from `/guest/:roomNumber` (e.g. QR); null on `/guest` alone. */
export function parseGuestRoomFromPath(): string | null {
  const path = normalizedPathname()
  const match = path.match(/^\/guest\/([^/]+)$/)
  if (!match) return null
  const room = decodeURIComponent(match[1]).trim()
  return room.length > 0 ? room : null
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
