export type GuestStep = 'room' | 'language' | 'services'

export type LanguageId = 'es' | 'en' | 'de' | 'fr'

export type ServiceId =
  | 'towels'
  | 'cleaning'
  | 'air-conditioning'
  | 'maintenance'
  | 'pillows'
  | 'blankets'
  | 'other'

export const LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
  { id: 'fr', label: 'Français' },
] as const

export const SERVICE_IDS: ServiceId[] = [
  'towels',
  'cleaning',
  'air-conditioning',
  'maintenance',
  'pillows',
  'blankets',
  'other',
]

export const SERVICE_LABELS: Record<LanguageId, Record<ServiceId, string>> = {
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

export const CONFIRMATION_MESSAGES: Record<
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

export const SEND_REQUEST_LABEL: Record<LanguageId, string> = {
  es: 'Enviar solicitud',
  en: 'Send request',
  de: 'Anfrage senden',
  fr: 'Envoyer la demande',
}

export const SERVICES_COPY: Record<
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

export function isLanguageId(value: string | null): value is LanguageId {
  return value === 'es' || value === 'en' || value === 'de' || value === 'fr'
}
