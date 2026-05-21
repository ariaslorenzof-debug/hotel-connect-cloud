import { useState, type FormEvent } from 'react'
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
import './GuestScreenMobile.css'

export default function GuestScreenMobile() {
  const { submitGuestRequest } = useIncidents()
  const urlRoom = parseGuestRoomFromPath()
  const [step, setStep] = useState<GuestStep>(() => (urlRoom ? 'language' : 'room'))
  const [roomNumber, setRoomNumber] = useState(() => urlRoom ?? '')
  const [confirmedRoom, setConfirmedRoom] = useState(() => urlRoom ?? '')
  const [language, setLanguage] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null)
  const [requestSent, setRequestSent] = useState(false)

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
    <div className="guest-m">
      <header className="guest-m__header">
        <h1 className="guest-m__title">Hotel Connect</h1>
      </header>

      <main className="guest-m__main">
        {step === 'room' && (
          <section className="guest-m__section" aria-labelledby="guest-m-room">
            <h2 id="guest-m-room" className="guest-m__heading">
              Room number
            </h2>
            <p className="guest-m__text">
              Enter your room number to request hotel services.
            </p>

            <form onSubmit={handleRoomSubmit} noValidate>
              <label className="guest-m__label" htmlFor="guest-m-room-input">
                Room
              </label>
              <input
                id="guest-m-room-input"
                className="guest-m__input"
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
                className="guest-m__btn guest-m__btn--primary"
                disabled={!canContinue}
              >
                Continue
              </button>
            </form>
          </section>
        )}

        {step === 'language' && (
          <section className="guest-m__section" aria-labelledby="guest-m-lang">
            <button
              type="button"
              className="guest-m__btn guest-m__btn--back"
              onClick={handleBackToRoom}
            >
              ← Room {confirmedRoom}
            </button>
            <h2 id="guest-m-lang" className="guest-m__heading">
              Language
            </h2>
            <p className="guest-m__text">Choose your language.</p>

            <ul className="guest-m__list">
              {LANGUAGES.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className="guest-m__btn"
                    onClick={() => handleLanguageSelect(option.id)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 'services' && activeLanguage && servicesCopy && (
          <section className="guest-m__section" aria-labelledby="guest-m-svc">
            <button
              type="button"
              className="guest-m__btn guest-m__btn--back"
              onClick={handleBackToLanguage}
            >
              {servicesCopy.back}
            </button>
            <h2 id="guest-m-svc" className="guest-m__heading">
              {servicesCopy.title}
            </h2>
            <p className="guest-m__text">{servicesCopy.lead}</p>

            <ul className="guest-m__list">
              {SERVICE_IDS.map((serviceId) => (
                <li key={serviceId}>
                  <button
                    type="button"
                    className={`guest-m__btn${
                      selectedService === serviceId ? ' guest-m__btn--selected' : ''
                    }`}
                    aria-pressed={selectedService === serviceId}
                    onClick={() => handleServiceSelect(serviceId)}
                    disabled={requestSent}
                  >
                    {SERVICE_LABELS[activeLanguage][serviceId]}
                  </button>
                </li>
              ))}
            </ul>

            {selectedService && !requestSent && (
              <button
                type="button"
                className="guest-m__btn guest-m__btn--primary guest-m__btn--send"
                onClick={handleSendRequest}
              >
                {SEND_REQUEST_LABEL[activeLanguage]}
              </button>
            )}

            {selectedService && requestSent && (
              <div className="guest-m__confirm" role="status" aria-live="polite">
                <p>{CONFIRMATION_MESSAGES[activeLanguage][selectedService]}</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
