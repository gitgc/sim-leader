const express = require('express')
const session = require('express-session')
const { Sequelize } = require('sequelize')

// Mock passport and database modules
jest.mock('../../src/config/db', () => {
  return new Sequelize('sqlite::memory:', { logging: false })
})

jest.mock('passport', () => ({
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  initialize: jest.fn(() => (_req, _res, next) => next()),
  session: jest.fn(() => (_req, _res, next) => next()),
  authenticate: jest.fn(() => (_req, _res, next) => next()),
}))

jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn(),
}))

/**
 * Creates a test Express app with basic setup
 * @returns {Object} { app, sequelize }
 */
async function createTestApp() {
  // Set up test environment
  process.env.NODE_ENV = 'test'
  process.env.AUTHORIZED_EMAILS = 'admin@test.com'
  process.env.SESSION_SECRET = 'test-secret'

  // Create test app
  const app = express()
  app.use(express.json())
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    })
  )

  // Mock authentication middleware
  app.use((req, _res, next) => {
    req.isAuthenticated = () => !!req.user
    next()
  })

  // Initialize in-memory database
  const sequelize = new Sequelize('sqlite::memory:', { logging: false })

  // Import and initialize models
  const Leaderboard = require('../../src/models/leaderboard')
  const RaceSettings = require('../../src/models/raceSettings')

  Leaderboard.init(Leaderboard.rawAttributes, { sequelize })
  RaceSettings.init(RaceSettings.rawAttributes, { sequelize })

  await sequelize.sync()

  return { app, sequelize }
}

/**
 * Creates a mock Express app with authentication
 * @returns {express.Application}
 */
function createAuthenticatedApp() {
  const mockApp = express()
  mockApp.use(express.json())
  mockApp.use((req, _res, next) => {
    req.isAuthenticated = () => true
    req.user = { email: 'admin@test.com' }
    next()
  })
  return mockApp
}

/**
 * Creates a mock Express app without authentication
 * @returns {express.Application}
 */
function createUnauthenticatedApp() {
  const mockApp = express()
  mockApp.use(express.json())
  mockApp.use((req, _res, next) => {
    req.isAuthenticated = () => false
    req.user = null
    next()
  })
  return mockApp
}

module.exports = {
  createTestApp,
  createAuthenticatedApp,
  createUnauthenticatedApp,
}
