import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useIncidents } from './context/IncidentsProvider.tsx'
import { opsLog } from './services/opsLog'
import './GuestScreen.css'

export function isGuestPath(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/guest'
}

type GuestStep = 'room' | 'language' | 'services'

type LanguageId = 'es' | 'en' | 'de' | 'fr'

type ServiceId =
  | 'towels'
  | 'cleaning'
  | 'air-conditioning'
  | 'maintenance'
  | 'pillows'
  | 'blankets'
  | 'other'

const LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
  { id: 'fr', label: 'Français' },
] as const

const SERVICE_IDS: ServiceId[] = [
  'towels',
  'cleaning',
  'air-conditioning',
  'maintenance',
  'pillows',
  'blankets',
  'other',
]

const SERVICE_LABELS: Record<LanguageId, Record<ServiceId, string>> = {
  es: {
    towels: 'Toallas',
    cleaning: 'Limpieza',
    'air-conditioning': 'Aire acondicionado',
    maintenance: 'Mantenimiento',
    pillows: 'Almohadas',
    blankets: 'Mantas',
    other: 'Otros',
  },
  en: {
    towels: 'Towels',
    cleaning: 'Cleaning',
    'air-conditioning': 'Air Conditioning',
    maintenance: 'Maintenance',
    pillows: 'Pillows',
    blankets: 'Blankets',
    other: 'Other',
  },
  de: {
    towels: 'Handtücher',
    cleaning: 'Reinigung',
    'air-conditioning': 'Klimaanlage',
    maintenance: 'Wartung',
    pillows: 'Kissen',
    blankets: 'Decken',
    other: 'Andere',
  },
  fr: {
    towels: 'Serviettes',
    cleaning: 'Nettoyage',
    'air-conditioning': 'Climatisation',
    maintenance: 'Maintenance',
    pillows: 'Oreillers',
    blankets: 'Couvertures',
    other: 'Autre',
  },
}

const CONFIRMATION_MESSAGES: Record<
  LanguageId,
  Record<ServiceId, string>
> = {
  es: {
    towels:
      'Solicitud enviada. En breve, el servicio de limpieza le facilitará las toallas.',
    cleaning:
      'Solicitud enviada. En breve, el equipo de limpieza atenderá su habitación.',
    'air-conditioning':
      'Solicitud enviada. En breve, mantenimiento revisará el aire acondicionado.',
    maintenance:
      'Solicitud enviada. En breve, el equipo de mantenimiento atenderá su incidencia.',
    pillows:
      'Solicitud enviada. En breve, el servicio de limpieza le facilitará almohadas.',
    blankets:
      'Solicitud enviada. En breve, el servicio de limpieza le facilitará mantas.',
    other:
      'Solicitud enviada. En breve, el equipo del hotel atenderá su solicitud.',
  },
  en: {
    towels: 'Request sent. Housekeeping will bring towels shortly.',
    cleaning: 'Request sent. Housekeeping will attend your room shortly.',
    'air-conditioning':
      'Request sent. Maintenance will check the air conditioning shortly.',
    maintenance:
      'Request sent. The maintenance team will assist you shortly.',
    pillows: 'Request sent. Housekeeping will bring pillows shortly.',
    blankets: 'Request sent. Housekeeping will bring blankets shortly.',
    other: 'Request sent. The hotel team will assist you shortly.',
  },
  de: {
    towels:
      'Anfrage gesendet. Der Reinigungsservice bringt Ihnen in Kürze Handtücher.',
    cleaning:
      'Anfrage gesendet. Das Reinigungsteam wird Ihr Zimmer in Kürze betreuen.',
    'air-conditioning':
      'Anfrage gesendet. Die Wartung wird die Klimaanlage in Kürze überprüfen.',
    maintenance:
      'Anfrage gesendet. Das Wartungsteam wird Ihnen in Kürze helfen.',
    pillows:
      'Anfrage gesendet. Der Reinigungsservice bringt Ihnen in Kürze Kissen.',
    blankets:
      'Anfrage gesendet. Der Reinigungsservice bringt Ihnen in Kürze Decken.',
    other:
      'Anfrage gesendet. Das Hotelteam wird Ihre Anfrage in Kürze bearbeiten.',
  },
  fr: {
    towels:
      'Demande envoyée. Le service de ménage vous apportera des serviettes sous peu.',
    cleaning:
      'Demande envoyée. L’équipe de ménage s’occupera bientôt de votre chambre.',
    'air-conditioning':
      'Demande envoyée. La maintenance vérifiera bientôt la climatisation.',
    maintenance:
      'Demande envoyée. L’équipe de maintenance vous assistera sous peu.',
    pillows:
      'Demande envoyée. Le service de ménage vous apportera des oreillers sous peu.',
    blankets:
      'Demande envoyée. Le service de ménage vous apportera des couvertures sous peu.',
    other:
      'Demande envoyée. L’équipe de l’hôtel traitera bientôt votre demande.',
  },
}

