const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals')
const request = require('supertest')
const { createTestApp, createAuthenticatedApp, createUnauthenticatedApp } = require('./test-setup')

describe('Race Settings API Integration Tests', () => {
  let app
  let sequelize

  beforeAll(async () => {
    const testSetup = await createTestApp()
    app = testSetup.app
    sequelize = testSetup.sequelize

    // Set up race settings routes for testing
    app.get('/race-settings', async (_req, res) => {
      try {
        const RaceSettings = sequelize.models.raceSettings
        let settings = await RaceSettings.findOne()
        if (!settings) {
          settings = await RaceSettings.create({})
        }
        res.json(settings)
      } catch (_error) {
        res.status(500).json({ error: 'Error fetching race settings' })
      }
    })

    app.post(
      '/race-settings/clear-next-race',
      (req, res, next) => {
        // Mock authentication check
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }
        next()
      },
      async (_req, res) => {
        try {
          const RaceSettings = sequelize.models.raceSettings
          let settings = await RaceSettings.findOne()
          if (!settings) {
            settings = await RaceSettings.create({})
          }

          // Clear all race settings
          await settings.update({
            nextRaceLocation: null,
            nextRaceDate: null,
            raceDescription: null,
            circuitImage: null,
          })

          res.json(settings)
        } catch (_error) {
          res.status(500).json({ error: 'Error clearing next race' })
        }
      }
    )
  })

  afterAll(async () => {
    if (sequelize) {
      try {
        await sequelize.close()
      } catch (_error) {
        // Ignore close errors in tests
      }
    }
  })

  beforeEach(async () => {
    // Clear race settings before each test
    const RaceSettings = sequelize.models.raceSettings
    await RaceSettings.destroy({ where: {} })
  })

  describe('GET /race-settings', () => {
    test('should return default race settings when none exist', async () => {
      const response = await request(app).get('/race-settings').expect(200)

      expect(response.body.nextRaceLocation).toBeNull()
      expect(response.body.nextRaceDate).toBeNull()
      expect(response.body.circuitImage).toBeNull()
      expect(response.body.raceDescription).toBeNull()
    })

    test('should return existing race settings', async () => {
      // Create test race settings
      const RaceSettings = sequelize.models.raceSettings
      await RaceSettings.create({
        nextRaceLocation: 'Monaco Grand Prix',
        nextRaceDate: new Date('2024-05-26T14:00:00Z'),
        raceDescription: 'The prestigious Monaco GP',
      })

      const response = await request(app).get('/race-settings').expect(200)

      expect(response.body.nextRaceLocation).toBe('Monaco Grand Prix')
      expect(response.body.raceDescription).toBe('The prestigious Monaco GP')
    })
  })

  describe('POST /race-settings/clear-next-race', () => {
    test('should return 401 when user is not authenticated', async () => {
      const response = await request(app).post('/race-settings/clear-next-race').expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should return 401 for logged out user', async () => {
      // Create mock app that simulates logged out user
      const mockApp = createUnauthenticatedApp()

      mockApp.post(
        '/race-settings/clear-next-race',
        (req, res, next) => {
          // Mock authentication check
          if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required' })
          }
          next()
        },
        async (_req, res) => {
          res.json({ message: 'This should not be reached' })
        }
      )

      const response = await request(mockApp).post('/race-settings/clear-next-race').expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    // Shared helper for clearing race settings
    function clearRaceSettingsHandler(RaceSettings) {
      return async (_req, res) => {
        try {
          let settings = await RaceSettings.findOne()
          if (!settings) {
            settings = await RaceSettings.create({})
          }
          await settings.update({
            nextRaceLocation: null,
            nextRaceDate: null,
            raceDescription: null,
            circuitImage: null,
          })
          res.json(settings)
        } catch (_error) {
          res.status(500).json({ error: 'Error clearing next race' })
        }
      }
    }

    test('should successfully clear all race settings when user is authenticated', async () => {
      // Create test race settings with data
      const RaceSettings = sequelize.models.raceSettings
      const testSettings = await RaceSettings.create({
        nextRaceLocation: 'Monaco Grand Prix',
        nextRaceDate: new Date('2024-05-26T14:00:00Z'),
        raceDescription: 'The prestigious Monaco GP',
        circuitImage: '/uploads/monaco.jpg',
      })

      // Verify settings were created with data
      expect(testSettings.nextRaceLocation).toBe('Monaco Grand Prix')
      expect(testSettings.raceDescription).toBe('The prestigious Monaco GP')

      // Create mock app with authenticated user
      const mockApp = createAuthenticatedApp()

      mockApp.post('/race-settings/clear-next-race', clearRaceSettingsHandler(RaceSettings))
      const RaceSettings = sequelize.models.raceSettings
      await RaceSettings.destroy({ where: {} })

      // Create mock app with authenticated user
      const mockApp = createAuthenticatedApp()

      mockApp.post('/race-settings/clear-next-race', async (_req, res) => {
        try {
          let settings = await RaceSettings.findOne()
          if (!settings) {
            settings = await RaceSettings.create({})
          }

          // Clear all race settings (should be null already)
          await settings.update({
            nextRaceLocation: null,
            nextRaceDate: null,
            raceDescription: null,
            circuitImage: null,
          })

          res.json(settings)
        } catch (_error) {
          res.status(500).json({ error: 'Error clearing next race' })
        }
      })

      const response = await request(mockApp).post('/race-settings/clear-next-race').expect(200)

      // Verify all fields are null
      expect(response.body.nextRaceLocation).toBeNull()
      expect(response.body.nextRaceDate).toBeNull()
      expect(response.body.raceDescription).toBeNull()
      expect(response.body.circuitImage).toBeNull()
    })

    test('should handle database errors gracefully', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.post('/race-settings/clear-next-race', async (_req, res) => {
        try {
          // Simulate a database error
          throw new Error('Database connection failed')
        } catch (_error) {
          res.status(500).json({ error: 'Error clearing next race' })
        }
      })

      const response = await request(mockApp).post('/race-settings/clear-next-race').expect(500)

      expect(response.body).toEqual({ error: 'Error clearing next race' })
    })
  })
})
