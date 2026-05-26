import { isLanguageId, type LanguageId } from './guestScreenData.ts'

const GUEST_LANGUAGE_STORAGE_KEY = 'hotel-connect:guest-language'

export function readStoredGuestLanguage(): LanguageId | null {
  try {
    const raw = window.localStorage.getItem(GUEST_LANGUAGE_STORAGE_KEY)
    return raw && isLanguageId(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeStoredGuestLanguage(language: LanguageId): void {
  try {
    window.localStorage.setItem(GUEST_LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Ignore quota / private mode errors.
  }
}
