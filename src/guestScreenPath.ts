function normalizedPathname(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

/** Active only for `/guest/:room` (e.g. QR deep link). */
export function isGuestPath(): boolean {
  const path = normalizedPathname()
  return /^\/guest\/[^/]+$/.test(path)
}

/** Room from `/guest/:room` (e.g. 203). */
export function parseGuestRoomFromPath(): string | null {
  const path = normalizedPathname()
  const match = path.match(/^\/guest\/([^/]+)$/)
  if (!match) return null
  const room = decodeURIComponent(match[1]).trim()
  return room.length > 0 ? room : null
}
