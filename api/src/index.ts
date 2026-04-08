import { createApp } from './app'
import { config } from './config'

const app = createApp()

app.listen(config.port, () => {
  console.log(`Ponti UI BFF escuchando en http://localhost:${config.port}`)
})
