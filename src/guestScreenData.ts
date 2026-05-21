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

export const GUEST_PAGE_COPY: Record<
  LanguageId,
  {
    eyebrow: string
    roomLabel: string
    languageTitle: string
    servicesTitle: string
    servicesHint: string
  }
> = {
  es: {
    eyebrow: 'Servicios para huéspedes',
    roomLabel: 'Habitación',
    languageTitle: 'Idioma',
    servicesTitle: 'Servicios',
    servicesHint: 'Selecciona un idioma y pulsa el servicio que necesitas.',
  },
  en: {
    eyebrow: 'Guest services',
    roomLabel: 'Room',
    languageTitle: 'Language',
    servicesTitle: 'Services',
    servicesHint: 'Choose a language, then tap the service you need.',
  },
  de: {
    eyebrow: 'Gästeservice',
    roomLabel: 'Zimmer',
    languageTitle: 'Sprache',
    servicesTitle: 'Services',
    servicesHint: 'Wählen Sie eine Sprache und tippen Sie auf den gewünschten Service.',
  },
  fr: {
    eyebrow: 'Services invités',
    roomLabel: 'Chambre',
    languageTitle: 'Langue',
    servicesTitle: 'Services',
    servicesHint: 'Choisissez une langue, puis appuyez sur le service souhaité.',
  },
}

export function isLanguageId(value: string | null): value is LanguageId {
  return value === 'es' || value === 'en' || value === 'de' || value === 'fr'
}
