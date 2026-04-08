import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth'
import campaignsRoutes from './routes/campaigns'
import customersRoutes from './routes/customers'
import laborsRoutes from './routes/labors'
import projectsRoutes from './routes/projects'
import suppliesRoutes from './routes/supplies'
import stockRoutes from './routes/stock'
import workOrderDraftRoutes from './routes/workOrderDrafts'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

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

  return app
}


