import type {
  DepartmentNotification,
  DepartmentNotificationChannel,
  DepartmentNotificationDeliveryStatus,
} from '../data/departmentNotification'

export type HotelTelegramConfig = {
  telegramBotToken?: string
  chatId?: string
}

function readEnv(key: string): string | undefined {
  const raw = import.meta.env[key]
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getHotelTelegramConfig(): HotelTelegramConfig {
  return {
    telegramBotToken: readEnv('TELEGRAM_HOTEL_BOT_TOKEN'),
    chatId: readEnv('TELEGRAM_HOTEL_CHAT_ID'),
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export type MobileDispatchResult = {
  deliveryStatus: Exclude<
    DepartmentNotificationDeliveryStatus,
    'prepared' | 'sending'
  >
  channel: DepartmentNotificationChannel
}

async function postTelegramMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: escapeHtml(text),
        parse_mode: 'HTML',
      }),
    },
  )
  if (!response.ok) {
    throw new Error(`Telegram request failed (${response.status})`)
  }
}

export async function sendDepartmentMobileNotification(
  notification: DepartmentNotification,
): Promise<MobileDispatchResult> {
  const config = getHotelTelegramConfig()

  if (!config.telegramBotToken || !config.chatId) {
    console.info('Telegram send failed', {
      notificationId: notification.notificationId,
      incidentId: notification.incidentId,
      reason: 'missing-config',
    })
    return { deliveryStatus: 'missing-config', channel: 'none' }
  }

  console.info('Telegram send attempted', {
    notificationId: notification.notificationId,
    incidentId: notification.incidentId,
    room: notification.room,
    department: notification.targetDepartment,
  })

  try {
    await postTelegramMessage(
      config.telegramBotToken,
      config.chatId,
      notification.message,
    )
    console.info('Telegram send success', {
      notificationId: notification.notificationId,
      incidentId: notification.incidentId,
    })
    return { deliveryStatus: 'sent', channel: 'telegram' }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.info('Telegram send failed', {
      notificationId: notification.notificationId,
      incidentId: notification.incidentId,
      reason,
    })
    return { deliveryStatus: 'failed', channel: 'telegram' }
  }
}
