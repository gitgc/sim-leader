const { configureApp } = require('./utils/appConfig')
const { initializeDatabase } = require('./utils/database')

// Import route modules
const authRoutes = require('./routes/auth')
const leaderboardRoutes = require('./routes/leaderboard')
const raceSettingsRoutes = require('./routes/raceSettings')

// Load environment variables
require('dotenv').config()

const app = configureApp()
const PORT = process.env.PORT || 3000

// Root route
app.get('/', (_req, res) => {
  res.json({ message: 'Formula Evergreen Championship API' })
})

// Mount route modules
app.use('/auth', authRoutes)
app.use('/leaderboard', leaderboardRoutes)
app.use('/race-settings', raceSettingsRoutes)

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {})
})
