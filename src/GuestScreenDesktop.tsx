import { useEffect, useRef, useState, type FormEvent } from 'react'
import { parseGuestRoomFromPath } from './GuestScreen.tsx'
import { useIncidents } from './context/IncidentsProvider.tsx'
import {
  CONFIRMATION_MESSAGES,
  isLanguageId,
  LANGUAGES,
  SEND_REQUEST_LABEL,
  SERVICE_IDS,
  SERVICE_LABELS,
  SERVICES_COPY,
  type GuestStep,
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

export default function GuestScreenDesktop() {
  const { submitGuestRequest } = useIncidents()
  const urlRoom = parseGuestRoomFromPath()
  const [step, setStep] = useState<GuestStep>(() => (urlRoom ? 'language' : 'room'))
  const [roomNumber, setRoomNumber] = useState(() => urlRoom ?? '')
  const [confirmedRoom, setConfirmedRoom] = useState(() => urlRoom ?? '')
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
  }

  function handleSendRequest() {
    if (!activeLanguage || !selectedService || requestSent) return

    setRequestSent(true)
    submitGuestRequest({
      room: confirmedRoom,
      language: activeLanguage,
      service: selectedService,
      serviceLabel: SERVICE_LABELS[activeLanguage][selectedService],
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

            {selectedService && !requestSent && (
              <button
                type="button"
                className="guest__continue guest__send-request"
                onClick={handleSendRequest}
              >
                {SEND_REQUEST_LABEL[activeLanguage]}
              </button>
            )}

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
