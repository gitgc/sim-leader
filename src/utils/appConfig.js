const express = require('express')
const path = require('node:path')
const session = require('express-session')
const { passport } = require('../config/auth')

function configureApp() {
  const app = express()

  // Load environment variables
  require('dotenv').config()

  // Middleware
  app.use(express.json())
  app.use(express.static(path.join(__dirname, '../public')))

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  )

  // Initialize Passport
  app.use(passport.initialize())
  app.use(passport.session())

  return app
}

module.exports = { configureApp }
