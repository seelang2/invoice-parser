import { app } from './server.js'
//import { config } from './config/index.js'

// Using a simple object for config here to not deviate too far from the project spec
const config = {
    PORT: 80
}

const server = app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`)
})

// Graceful shutdown
async function shutdown() {
  server.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown) // Ctrl-C in dev
