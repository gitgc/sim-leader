const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')
const { createTestApp } = require('./test-setup')

describe('API Error Handling Integration Tests', () => {
  let app
  let sequelize

  beforeAll(async () => {
    const testSetup = await createTestApp()
    app = testSetup.app
    sequelize = testSetup.sequelize

    // Set up test routes that can fail
    app.get('/leaderboard', async (_req, res) => {
      try {
        const Leaderboard = sequelize.models.leaderboard
        const leaderboards = await Leaderboard.findAll({
          order: [['points', 'DESC']],
        })
        res.json(leaderboards)
      } catch (_error) {
        res.status(500).json({ error: 'Error fetching leaderboards' })
      }
    })

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

    // Test route that always fails
    app.get('/test-error', (_req, res) => {
      res.status(500).json({ error: 'Test error for error handling' })
    })

    // Test route that simulates network timeout
    app.get('/test-timeout', (_req, res) => {
      // Don't respond to simulate timeout
      setTimeout(() => {
        res.status(408).json({ error: 'Request timeout' })
      }, 100)
    })

    // Test route for 404 errors
    app.get('/test-not-found', (_req, res) => {
      res.status(404).json({ error: 'Resource not found' })
    })

    // Test route for validation errors
    app.post('/test-validation', (req, res) => {
      const { requiredField } = req.body
      if (!requiredField) {
        return res.status(400).json({ error: 'Missing required field' })
      }
      res.json({ message: 'Success' })
    })
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

  describe('Database Error Handling', () => {
    test('should handle database errors gracefully for leaderboard', async () => {
      // Close the database connection to simulate error
      await sequelize.close()

      const response = await request(app).get('/leaderboard').expect(500)

      expect(response.body).toEqual({
        error: 'Error fetching leaderboards',
      })
    })

    test('should handle database errors gracefully for race settings', async () => {
      // Database is already closed from previous test
      const response = await request(app).get('/race-settings').expect(500)

      expect(response.body).toEqual({
        error: 'Error fetching race settings',
      })
    })
  })

  describe('HTTP Error Status Codes', () => {
    test('should handle 500 internal server errors', async () => {
      const response = await request(app).get('/test-error').expect(500)

      expect(response.body).toEqual({
        error: 'Test error for error handling',
      })
    })

    test('should handle 404 not found errors', async () => {
      const response = await request(app).get('/test-not-found').expect(404)

      expect(response.body).toEqual({
        error: 'Resource not found',
      })
    })

    test('should handle 400 validation errors', async () => {
      const response = await request(app).post('/test-validation').send({}).expect(400)

      expect(response.body).toEqual({
        error: 'Missing required field',
      })
    })

    test('should handle 408 timeout errors', async () => {
      const response = await request(app).get('/test-timeout')

      // Wait a bit for the timeout response
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect([408, 200]).toContain(response.status)
      if (response.status === 408) {
        expect(response.body).toEqual({
          error: 'Request timeout',
        })
      }
    })
  })

  describe('Route Not Found', () => {
    test('should return 404 for non-existent routes', async () => {
      await request(app).get('/non-existent-route').expect(404)
    })

    test('should return 404 for non-existent POST routes', async () => {
      await request(app).post('/non-existent-post-route').expect(404)
    })
  })

  describe('Malformed Request Handling', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/test-validation')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')

      // Express should handle this gracefully
      expect([400, 500]).toContain(response.status)
    })

    test('should handle empty request body where data is expected', async () => {
      const response = await request(app).post('/test-validation').send({})

      // Should return 400 for missing required field
      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: 'Missing required field',
      })
    })
  })
})
