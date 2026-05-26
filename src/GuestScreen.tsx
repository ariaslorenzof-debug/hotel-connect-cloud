import { useEffect, useRef, useState } from 'react'
import { parseGuestRoomFromPath } from './guestScreenPath.ts'
import { useIncidents } from './context/IncidentsProvider.tsx'
import {
  writeStoredGuestLanguage,
} from './guestLanguageStorage.ts'
import {
  CONFIRMATION_MESSAGES,
  GUEST_PAGE_COPY,
  PRE_LANGUAGE_COPY,
  LANGUAGES,
  SERVICE_IDS,
  SERVICE_LABELS,
  type LanguageId,
  type ServiceId,
} from './guestScreenData.ts'
import { opsLog } from './services/opsLog'
import './GuestScreen.css'

type GuestStep = 'language' | 'services' | 'detail' | 'confirmation'

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
  const [step, setStep] = useState<GuestStep>('language')
  const [language, setLanguage] = useState<LanguageId | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null)
  const [optionalMessage, setOptionalMessage] = useState('')
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const localizedCopy = language ? GUEST_PAGE_COPY[language] : null
  const roomCopy = localizedCopy ?? PRE_LANGUAGE_COPY
  const footnote = localizedCopy?.footnote ?? PRE_LANGUAGE_COPY.footnote

  useEffect(() => {
    if (step !== 'confirmation' || !selectedService) return
    const element = confirmationRef.current
    if (!element) return
    return scheduleConfirmationScroll(element)
  }, [step, selectedService, referenceNumber])

  function handleLanguageSelect(id: LanguageId) {
    if (isSubmitting || step === 'confirmation') return
    setLanguage(id)
    writeStoredGuestLanguage(id)
    setSelectedService(null)
    setOptionalMessage('')
    setReferenceNumber(null)
    setStep('services')
  }

  function handleServiceSelect(serviceId: ServiceId) {
    if (!language || isSubmitting || step === 'confirmation') return
    opsLog('SERVICE_SELECTED', { service: serviceId, room, language })
    setSelectedService(serviceId)
    setOptionalMessage('')
    setStep('detail')
  }

  function handleBackToServices() {
    if (isSubmitting || step === 'confirmation') return
    setSelectedService(null)
    setOptionalMessage('')
    setStep('services')
  }

  async function handleSendRequest() {
    if (!language || !selectedService || !room || isSubmitting) return

    setIsSubmitting(true)
    const trimmedMessage = optionalMessage.trim()

    try {
      const incident = await submitGuestRequest({
        room,
        language,
        service: selectedService,
        serviceLabel: SERVICE_LABELS[language][selectedService],
        optionalMessage: trimmedMessage || undefined,
      })

      if (incident) {
        setReferenceNumber(incident.id)
        opsLog('GUEST_REQUEST_SENT', {
          referenceNumber: incident.id,
          room,
          language,
          service: selectedService,
          department: incident.department,
          createdAt: incident.createdAt,
        })
      }

      setStep('confirmation')
    } finally {
      setIsSubmitting(false)
    }
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
          <p className="guest__eyebrow">{roomCopy.eyebrow}</p>
          <p className="guest__room-label" id="guest-room">
            {roomCopy.roomLabel}
          </p>
          <p className="guest__room-number" aria-label={`${roomCopy.roomLabel} ${room}`}>
            {room}
          </p>
        </section>

        {step === 'language' ? (
          <section className="guest__card" aria-labelledby="guest-language">
            <h2 id="guest-language" className="guest__section-title">
              {PRE_LANGUAGE_COPY.languageTitle}
            </h2>
            <ul className="guest__languages" role="list">
              {LANGUAGES.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className="guest__language"
                    onClick={() => handleLanguageSelect(option.id)}
                  >
                    <span className="guest__language-label">{option.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === 'services' && language && localizedCopy ? (
          <section
            className="guest__card guest__card--services"
            aria-labelledby="guest-services"
          >
            <h2 id="guest-services" className="guest__section-title">
              {localizedCopy.servicesTitle}
            </h2>
            <p className="guest__lead">{localizedCopy.servicesHint}</p>
            <ul className="guest__services" role="list">
              {SERVICE_IDS.map((serviceId) => (
                <li key={serviceId}>
                  <button
                    type="button"
                    className="guest__service"
                    onClick={() => handleServiceSelect(serviceId)}
                  >
                    <span className="guest__service-label">
                      {SERVICE_LABELS[language][serviceId]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === 'detail' && language && localizedCopy && selectedService ? (
          <section className="guest__card" aria-labelledby="guest-detail">
            <h2 id="guest-detail" className="guest__section-title">
              {localizedCopy.detailTitle}
            </h2>
            <p className="guest__lead">
              {SERVICE_LABELS[language][selectedService]}
            </p>
            <label className="guest__field" htmlFor="guest-message">
              <span className="guest__field-label">{localizedCopy.messageLabel}</span>
              <textarea
                id="guest-message"
                className="guest__textarea"
                rows={4}
                value={optionalMessage}
                disabled={isSubmitting}
                placeholder={localizedCopy.messagePlaceholder}
                onChange={(event) => setOptionalMessage(event.target.value)}
              />
            </label>
            <div className="guest__actions">
              <button
                type="button"
                className="guest__action guest__action--secondary"
                disabled={isSubmitting}
                onClick={handleBackToServices}
              >
                {localizedCopy.backToServices}
              </button>
              <button
                type="button"
                className="guest__action guest__action--primary"
                disabled={isSubmitting}
                onClick={() => void handleSendRequest()}
              >
                {localizedCopy.sendRequest}
              </button>
            </div>
          </section>
        ) : null}

        {step === 'confirmation' && language && localizedCopy && selectedService ? (
          <section
            className="guest__card guest__card--services"
            aria-labelledby="guest-confirmation"
          >
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
              {referenceNumber ? (
                <p className="guest__reference">
                  <span className="guest__reference-label">
                    {localizedCopy.referenceLabel}
                  </span>
                  <span className="guest__reference-value">{referenceNumber}</span>
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <p className="guest__footnote">{footnote}</p>
      </main>
    </div>
  )
}
