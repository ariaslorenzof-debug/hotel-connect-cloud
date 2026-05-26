import http from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  INITIAL_INCIDENTS,
  buildTelegramMessage,
  createGuestIncident,
  departmentForGuestService,
} from './incidentOps.mjs'
import { opsLog, sendHotelTelegram } from './telegram.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')
const PORT = Number.parseInt(process.env.PORT ?? '3000', 10)

/** @type {typeof INITIAL_INCIDENTS} */
let incidents = [...INITIAL_INCIDENTS]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<unknown>}
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw.length > 0 ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} payload
 */
function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
function applyCors(req, res) {
  const configured = process.env.CORS_ALLOW_ORIGIN?.trim()
  const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  const allowOrigin = configured || requestOrigin || '*'

  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
  res.setHeader('Vary', 'Origin')
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
function handleOptions(req, res) {
  applyCors(req, res)
  res.writeHead(204)
  res.end()
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleGuestRequest(req, res) {
  applyCors(req, res)

  try {
    const body = await readJsonBody(req)
    const room = typeof body.room === 'string' ? body.room.trim() : ''
    const language = body.language
    const service = typeof body.service === 'string' ? body.service : ''
    const department =
      typeof body.department === 'string'
        ? body.department
        : departmentForGuestService(service)
    const status = body.status === 'pending' ? 'pending' : 'pending'
    const createdAt =
      typeof body.createdAt === 'number' && Number.isFinite(body.createdAt)
        ? body.createdAt
        : Date.now()
    const serviceLabel =
      typeof body.serviceLabel === 'string' ? body.serviceLabel.trim() : service
    const optionalMessage =
      typeof body.optionalMessage === 'string' ? body.optionalMessage.trim() : ''

    opsLog('GUEST_REQUEST_POST_RECEIVED', {
      room,
      language,
      service,
      department,
      status,
      createdAt,
      optionalMessage: optionalMessage || undefined,
    })

    if (!room || !service || !language) {
      sendJson(res, 400, { error: 'invalid-payload' })
      return
    }

    const incident = createGuestIncident(
      {
        room,
        language,
        service,
        serviceLabel,
        department,
        status,
        createdAt,
        ...(optionalMessage ? { optionalMessage } : {}),
      },
      incidents,
    )

    incidents = [incident, ...incidents]

    opsLog('INCIDENT_CREATED', {
      incidentId: incident.id,
      room: incident.room,
      service: incident.service,
      department: incident.department,
      status: incident.status,
      createdAt: incident.createdAt,
    })

    const telegramMessage = buildTelegramMessage(
      incident.room,
      serviceLabel,
      incident.department,
      optionalMessage,
      incident.id,
    )

    const telegram = await sendHotelTelegram(telegramMessage)

    sendJson(res, 201, {
      incident,
      telegram: {
        status: telegram.ok ? 'sent' : 'failed',
        reason: telegram.reason,
      },
    })
  } catch (error) {
    opsLog('GUEST_REQUEST_POST_RECEIVED', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    sendJson(res, 500, { error: 'server-error' })
  }
}

/**
 * @param {string} pathname
 */
function resolveStaticFile(pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname
  const filePath = path.join(DIST_DIR, safePath)

  if (!filePath.startsWith(DIST_DIR)) return null
  if (!existsSync(filePath) || path.extname(filePath) === '') {
    const indexPath = path.join(DIST_DIR, 'index.html')
    return existsSync(indexPath) ? indexPath : null
  }
  return filePath
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
function serveStatic(req, res) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const filePath = resolveStaticFile(url.pathname)

  if (!filePath) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const ext = path.extname(filePath)
  const type = MIME[ext] ?? 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type })
  res.end(readFileSync(filePath))
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const { pathname } = url

  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    handleOptions(req, res)
    return
  }

  if (req.method === 'GET' && pathname === '/api/incidents') {
    applyCors(req, res)
    sendJson(res, 200, { incidents })
    return
  }

  if (req.method === 'POST' && pathname === '/api/guest-requests') {
    await handleGuestRequest(req, res)
    return
  }

  if (req.method === 'GET') {
    serveStatic(req, res)
    return
  }

  res.writeHead(405)
  res.end('Method not allowed')
})

server.listen(PORT, () => {
  opsLog('SERVER_STARTED', { port: PORT, dist: existsSync(DIST_DIR) })
})
