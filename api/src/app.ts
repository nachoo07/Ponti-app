import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logger } from './logger.js'
import authRoutes from './routes/auth.js'
import campaignsRoutes from './routes/campaigns.js'
import customersRoutes from './routes/customers.js'
import laborsRoutes from './routes/labors.js'
import projectsRoutes from './routes/projects.js'
import suppliesRoutes from './routes/supplies.js'
import stockRoutes from './routes/stock.js'
import workOrderDraftRoutes from './routes/workOrderDrafts.js'

export function createApp() {
  const app = express()
  const frontendPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public')
  const frontendIndex = path.join(frontendPath, 'index.html')
  const hasFrontendBundle = fs.existsSync(frontendIndex)

  app.use(cors())
  app.use(express.json())

  app.use((req, res, next) => {
    const startedAt = Date.now()

    res.on('finish', () => {
      // No logueamos /health para no ensuciar (lo pega el healthcheck de Cloud Run).
      if (req.path === '/health') {
        return
      }

      logger.info('http_request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      })
    })

    next()
  })

  if (hasFrontendBundle) {
    app.use(express.static(frontendPath))
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true })
  })

  app.get('/api/v1/version', (_req, res) => {
    res.status(200).json({
      service: process.env.SERVICE_NAME ?? 'ponti-mobile',
      version: process.env.SERVICE_VERSION ?? 'local',
      gitSha: process.env.SERVICE_GIT_SHA ?? '',
      buildTime: process.env.SERVICE_BUILD_TIME ?? '',
    })
  })

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/campaigns', campaignsRoutes)
  app.use('/api/v1/customers', customersRoutes)
  app.use('/api/v1/labors', laborsRoutes)
  app.use('/api/v1/projects', projectsRoutes)
  app.use('/api/v1/supplies', suppliesRoutes)
  app.use('/api/v1/stock', stockRoutes)
  app.use('/api/v1/work-order-drafts', workOrderDraftRoutes)

  if (hasFrontendBundle) {
    app.get(/^(?!\/api\/v1|\/health).*/, (_req, res) => {
      res.sendFile(frontendIndex)
    })
  }

  return app
}
