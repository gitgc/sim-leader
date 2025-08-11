const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')
const express = require('express')
const session = require('express-session')
const path = require('node:path')
const _fs = require('node:fs').promises
const { Sequelize } = require('sequelize')

// Mock modules
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

describe('End-to-End Application Tests', () => {
  let app
  let sequelize
  let Leaderboard
  let RaceSettings

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test'
    process.env.AUTHORIZED_EMAILS = 'admin@test.com,manager@test.com'
    process.env.SESSION_SECRET = 'test-secret'

    // Create in-memory database
    sequelize = new Sequelize('sqlite::memory:', { logging: false })

    // Import models
    const LeaderboardModel = require('../../src/models/leaderboard')
    const RaceSettingsModel = require('../../src/models/raceSettings')

    // Initialize models
    Leaderboard = LeaderboardModel
    RaceSettings = RaceSettingsModel

    Leaderboard.init(Leaderboard.rawAttributes, { sequelize })
    RaceSettings.init(RaceSettings.rawAttributes, { sequelize })

    await sequelize.sync()

    // Create Express app
    app = express()
    app.use(express.json())
    app.use(express.static(path.join(__dirname, '../../public')))

    // Session configuration
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      })
    )

    // Mock authentication
    app.use((req, _res, next) => {
      req.isAuthenticated = () => !!req.user
      // Check for test user in headers
      if (req.headers['x-test-user']) {
        req.user = JSON.parse(req.headers['x-test-user'])
      }
      next()
    })

    // Auth middleware functions
    const isAuthenticated = (req, res, next) => {
      if (req.isAuthenticated()) {
        return next()
      }
      res.status(401).json({ error: 'Authentication required' })
    }

    const isAuthorized = (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const authorizedEmails = process.env.AUTHORIZED_EMAILS
        ? process.env.AUTHORIZED_EMAILS.split(',').map((email) => email.trim())
        : []

      if (!authorizedEmails.includes(req.user.email)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      next()
    }

    // Routes
    app.get('/auth/user', (req, res) => {
      if (req.isAuthenticated()) {
        const authorizedEmails = process.env.AUTHORIZED_EMAILS
          ? process.env.AUTHORIZED_EMAILS.split(',').map((email) => email.trim())
          : []

        res.json({
          user: req.user,
          isAuthorized: authorizedEmails.includes(req.user.email),
        })
      } else {
        res.json({ user: null, isAuthorized: false })
      }
    })

    app.get('/leaderboard', async (_req, res) => {
      try {
        const leaderboards = await Leaderboard.findAll({
          order: [['points', 'DESC']],
        })
        res.json(leaderboards)
      } catch (_error) {
        res.status(500).json({ error: 'Error fetching leaderboards' })
      }
    })

    app.post('/leaderboard', isAuthorized, async (req, res) => {
      try {
        const { driverName, points } = req.body
        const newEntry = await Leaderboard.create({ driverName, points })
        res.status(201).json(newEntry)
      } catch (_error) {
        res.status(500).json({ error: 'Error creating leaderboard entry' })
      }
    })

    app.put('/leaderboard/:id', isAuthorized, async (req, res) => {
      try {
        const { id } = req.params
        const { driverName, points } = req.body

        const entry = await Leaderboard.findByPk(id)
        if (!entry) {
          return res.status(404).json({ error: 'Driver not found' })
        }

        await entry.update({ driverName, points })
        res.json(entry)
      } catch (_error) {
        res.status(500).json({ error: 'Error updating leaderboard entry' })
      }
    })

    app.delete('/leaderboard/:id', isAuthorized, async (req, res) => {
      try {
        const { id } = req.params
        const entry = await Leaderboard.findByPk(id)

        if (!entry) {
          return res.status(404).json({ error: 'Driver not found' })
        }

        await entry.destroy()
        res.json({ message: 'Driver deleted successfully' })
      } catch (_error) {
        res.status(500).json({ error: 'Error deleting leaderboard entry' })
      }
    })

    app.get('/race-settings', async (_req, res) => {
      try {
        let settings = await RaceSettings.findOne()
        if (!settings) {
          settings = await RaceSettings.create({})
        }
        res.json(settings)
      } catch (_error) {
        res.status(500).json({ error: 'Error fetching race settings' })
      }
    })

    app.put('/race-settings', isAuthenticated, async (req, res) => {
      try {
        const { nextRaceLocation, nextRaceDate, raceDescription } = req.body

        let settings = await RaceSettings.findOne()
        if (!settings) {
          settings = await RaceSettings.create({
            nextRaceLocation,
            nextRaceDate,
            raceDescription,
          })
        } else {
          await settings.update({
            nextRaceLocation,
            nextRaceDate,
            raceDescription,
          })
        }

        res.json(settings)
      } catch (_error) {
        res.status(500).json({ error: 'Error updating race settings' })
      }
    })
  })

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close()
    }
  })

  describe('Complete Championship Workflow', () => {
    const adminUser = { email: 'admin@test.com', name: 'Test Admin' }
    const unauthorizedUser = { email: 'user@test.com', name: 'Test User' }

    test('should complete a full championship management workflow', async () => {
      // 1. Start with empty leaderboard
      let response = await request(app).get('/leaderboard').expect(200)
      expect(response.body).toEqual([])

      // 2. Unauthorized user cannot add drivers
      response = await request(app)
        .post('/leaderboard')
        .set('x-test-user', JSON.stringify(unauthorizedUser))
        .send({ driverName: 'Lewis Hamilton', points: 100 })
        .expect(403)

      // 3. Admin adds multiple drivers
      const drivers = [
        { driverName: 'Lewis Hamilton', points: 0 },
        { driverName: 'Max Verstappen', points: 0 },
        { driverName: 'Charles Leclerc', points: 0 },
      ]

      const createdDrivers = []
      for (const driver of drivers) {
        response = await request(app)
          .post('/leaderboard')
          .set('x-test-user', JSON.stringify(adminUser))
          .send(driver)
          .expect(201)

        expect(response.body.driverName).toBe(driver.driverName)
        expect(response.body.points).toBe(driver.points)
        createdDrivers.push(response.body)
      }

      // 4. Verify all drivers are in leaderboard
      response = await request(app).get('/leaderboard').expect(200)
      expect(response.body).toHaveLength(3)

      // 5. Update driver points after a race
      await request(app)
        .put(`/leaderboard/${createdDrivers[0].id}`)
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Lewis Hamilton', points: 25 })
        .expect(200)

      await request(app)
        .put(`/leaderboard/${createdDrivers[1].id}`)
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Max Verstappen', points: 18 })
        .expect(200)

      await request(app)
        .put(`/leaderboard/${createdDrivers[2].id}`)
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Charles Leclerc', points: 15 })
        .expect(200)

      // 6. Verify leaderboard is ordered correctly
      response = await request(app).get('/leaderboard').expect(200)

      expect(response.body[0].driverName).toBe('Lewis Hamilton')
      expect(response.body[0].points).toBe(25)
      expect(response.body[1].driverName).toBe('Max Verstappen')
      expect(response.body[1].points).toBe(18)
      expect(response.body[2].driverName).toBe('Charles Leclerc')
      expect(response.body[2].points).toBe(15)

      // 7. Set up next race
      const raceData = {
        nextRaceLocation: 'Monaco Grand Prix',
        nextRaceDate: '2024-05-26T14:00:00Z',
        raceDescription: 'The prestigious Monaco Grand Prix',
      }

      response = await request(app)
        .put('/race-settings')
        .set('x-test-user', JSON.stringify(adminUser))
        .send(raceData)
        .expect(200)

      expect(response.body.nextRaceLocation).toBe('Monaco Grand Prix')
      expect(response.body.raceDescription).toBe('The prestigious Monaco Grand Prix')

      // 8. Verify race settings are public
      response = await request(app).get('/race-settings').expect(200)

      expect(response.body.nextRaceLocation).toBe('Monaco Grand Prix')
      expect(response.body.raceDescription).toBe('The prestigious Monaco Grand Prix')

      // 9. Simulate another race with point updates
      await request(app)
        .put(`/leaderboard/${createdDrivers[1].id}`)
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Max Verstappen', points: 43 }) // +25 points
        .expect(200)

      await request(app)
        .put(`/leaderboard/${createdDrivers[2].id}`)
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Charles Leclerc', points: 33 }) // +18 points
        .expect(200)

      await request(app)
        .put(`/leaderboard/${createdDrivers[0].id}`)
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Lewis Hamilton', points: 40 }) // +15 points
        .expect(200)

      // 10. Verify final championship standings
      response = await request(app).get('/leaderboard').expect(200)

      expect(response.body[0].driverName).toBe('Max Verstappen')
      expect(response.body[0].points).toBe(43)
      expect(response.body[1].driverName).toBe('Lewis Hamilton')
      expect(response.body[1].points).toBe(40)
      expect(response.body[2].driverName).toBe('Charles Leclerc')
      expect(response.body[2].points).toBe(33)
    })

    test('should handle authentication properly across all endpoints', async () => {
      // Test unauthenticated access
      await request(app)
        .post('/leaderboard')
        .send({ driverName: 'Test Driver', points: 50 })
        .expect(401)

      await request(app).put('/race-settings').send({ nextRaceLocation: 'Test Race' }).expect(401)

      // Test authorized access
      await request(app)
        .post('/leaderboard')
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Authorized Driver', points: 50 })
        .expect(201)

      // Test unauthorized but authenticated access
      await request(app)
        .post('/leaderboard')
        .set('x-test-user', JSON.stringify(unauthorizedUser))
        .send({ driverName: 'Unauthorized Driver', points: 50 })
        .expect(403)
    })

    test('should handle data validation correctly', async () => {
      // Test invalid driver data
      await request(app)
        .post('/leaderboard')
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ points: 50 }) // Missing driverName
        .expect(500)

      // Test valid driver data
      const response = await request(app)
        .post('/leaderboard')
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Valid Driver', points: 50 })
        .expect(201)

      expect(response.body.driverName).toBe('Valid Driver')
      expect(response.body.points).toBe(50)
    })

    test('should handle resource not found errors', async () => {
      await request(app)
        .put('/leaderboard/999')
        .set('x-test-user', JSON.stringify(adminUser))
        .send({ driverName: 'Updated Driver', points: 100 })
        .expect(404)

      await request(app)
        .delete('/leaderboard/999')
        .set('x-test-user', JSON.stringify(adminUser))
        .expect(404)
    })
  })
})
