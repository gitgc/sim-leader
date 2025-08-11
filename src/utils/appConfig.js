const express = require('express')
const path = require('node:path')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const { Pool } = require('pg')
const { passport } = require('../config/auth')
const logger = require('./logger')

function configureApp() {
  const app = express()

  // Load environment variables
  require('dotenv').config()

  // Middleware
  app.use(express.json())
  app.use(express.static(path.join(__dirname, '../../public')))

  // Create PostgreSQL connection pool for sessions
  const pgPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })

  // Handle pool errors
  pgPool.on('error', (err) => {
    logger.logError(err, { context: 'Session store database connection error' })
  })

  // Create session store
  const sessionStore = new pgSession({
    pool: pgPool,
    tableName: 'session', // Table name for storing sessions
    createTableIfMissing: true, // Auto-create table if it doesn't exist
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  })

  // Session configuration with PostgreSQL store
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'fallback-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
      name: 'sessionId', // Rename the session cookie for security
    })
  )

  logger.info('Session store configured with PostgreSQL backend')

  // Initialize Passport
  app.use(passport.initialize())
  app.use(passport.session())

  return app
}

module.exports = { configureApp }
