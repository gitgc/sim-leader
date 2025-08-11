const { configureApp } = require('./utils/appConfig')
const { initializeDatabase } = require('./utils/database')
const logger = require('./utils/logger')

// Import route modules
const authRoutes = require('./routes/auth')
const leaderboardRoutes = require('./routes/leaderboard')
const raceSettingsRoutes = require('./routes/raceSettings')

// Load environment variables
require('dotenv').config()

logger.info('Starting Formula Evergreen Championship API...', {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
})

const app = configureApp()
const PORT = process.env.PORT || 3000

// Add request logging middleware
app.use(logger.logRequest)

// Mount route modules
app.use('/auth', authRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/race-settings', raceSettingsRoutes)

// Global error handler
app.use((error, req, res, _next) => {
  logger.logError(error, {
    context: 'Unhandled application error',
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message

  res.status(500).json({ error: message })
})

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      })
    })
  })
  .catch((error) => {
    logger.logError(error, { context: 'Server startup failed' })
    process.exit(1)
  })
