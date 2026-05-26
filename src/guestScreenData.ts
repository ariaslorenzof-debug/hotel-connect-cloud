export type LanguageId = 'es' | 'en' | 'de' | 'fr'

export type ServiceId =
  | 'towels'
  | 'cleaning'
  | 'pillows'
  | 'blanket'
  | 'air-conditioning'
  | 'noise'
  | 'maintenance'
  | 'minibar'
  | 'other'

export const LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
  { id: 'fr', label: 'Français' },
] as const

/** Guest-facing service order (QR services panel). */
export const SERVICE_IDS: ServiceId[] = [
  'towels',
  'cleaning',
  'pillows',
  'blanket',
  'air-conditioning',
  'noise',
  'maintenance',
  'minibar',
  'other',
]

export const SERVICE_LABELS: Record<LanguageId, Record<ServiceId, string>> = {
  es: {
    towels: 'Toallas',
    cleaning: 'Limpieza',
    pillows: 'Almohadas',
    blanket: 'Manta',
    'air-conditioning': 'Aire acondicionado',
    noise: 'Ruido',
    maintenance: 'Mantenimiento',
    minibar: 'Minibar',
    other: 'Otros',
  },
  en: {
    towels: 'Towels',
    cleaning: 'Cleaning',
    pillows: 'Pillows',
    blanket: 'Blanket',
    'air-conditioning': 'Air Conditioning',
    noise: 'Noise',
    maintenance: 'Maintenance',
    minibar: 'Minibar',
    other: 'Other',
  },
  de: {
    towels: 'Handtücher',
    cleaning: 'Reinigung',
    pillows: 'Kissen',
    blanket: 'Decke',
    'air-conditioning': 'Klimaanlage',
    noise: 'Lärm',
    maintenance: 'Wartung',
    minibar: 'Minibar',
    other: 'Andere',
  },
  fr: {
    towels: 'Serviettes',
    cleaning: 'Nettoyage',
    pillows: 'Oreillers',
    blanket: 'Couverture',
    'air-conditioning': 'Climatisation',
    noise: 'Bruit',
    maintenance: 'Maintenance',
    minibar: 'Minibar',
    other: 'Autre',
  },
}

export const CONFIRMATION_MESSAGES: Record<
  LanguageId,
  Record<ServiceId, string>
> = {
  es: {
    towels:
      'Solicitud enviada. En breve, el servicio de limpieza le facilitará las toallas.',
    cleaning:
      'Solicitud enviada. En breve, el equipo de limpieza atenderá su habitación.',
    pillows:
      'Solicitud enviada. En breve, el servicio de limpieza le facilitará almohadas.',
    blanket:
      'Solicitud enviada. En breve, el servicio de limpieza le facilitará una manta.',
    'air-conditioning':
      'Solicitud enviada. En breve, mantenimiento revisará el aire acondicionado.',
    noise:
      'Solicitud enviada. En breve, el equipo del hotel atenderá su aviso de ruido.',
    maintenance:
      'Solicitud enviada. En breve, el equipo de mantenimiento atenderá su incidencia.',
    minibar:
      'Solicitud enviada. En breve, el equipo del hotel atenderá su solicitud de minibar.',
    other:
      'Solicitud enviada. En breve, el equipo del hotel atenderá su solicitud.',
  },
  en: {
    towels: 'Request sent. Housekeeping will bring towels shortly.',
    cleaning: 'Request sent. Housekeeping will attend your room shortly.',
    pillows: 'Request sent. Housekeeping will bring pillows shortly.',
    blanket: 'Request sent. Housekeeping will bring a blanket shortly.',
    'air-conditioning':
      'Request sent. Maintenance will check the air conditioning shortly.',
    noise: 'Request sent. The hotel team will address the noise concern shortly.',
    maintenance:
      'Request sent. The maintenance team will assist you shortly.',
    minibar: 'Request sent. The hotel team will attend your minibar request shortly.',
    other: 'Request sent. The hotel team will assist you shortly.',
  },
  de: {
    towels:
      'Anfrage gesendet. Der Reinigungsservice bringt Ihnen in Kürze Handtücher.',
    cleaning:
      'Anfrage gesendet. Das Reinigungsteam wird Ihr Zimmer in Kürze betreuen.',
    pillows:
      'Anfrage gesendet. Der Reinigungsservice bringt Ihnen in Kürze Kissen.',
    blanket:
      'Anfrage gesendet. Der Reinigungsservice bringt Ihnen in Kürze eine Decke.',
    'air-conditioning':
      'Anfrage gesendet. Die Wartung wird die Klimaanlage in Kürze überprüfen.',
    maintenance:
      'Anfrage gesendet. Das Wartungsteam wird Ihnen in Kürze helfen.',
    noise:
      'Anfrage gesendet. Das Hotelteam wird sich in Kürze um die Lärmbelästigung kümmern.',
    minibar:
      'Anfrage gesendet. Das Hotelteam wird Ihre Minibar-Anfrage in Kürze bearbeiten.',
    other:
      'Anfrage gesendet. Das Hotelteam wird Ihre Anfrage in Kürze bearbeiten.',
  },
  fr: {
    towels:
      'Demande envoyée. Le service de ménage vous apportera des serviettes sous peu.',
    cleaning:
      'Demande envoyée. L’équipe de ménage s’occupera bientôt de votre chambre.',
    pillows:
      'Demande envoyée. Le service de ménage vous apportera des oreillers sous peu.',
    blanket:
      'Demande envoyée. Le service de ménage vous apportera une couverture sous peu.',
    'air-conditioning':
      'Demande envoyée. La maintenance vérifiera bientôt la climatisation.',
    noise:
      'Demande envoyée. L’équipe de l’hôtel traitera bientôt votre signalement de bruit.',
    maintenance:
      'Demande envoyée. L’équipe de maintenance vous assistera sous peu.',
    minibar:
      'Demande envoyée. L’équipe de l’hôtel traitera bientôt votre demande minibar.',
    other:
      'Demande envoyée. L’équipe de l’hôtel traitera bientôt votre demande.',
  },
}

