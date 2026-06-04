import { createApp } from './app.js'
import { config } from './config.js'
import { logger } from './logger.js'

const app = createApp()

app.listen(config.port, () => {
  logger.info('bff_started', {
    port: config.port,
    baseManagerApi: config.baseManagerApi,
    serviceVersion: process.env.SERVICE_VERSION ?? 'local',
    gitSha: process.env.SERVICE_GIT_SHA ?? '',
  })
})
