export function opsLog(event: string, data?: Record<string, unknown>) {
  console.info(event, data ?? {})
}
