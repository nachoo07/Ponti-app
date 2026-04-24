import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

  if (hasFrontendBundle) {
    app.use(express.static(frontendPath))
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true })
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