/** Shown on the first (language) step before a language is chosen. */
export const PRE_LANGUAGE_COPY = {
  eyebrow: 'Guest services',
  roomLabel: 'Room',
  languageTitle: 'Choose your language',
  footnote: 'Secure in-room assistance',
}

export const GUEST_PAGE_COPY: Record<
  LanguageId,
  {
    eyebrow: string
    roomLabel: string
    languageTitle: string
    servicesTitle: string
    servicesHint: string
    detailTitle: string
    messageLabel: string
    messagePlaceholder: string
    sendRequest: string
    backToServices: string
    referenceLabel: string
    footnote: string
  }
> = {
  es: {
    eyebrow: 'Servicios para huéspedes',
    roomLabel: 'Habitación',
    languageTitle: 'Idioma',
    servicesTitle: 'Servicios',
    servicesHint: 'Selecciona el servicio que necesitas.',
    detailTitle: 'Detalle de la solicitud',
    messageLabel: 'Mensaje adicional (opcional)',
    messagePlaceholder:
      'Ej.: solo quedaba una toalla, necesito dos toallas extra, el aire no enfría…',
    sendRequest: 'Enviar solicitud',
    backToServices: 'Volver a servicios',
    referenceLabel: 'Número de referencia',
    footnote: 'Asistencia segura en la habitación',
  },
  en: {
    eyebrow: 'Guest services',
    roomLabel: 'Room',
    languageTitle: 'Language',
    servicesTitle: 'Services',
    servicesHint: 'Tap the service you need.',
    detailTitle: 'Request details',
    messageLabel: 'Additional message (optional)',
    messagePlaceholder:
      'e.g. only one towel left, need two extra towels, AC not cooling…',
    sendRequest: 'Send request',
    backToServices: 'Back to services',
    referenceLabel: 'Reference number',
    footnote: 'Secure in-room assistance',
  },
  de: {
    eyebrow: 'Gästeservice',
    roomLabel: 'Zimmer',
    languageTitle: 'Sprache',
    servicesTitle: 'Services',
    servicesHint: 'Tippen Sie auf den gewünschten Service.',
    detailTitle: 'Anfragedetails',
    messageLabel: 'Zusätzliche Nachricht (optional)',
    messagePlaceholder:
      'z. B. nur ein Handtuch übrig, zwei extra Handtücher, Klima kühlt nicht…',
    sendRequest: 'Anfrage senden',
    backToServices: 'Zurück zu Services',
    referenceLabel: 'Referenznummer',
    footnote: 'Sichere Unterstützung im Zimmer',
  },
  fr: {
    eyebrow: 'Services invités',
    roomLabel: 'Chambre',
    languageTitle: 'Langue',
    servicesTitle: 'Services',
    servicesHint: 'Appuyez sur le service souhaité.',
    detailTitle: 'Détails de la demande',
    messageLabel: 'Message supplémentaire (facultatif)',
    messagePlaceholder:
      'ex. il ne restait qu’une serviette, deux serviettes en plus, clim ne refroidit pas…',
    sendRequest: 'Envoyer la demande',
    backToServices: 'Retour aux services',
    referenceLabel: 'Numéro de référence',
    footnote: 'Assistance sécurisée en chambre',
  },
}

export function isLanguageId(value: string | null): value is LanguageId {
  return value === 'es' || value === 'en' || value === 'de' || value === 'fr'
}