const SERVICES_COPY: Record<
  LanguageId,
  { title: string; lead: string; back: string }
> = {
  es: {
    title: 'Elige un servicio',
    lead: 'Selecciona lo que necesitas y el equipo del hotel te atenderá.',
    back: '← Cambiar idioma',
  },
  en: {
    title: 'Choose a service',
    lead: 'Select what you need and the hotel team will assist you.',
    back: '← Change language',
  },
  de: {
    title: 'Service wählen',
    lead: 'Wählen Sie, was Sie benötigen — unser Team hilft Ihnen gerne.',
    back: '← Sprache ändern',
  },
  fr: {
    title: 'Choisir un service',
    lead: 'Sélectionnez ce dont vous avez besoin — l’équipe de l’hôtel vous aidera.',
    back: '← Changer de langue',
  },
}

function isLanguageId(value: string | null): value is LanguageId {
  return value === 'es' || value === 'en' || value === 'de' || value === 'fr'
}

function getScrollContainer(node: HTMLElement): HTMLElement {
  let parent = node.parentElement
  while (parent) {
    const { overflowY } = getComputedStyle(parent)
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent
    }
    parent = parent.parentElement
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement
}

function scrollConfirmationIntoView(element: HTMLElement) {
  const viewport = window.visualViewport
  const viewportTop = viewport?.offsetTop ?? 0
  const viewportHeight = viewport?.height ?? window.innerHeight
  const padding = 20
  const rect = element.getBoundingClientRect()
  const scrollContainer = getScrollContainer(element)

  const bottomOverflow = rect.bottom - (viewportTop + viewportHeight) + padding
  const topOverflow = viewportTop + padding - rect.top

  const currentScroll = window.scrollY || scrollContainer.scrollTop
  let targetScroll = currentScroll

  if (bottomOverflow > 0) {
    targetScroll = currentScroll + bottomOverflow
  } else if (topOverflow > 0) {
    targetScroll = currentScroll - topOverflow
  }

  if (targetScroll !== currentScroll) {
    window.scrollTo({ top: targetScroll, left: 0, behavior: 'auto' })
    scrollContainer.scrollTop = targetScroll
  }

  element.scrollIntoView({ block: 'end', inline: 'nearest', behavior: 'auto' })
  element.focus({ preventScroll: true })
}

function scheduleConfirmationScroll(element: HTMLElement) {
  const run = () => scrollConfirmationIntoView(element)

  requestAnimationFrame(() => {
    requestAnimationFrame(run)
  })

  const delays = [0, 50, 150, 350]
  const timeoutIds = delays.map((delay) => window.setTimeout(run, delay))

  return () => {
    timeoutIds.forEach((id) => window.clearTimeout(id))
  }
}

