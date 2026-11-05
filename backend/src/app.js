import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { ZodError } from 'zod'
import { logger } from './config/logger.js'
import { AppError } from './lib/errors.js'
import eventsRouter from './routes/events.routes.js'
import endpointsRouter from './routes/endpoints.routes.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(pinoHttp({ logger }))
  app.use(helmet())
  app.use(cors()) // Replace with an allow-list in production.
  app.use(express.json({ limit: '256kb' }))
  app.get('/healthz', (_req, res) => res.json({ ok: true }))
  app.use('/api/v1/events', eventsRouter)
  app.use('/api/v1/endpoints', endpointsRouter)
  app.use((error, req, res, _next) => {
    req.log.error(error)
    if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid request', details: error.flatten() })
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message, details: error.details })
    if (error?.name === 'CastError') return res.status(400).json({ error: 'Invalid resource id' })
    return res.status(500).json({ error: 'Internal server error' })
  })
  return app
}
