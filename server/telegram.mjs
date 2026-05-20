/**
 * @param {string} event
 * @param {Record<string, unknown>} [data]
 */
export function opsLog(event, data = {}) {
  console.info(event, data)
}

/**
 * @param {string} text
 */
export async function sendHotelTelegram(text) {
  opsLog('TELEGRAM_SEND_ATTEMPTED', {})

  const token = process.env.TELEGRAM_HOTEL_BOT_TOKEN?.trim()
  const chatId = process.env.TELEGRAM_HOTEL_CHAT_ID?.trim()

  if (!token || !chatId) {
    opsLog('TELEGRAM_SEND_FAILED', { reason: 'missing-config' })
    return { ok: false, reason: 'missing-config' }
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  })

  if (!response.ok) {
    const reason = `telegram-http-${response.status}`
    opsLog('TELEGRAM_SEND_FAILED', { reason })
    return { ok: false, reason }
  }

  opsLog('TELEGRAM_SEND_SUCCESS', {})
  return { ok: true }
}