export default function GuestScreen() {
  const { submitGuestRequest } = useIncidents()
  const [step, setStep] = useState<GuestStep>('room')
  const [roomNumber, setRoomNumber] = useState('')
  const [confirmedRoom, setConfirmedRoom] = useState('')
  const [language, setLanguage] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null)
  const [requestSent, setRequestSent] = useState(false)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const trimmedRoom = roomNumber.trim()
  const canContinue = trimmedRoom.length > 0

  function handleRoomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canContinue) return
    setConfirmedRoom(trimmedRoom)
    setStep('language')
  }

  function handleBackToRoom() {
    setStep('room')
    setLanguage(null)
    setSelectedService(null)
    setRequestSent(false)
  }

  function handleLanguageSelect(id: LanguageId) {
    setLanguage(id)
    setSelectedService(null)
    setRequestSent(false)
    setStep('services')
  }

  function handleBackToLanguage() {
    setStep('language')
    setSelectedService(null)
    setRequestSent(false)
  }

  const activeLanguage = isLanguageId(language) ? language : null
  const servicesCopy = activeLanguage ? SERVICES_COPY[activeLanguage] : null

  useEffect(() => {
    if (!requestSent || !selectedService) return
    const element = confirmationRef.current
    if (!element) return
    return scheduleConfirmationScroll(element)
  }, [requestSent, selectedService])

  function handleServiceSelect(serviceId: ServiceId) {
    if (!activeLanguage || requestSent) return

    opsLog('SERVICE_SELECTED', { service: serviceId, room: confirmedRoom })

    setSelectedService(serviceId)
    setRequestSent(true)

    submitGuestRequest({
      room: confirmedRoom,
      language: activeLanguage,
      service: serviceId,
      serviceLabel: SERVICE_LABELS[activeLanguage][serviceId],
    })
  }

  return (
    <div className="guest">
      <div className="guest__ambient" aria-hidden>
        <div className="guest__glow guest__glow--top" />
        <div className="guest__glow guest__glow--bottom" />
      </div>

      <main className="guest__main">
        <header className="guest__header">
          <div className="guest__brand-mark" aria-hidden>
            <span className="guest__brand-mark-inner">HC</span>
          </div>
          <h1 className="guest__title">Hotel Connect</h1>
        </header>

        {step === 'room' && (
          <section className="guest__card" aria-labelledby="guest-welcome">
            <p className="guest__eyebrow">Guest services</p>
            <h2 id="guest-welcome" className="guest__welcome">
              Welcome
            </h2>
            <p className="guest__lead">
              Enter your room number to connect with the hotel team.
            </p>

            <form className="guest__form" onSubmit={handleRoomSubmit} noValidate>
              <label className="guest__label" htmlFor="room-number">
                Room number
              </label>
              <input
                id="room-number"
                className="guest__input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="e.g. 1204"
                value={roomNumber}
                onChange={(event) => setRoomNumber(event.target.value)}
              />

              <button
                type="submit"
                className="guest__continue"
                disabled={!canContinue}
              >
                Continue
              </button>
            </form>
          </section>
        )}

        {step === 'language' && (
          <section className="guest__card" aria-labelledby="guest-language">
            <button
              type="button"
              className="guest__back"
              onClick={handleBackToRoom}
            >
              ← Room {confirmedRoom}
            </button>

            <p className="guest__eyebrow">Guest services</p>
            <h2 id="guest-language" className="guest__welcome">
              Choose your language
            </h2>
            <p className="guest__lead">
              Select how you would like to communicate with the hotel team.
            </p>

            <ul className="guest__languages" role="list">
              {LANGUAGES.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className={`guest__language${
                      language === option.id ? ' guest__language--selected' : ''
                    }`}
                    aria-pressed={language === option.id}
                    onClick={() => handleLanguageSelect(option.id)}
                  >
                    <span className="guest__language-label">{option.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 'services' && activeLanguage && servicesCopy && (
          <section
            className="guest__card guest__card--services"
            aria-labelledby="guest-services"
          >
            <button
              type="button"
              className="guest__back"
              onClick={handleBackToLanguage}
            >
              {servicesCopy.back}
            </button>

            <p className="guest__eyebrow">Guest services</p>
            <h2 id="guest-services" className="guest__welcome">
              {servicesCopy.title}
            </h2>
            <p className="guest__lead">{servicesCopy.lead}</p>

            <ul className="guest__services" role="list">
              {SERVICE_IDS.map((serviceId) => (
                <li key={serviceId}>
                  <button
                    type="button"
                    className={`guest__service${
                      selectedService === serviceId
                        ? ' guest__service--selected'
                        : ''
                    }`}
                    aria-pressed={selectedService === serviceId}
                    onClick={() => handleServiceSelect(serviceId)}
                    disabled={requestSent}
                  >
                    <span className="guest__service-label">
                      {SERVICE_LABELS[activeLanguage][serviceId]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {selectedService && requestSent && (
              <div
                ref={confirmationRef}
                className="guest__confirmation"
                role="status"
                aria-live="polite"
                tabIndex={-1}
              >
                <p className="guest__confirmation-text">
                  {CONFIRMATION_MESSAGES[activeLanguage][selectedService]}
                </p>
              </div>
            )}
          </section>
        )}

        <p className="guest__footnote">Secure in-room assistance</p>
      </main>
    </div>
  )
}
