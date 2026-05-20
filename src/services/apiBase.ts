/**
 * API origin for guest/dashboard requests.
 * - Empty: same-origin (unified Render web service: npm start serves dist + /api).
 * - Set VITE_API_BASE_URL at build time when frontend and backend are separate Render services.
 */
function normalizeBase(value: string | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('VITE_API_BASE_URL')) return ''
  return trimmed.replace(/\/$/, '')
}

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const fromWindow = normalizeBase(window.__HOTEL_CONNECT_API_BASE__)
    if (fromWindow) return fromWindow
  }
  return normalizeBase(import.meta.env.VITE_API_BASE_URL)
}

export function apiUrl(path: string): string {
  const base = getApiBase()
  return `${base}${path}`
}
