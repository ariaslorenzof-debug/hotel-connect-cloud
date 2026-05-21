import { useEffect, useRef, useState } from 'react'
import { parseGuestRoomFromPath } from './guestScreenPath.ts'
import { useIncidents } from './context/IncidentsProvider.tsx'
import {
  CONFIRMATION_MESSAGES,
  GUEST_PAGE_COPY,
  isLanguageId,
  LANGUAGES,
  SERVICE_IDS,
  SERVICE_LABELS,
  type LanguageId,
  type ServiceId,
} from './guestScreenData.ts'
import { opsLog } from './services/opsLog'
import './GuestScreen.css'

function scrollConfirmationIntoView(element: HTMLElement) {
  element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
}

function scheduleConfirmationScroll(element: HTMLElement) {
  const frameId = requestAnimationFrame(() => {
    scrollConfirmationIntoView(element)
  })
  return () => window.cancelAnimationFrame(frameId)
}

export default function GuestScreen() {
  const room = parseGuestRoomFromPath()
  const { submitGuestRequest } = useIncidents()
  const [language, setLanguage] = useState<LanguageId | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null)
  const [requestSent, setRequestSent] = useState(false)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const displayLanguage = language ?? 'en'
  const copy = GUEST_PAGE_COPY[displayLanguage]

  useEffect(() => {
    if (!requestSent || !selectedService) return
    const element = confirmationRef.current
    if (!element) return
    return scheduleConfirmationScroll(element)
  }, [requestSent, selectedService])

  function handleLanguageSelect(id: LanguageId) {
    if (requestSent) return
    setLanguage(id)
    setSelectedService(null)
  }

  function handleServiceSelect(serviceId: ServiceId) {
    if (!language || requestSent || !room) return
    opsLog('SERVICE_SELECTED', { service: serviceId, room })
    setSelectedService(serviceId)
    setRequestSent(true)
    submitGuestRequest({
      room,
      language,
      service: serviceId,
      serviceLabel: SERVICE_LABELS[language][serviceId],
    })
  }

  if (!room) return null

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

        <section className="guest__card" aria-labelledby="guest-room">
          <p className="guest__eyebrow">{copy.eyebrow}</p>
          <p className="guest__room-label" id="guest-room">
            {copy.roomLabel}
          </p>
          <p className="guest__room-number" aria-label={`${copy.roomLabel} ${room}`}>
            {room}
          </p>
        </section>

        <section className="guest__card" aria-labelledby="guest-language">
          <h2 id="guest-language" className="guest__section-title">
            {copy.languageTitle}
          </h2>
          <ul className="guest__languages" role="list">
            {LANGUAGES.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={`guest__language${
                    language === option.id ? ' guest__language--selected' : ''
                  }`}
                  aria-pressed={language === option.id}
                  disabled={requestSent}
                  onClick={() => handleLanguageSelect(option.id)}
                >
                  <span className="guest__language-label">{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="guest__card guest__card--services"
          aria-labelledby="guest-services"
        >
          <h2 id="guest-services" className="guest__section-title">
            {copy.servicesTitle}
          </h2>

          {requestSent && selectedService && language ? (
            <div
              ref={confirmationRef}
              className="guest__confirmation"
              role="status"
              aria-live="polite"
              tabIndex={-1}
            >
              <p className="guest__confirmation-text">
                {CONFIRMATION_MESSAGES[language][selectedService]}
              </p>
            </div>
          ) : (
            <>
              <p className="guest__lead">{copy.servicesHint}</p>
              <ul className="guest__services" role="list">
                {SERVICE_IDS.map((serviceId) => (
                  <li key={serviceId}>
                    <button
                      type="button"
                      className="guest__service"
                      disabled={!language}
                      onClick={() => handleServiceSelect(serviceId)}
                    >
                      <span className="guest__service-label">
                        {language && isLanguageId(language)
                          ? SERVICE_LABELS[language][serviceId]
                          : SERVICE_LABELS.en[serviceId]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <p className="guest__footnote">Secure in-room assistance</p>
      </main>
    </div>
  )
}
