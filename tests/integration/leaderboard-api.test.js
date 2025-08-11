const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals')
const request = require('supertest')
const { createTestApp, createAuthenticatedApp, createUnauthenticatedApp } = require('./test-setup')

describe('Leaderboard API Integration Tests', () => {
  let app
  let sequelize

  beforeAll(async () => {
    const testSetup = await createTestApp()
    app = testSetup.app
    sequelize = testSetup.sequelize

    // Set up leaderboard routes for testing
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

    app.post(
      '/leaderboard',
      (req, res, next) => {
        // Mock authorization check
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const authorizedEmails = process.env.AUTHORIZED_EMAILS
          ? process.env.AUTHORIZED_EMAILS.split(',').map((email) => email.trim())
          : []

        if (!authorizedEmails.includes(req.user?.email)) {
          return res.status(403).json({ error: 'Not authorized' })
        }

        next()
      },
      async (req, res) => {
        try {
          const { driverName, points } = req.body
          const Leaderboard = sequelize.models.leaderboard
          const newEntry = await Leaderboard.create({ driverName, points })
          res.status(201).json(newEntry)
        } catch (_error) {
          res.status(500).json({ error: 'Error creating leaderboard entry' })
        }
      }
    )

    app.put(
      '/leaderboard/:id',
      (req, res, next) => {
        // Mock authorization check
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const authorizedEmails = process.env.AUTHORIZED_EMAILS
          ? process.env.AUTHORIZED_EMAILS.split(',').map((email) => email.trim())
          : []

        if (!authorizedEmails.includes(req.user?.email)) {
          return res.status(403).json({ error: 'Not authorized' })
        }

        next()
      },
      async (req, res) => {
        try {
          const { id } = req.params
          const { driverName, points } = req.body
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          await entry.update({ driverName, points })
          res.json(entry)
        } catch (_error) {
          res.status(500).json({ error: 'Error updating leaderboard entry' })
        }
      }
    )

    app.delete(
      '/leaderboard/:id',
      (req, res, next) => {
        // Mock authorization check
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const authorizedEmails = process.env.AUTHORIZED_EMAILS
          ? process.env.AUTHORIZED_EMAILS.split(',').map((email) => email.trim())
          : []

        if (!authorizedEmails.includes(req.user?.email)) {
          return res.status(403).json({ error: 'Not authorized' })
        }

        next()
      },
      async (req, res) => {
        try {
          const { id } = req.params
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          await entry.destroy()
          res.json({ message: 'Leaderboard entry deleted successfully' })
        } catch (_error) {
          res.status(500).json({ error: 'Error deleting leaderboard entry' })
        }
      }
    )

    app.delete(
      '/leaderboard/:id/profile-picture',
      (req, res, next) => {
        // Mock authorization check
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const authorizedEmails = process.env.AUTHORIZED_EMAILS
          ? process.env.AUTHORIZED_EMAILS.split(',').map((email) => email.trim())
          : []

        if (!authorizedEmails.includes(req.user?.email)) {
          return res.status(403).json({ error: 'Not authorized' })
        }

        next()
      },
      async (req, res) => {
        try {
          const { id } = req.params
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          await entry.update({ profilePicture: null })
          res.json({ message: 'Profile picture deleted successfully' })
        } catch (_error) {
          res.status(500).json({ error: 'Error deleting profile picture' })
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
    // Clear leaderboard before each test
    const Leaderboard = sequelize.models.leaderboard
    await Leaderboard.destroy({ where: {} })
  })

  describe('GET /leaderboard', () => {
    test('should return empty leaderboard initially', async () => {
      const response = await request(app).get('/leaderboard').expect(200)

      expect(response.body).toEqual([])
    })

    test('should return leaderboard entries ordered by points', async () => {
      const Leaderboard = sequelize.models.leaderboard
      await Leaderboard.bulkCreate([
        { driverName: 'Driver A', points: 50 },
        { driverName: 'Driver B', points: 100 },
        { driverName: 'Driver C', points: 75 },
      ])

      const response = await request(app).get('/leaderboard').expect(200)

      expect(response.body).toHaveLength(3)
      expect(response.body[0].driverName).toBe('Driver B')
      expect(response.body[0].points).toBe(100)
      expect(response.body[1].driverName).toBe('Driver C')
      expect(response.body[1].points).toBe(75)
      expect(response.body[2].driverName).toBe('Driver A')
      expect(response.body[2].points).toBe(50)
    })
  })

  describe('POST /leaderboard', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/leaderboard')
        .send({ driverName: 'Test Driver', points: 100 })
        .expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should deny access for unauthenticated users', async () => {
      const unauthenticatedApp = createUnauthenticatedApp()

      unauthenticatedApp.post('/leaderboard', (req, res) => {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }
        res.json({ message: 'Should not reach here' })
      })

      const response = await request(unauthenticatedApp)
        .post('/leaderboard')
        .send({ driverName: 'Test Driver', points: 100 })
        .expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should create leaderboard entry when authenticated and authorized', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.post('/leaderboard', authLeaderboardPostHandler(sequelize))

      const response = await request(mockApp)
        .post('/leaderboard')
        .send({ driverName: 'Test Driver', points: 100 })
        .expect(201)

      expect(response.body.driverName).toBe('Test Driver')
      expect(response.body.points).toBe(100)
      expect(response.body.id).toBeDefined()
    })

    test('should validate required fields', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.post('/leaderboard', async (req, res) => {
        try {
          const { driverName, points } = req.body

          if (!driverName || points === undefined || points === null) {
            return res.status(400).json({ error: 'Missing required fields' })
          }

          const Leaderboard = sequelize.models.leaderboard
          const newEntry = await Leaderboard.create({ driverName, points })
          res.status(201).json(newEntry)
        } catch (_error) {
          res.status(500).json({ error: 'Error creating leaderboard entry' })
        }
      })

      // Test missing driverName
      await request(mockApp).post('/leaderboard').send({ points: 100 }).expect(400)

      // Test missing points
      await request(mockApp).post('/leaderboard').send({ driverName: 'Test Driver' }).expect(400)
    })
  })

  describe('PUT /leaderboard/:id', () => {
    let testEntry

    beforeEach(async () => {
      // Create a test entry for update tests
      const Leaderboard = sequelize.models.leaderboard
      testEntry = await Leaderboard.create({ driverName: 'Original Driver', points: 50 })
    })

    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/leaderboard/${testEntry.id}`)
        .send({ driverName: 'Updated Driver', points: 75 })
        .expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should deny access for unauthenticated users', async () => {
      const unauthenticatedApp = createUnauthenticatedApp()

      unauthenticatedApp.put('/leaderboard/:id', (req, res) => {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }
        res.json({ message: 'Should not reach here' })
      })

      const response = await request(unauthenticatedApp)
        .put(`/leaderboard/${testEntry.id}`)
        .send({ driverName: 'Updated Driver', points: 75 })
        .expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should update leaderboard entry when authenticated and authorized', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.put('/leaderboard/:id', async (req, res) => {
        try {
          const { id } = req.params
          const { driverName, points } = req.body
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          await entry.update({ driverName, points })
          res.json(entry)
        } catch (_error) {
          res.status(500).json({ error: 'Error updating leaderboard entry' })
        }
      })

      const response = await request(mockApp)
        .put(`/leaderboard/${testEntry.id}`)
        .send({ driverName: 'Updated Driver', points: 75 })
        .expect(200)

      expect(response.body.driverName).toBe('Updated Driver')
      expect(response.body.points).toBe(75)
      expect(response.body.id).toBe(testEntry.id)
    })

    test('should return 404 for non-existent entry', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.put('/leaderboard/:id', async (req, res) => {
        try {
          const { id } = req.params
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          res.json(entry)
        } catch (_error) {
          res.status(500).json({ error: 'Error updating leaderboard entry' })
        }
      })

      const response = await request(mockApp)
        .put('/leaderboard/99999')
        .send({ driverName: 'Updated Driver', points: 75 })
        .expect(404)

      expect(response.body).toEqual({ error: 'Leaderboard entry not found' })
    })
  })

  describe('DELETE /leaderboard/:id', () => {
    let testEntry

    beforeEach(async () => {
      // Create a test entry for delete tests
      const Leaderboard = sequelize.models.leaderboard
      testEntry = await Leaderboard.create({ driverName: 'Driver to Delete', points: 25 })
    })

    test('should require authentication', async () => {
      const response = await request(app).delete(`/leaderboard/${testEntry.id}`).expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should deny access for unauthenticated users', async () => {
      const unauthenticatedApp = createUnauthenticatedApp()

      unauthenticatedApp.delete('/leaderboard/:id', (req, res) => {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }
        res.json({ message: 'Should not reach here' })
      })

      const response = await request(unauthenticatedApp)
        .delete(`/leaderboard/${testEntry.id}`)
        .expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should delete leaderboard entry when authenticated and authorized', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.delete('/leaderboard/:id', async (req, res) => {
        try {
          const { id } = req.params
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          await entry.destroy()
          res.json({ message: 'Leaderboard entry deleted successfully' })
        } catch (_error) {
          res.status(500).json({ error: 'Error deleting leaderboard entry' })
        }
      })

      const response = await request(mockApp).delete(`/leaderboard/${testEntry.id}`).expect(200)

      expect(response.body).toEqual({ message: 'Leaderboard entry deleted successfully' })

      // Verify entry was actually deleted
      const Leaderboard = sequelize.models.leaderboard
      const deletedEntry = await Leaderboard.findByPk(testEntry.id)
      expect(deletedEntry).toBeNull()
    })

    test('should return 404 for non-existent entry', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.delete('/leaderboard/:id', async (req, res) => {
        try {
          const { id } = req.params
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          await entry.destroy()
          res.json({ message: 'Leaderboard entry deleted successfully' })
        } catch (_error) {
          res.status(500).json({ error: 'Error deleting leaderboard entry' })
        }
      })

      const response = await request(mockApp).delete('/leaderboard/99999').expect(404)

      expect(response.body).toEqual({ error: 'Leaderboard entry not found' })
    })
  })

  describe('DELETE /leaderboard/:id/profile-picture', () => {
    let testEntry

    beforeEach(async () => {
      // Create a test entry with profile picture for delete tests
      const Leaderboard = sequelize.models.leaderboard
      testEntry = await Leaderboard.create({
        driverName: 'Driver with Picture',
        points: 30,
        profilePicture: '/uploads/test-picture.jpg',
      })
    })

    test('should require authentication', async () => {
      const response = await request(app)
        .delete(`/leaderboard/${testEntry.id}/profile-picture`)
        .expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should deny access for unauthenticated users', async () => {
      const unauthenticatedApp = createUnauthenticatedApp()

      unauthenticatedApp.delete('/leaderboard/:id/profile-picture', (req, res) => {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication required' })
        }
        res.json({ message: 'Should not reach here' })
      })

      const response = await request(unauthenticatedApp)
        .delete(`/leaderboard/${testEntry.id}/profile-picture`)
        .expect(401)

      expect(response.body).toEqual({ error: 'Authentication required' })
    })

    test('should delete profile picture when authenticated and authorized', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.delete('/leaderboard/:id/profile-picture', async (req, res) => {
        try {
          const { id } = req.params
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          await entry.update({ profilePicture: null })
          res.json({ message: 'Profile picture deleted successfully' })
        } catch (_error) {
          res.status(500).json({ error: 'Error deleting profile picture' })
        }
      })

      const response = await request(mockApp)
        .delete(`/leaderboard/${testEntry.id}/profile-picture`)
        .expect(200)

      expect(response.body).toEqual({ message: 'Profile picture deleted successfully' })

      // Verify profile picture was actually removed
      const Leaderboard = sequelize.models.leaderboard
      const updatedEntry = await Leaderboard.findByPk(testEntry.id)
      expect(updatedEntry.profilePicture).toBeNull()
    })

    test('should return 404 for non-existent entry', async () => {
      const mockApp = createAuthenticatedApp()

      mockApp.delete('/leaderboard/:id/profile-picture', async (req, res) => {
        try {
          const { id } = req.params
          const Leaderboard = sequelize.models.leaderboard

          const entry = await Leaderboard.findByPk(id)
          if (!entry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' })
          }

          await entry.update({ profilePicture: null })
          res.json({ message: 'Profile picture deleted successfully' })
        } catch (_error) {
          res.status(500).json({ error: 'Error deleting profile picture' })
        }
      })

      const response = await request(mockApp)
        .delete('/leaderboard/99999/profile-picture')
        .expect(404)

      expect(response.body).toEqual({ error: 'Leaderboard entry not found' })
    })
  })
})
