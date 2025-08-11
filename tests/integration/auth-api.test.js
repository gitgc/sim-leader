const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')
const { createTestApp } = require('./test-setup')

describe('Auth API Integration Tests', () => {
  let app
  let sequelize

  beforeAll(async () => {
    const testSetup = await createTestApp()
    app = testSetup.app
    sequelize = testSetup.sequelize

    // Set up auth routes for testing
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

  describe('GET /auth/user', () => {
    test('should return null user when not authenticated', async () => {
      const response = await request(app).get('/auth/user').expect(200)

      expect(response.body).toEqual({
        user: null,
        isAuthorized: false,
      })
    })

    test('should return user info when authenticated', async () => {
      // Mock authentication by setting user in request
      app.use('/auth-test', (req, _res, next) => {
        req.user = { email: 'admin@test.com', name: 'Test Admin' }
        next()
      })

      app.get('/auth-test/user', (req, res) => {
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

      const response = await request(app).get('/auth-test/user').expect(200)

      expect(response.body.user).toEqual({
        email: 'admin@test.com',
        name: 'Test Admin',
      })
      expect(response.body.isAuthorized).toBe(true)
    })
  })
})
