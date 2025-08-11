const express = require('express')
const path = require('node:path')
const session = require('express-session')
const multer = require('multer')
const fs = require('node:fs')
const sequelize = require('./config/db')
const Leaderboard = require('./models/leaderboard')
const RaceSettings = require('./models/raceSettings')
const { passport, isAuthenticated, isAuthorized } = require('./config/auth')

// Load environment variables
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let uploadDir
    if (file.fieldname === 'circuitImage') {
      uploadDir = path.join(__dirname, '../public/uploads/circuits')
    } else {
      uploadDir = path.join(__dirname, '../public/uploads')
    }

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const fileFilter = (_req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Test database connection and sync models
async function initializeDatabase() {
  try {
    await sequelize.authenticate()

    // Sync database models - force update to add new profilePicture column
    await sequelize.sync({ alter: true })
  } catch (_error) {}
}

// Routes
app.get('/', (_req, res) => {
  res.json({ message: 'Formula Evergreen Championship API' })
})

// Authentication routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (_req, res) => {
    // Successful authentication
    res.redirect('/')
  }
)

app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' })
    }
    res.json({ message: 'Logged out successfully' })
  })
})

// Get current user info
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

// Public leaderboard route (no auth required)
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

// Protected routes (require authorization)
app.post('/leaderboard', isAuthorized, async (req, res) => {
  try {
    const { driverName, points } = req.body
    const newEntry = await Leaderboard.create({ driverName, points })
    res.status(201).json(newEntry)
  } catch (_error) {
    res.status(500).json({ error: 'Error creating leaderboard entry' })
  }
})

// Upload profile picture endpoint
app.post(
  '/leaderboard/:id/profile-picture',
  isAuthorized,
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      const { id } = req.params

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const entry = await Leaderboard.findByPk(id)
      if (!entry) {
        // Clean up uploaded file if driver not found
        fs.unlinkSync(req.file.path)
        return res.status(404).json({ error: 'Leaderboard entry not found' })
      }

      // Delete old profile picture if exists
      if (entry.profilePicture) {
        const oldPicturePath = path.join(__dirname, '../public', entry.profilePicture)
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath)
        }
      }

      // Update with new profile picture path
      const profilePicturePath = `/uploads/${req.file.filename}`
      await entry.update({ profilePicture: profilePicturePath })

      res.json({
        message: 'Profile picture uploaded successfully',
        profilePicture: profilePicturePath,
      })
    } catch (_error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      res.status(500).json({ error: 'Error uploading profile picture' })
    }
  }
)

// Delete profile picture endpoint
app.delete('/leaderboard/:id/profile-picture', isAuthorized, async (req, res) => {
  try {
    const { id } = req.params

    const entry = await Leaderboard.findByPk(id)
    if (!entry) {
      return res.status(404).json({ error: 'Leaderboard entry not found' })
    }

    // Delete profile picture file if exists
    if (entry.profilePicture) {
      const picturePath = path.join(__dirname, '../public', entry.profilePicture)
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath)
      }
    }

    // Update database to remove profile picture
    await entry.update({ profilePicture: null })

    res.json({ message: 'Profile picture deleted successfully' })
  } catch (_error) {
    res.status(500).json({ error: 'Error deleting profile picture' })
  }
})

// Function to check if race has expired (midnight PST on race day)
function isRaceExpired(raceDate) {
  if (!raceDate) return false

  const now = new Date()
  const race = new Date(raceDate)

  // Convert race date to PST and get midnight of that day
  const pstOffset = 8 * 60 * 60 * 1000 // PST is UTC-8
  const racePST = new Date(race.getTime() - pstOffset)
  const midnightPST = new Date(
    racePST.getFullYear(),
    racePST.getMonth(),
    racePST.getDate() + 1,
    8,
    0,
    0
  ) // Next day midnight in UTC

  return now >= midnightPST
}

// Race Settings endpoints
// Get race settings (public endpoint)
app.get('/race-settings', async (_req, res) => {
  try {
    let settings = await RaceSettings.findOne()
    if (!settings) {
      // Create default settings if none exist
      settings = await RaceSettings.create({})
    } else if (settings.nextRaceDate && isRaceExpired(settings.nextRaceDate)) {
      // Race has expired, clear it automatically
      await settings.update({
        nextRaceLocation: null,
        nextRaceDate: null,
        raceDescription: null,
        circuitImage: null,
      })

      // Delete circuit image file if it exists
      if (settings.circuitImage) {
        const fs = require('node:fs')
        const path = require('node:path')
        const imagePath = path.join(__dirname, '..', settings.circuitImage)
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath)
        }
      }
    }

    res.json(settings)
  } catch (_error) {
    res.status(500).json({ error: 'Error fetching race settings' })
  }
})

// Update race settings (protected endpoint)
app.put('/race-settings', isAuthenticated, async (req, res) => {
  try {
    const { nextRaceLocation, nextRaceDate, raceDescription } = req.body

    // Convert PST input to UTC for storage
    let processedRaceDate = nextRaceDate
    if (nextRaceDate) {
      // The input is treated as PST, convert to UTC for database storage
      const pstDate = new Date(nextRaceDate)
      // PST is UTC-8, PDT is UTC-7. Use UTC-8 for consistency
      const utcDate = new Date(pstDate.getTime() + 8 * 60 * 60 * 1000)
      processedRaceDate = utcDate.toISOString()
    }

    let settings = await RaceSettings.findOne()
    if (!settings) {
      settings = await RaceSettings.create({
        nextRaceLocation,
        nextRaceDate: processedRaceDate,
        raceDescription,
      })
    } else {
      await settings.update({
        nextRaceLocation,
        nextRaceDate: processedRaceDate,
        raceDescription,
      })
    }

    res.json(settings)
  } catch (_error) {
    res.status(500).json({ error: 'Error updating race settings' })
  }
})

// Upload circuit image (protected endpoint)
app.post(
  '/race-settings/circuit-image',
  isAuthenticated,
  upload.single('circuitImage'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      let settings = await RaceSettings.findOne()
      if (!settings) {
        settings = await RaceSettings.create({})
      }

      // Delete old circuit image if exists
      if (settings.circuitImage) {
        const oldImagePath = path.join(__dirname, '../public', settings.circuitImage)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      // Update with new circuit image path
      const circuitImagePath = `/uploads/circuits/${req.file.filename}`
      await settings.update({ circuitImage: circuitImagePath })

      res.json({
        message: 'Circuit image uploaded successfully',
        circuitImage: circuitImagePath,
      })
    } catch (_error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      res.status(500).json({ error: 'Error uploading circuit image' })
    }
  }
)

// Delete circuit image (protected endpoint)
app.delete('/race-settings/circuit-image', isAuthenticated, async (_req, res) => {
  try {
    const settings = await RaceSettings.findOne()
    if (!settings) {
      return res.status(404).json({ error: 'Race settings not found' })
    }

    // Delete circuit image file if exists
    if (settings.circuitImage) {
      const imagePath = path.join(__dirname, '../public', settings.circuitImage)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Update database to remove circuit image
    await settings.update({ circuitImage: null })

    res.json({ message: 'Circuit image deleted successfully' })
  } catch (_error) {
    res.status(500).json({ error: 'Error deleting circuit image' })
  }
})

// Clear next race (protected endpoint)
app.post('/race-settings/clear-next-race', isAuthenticated, async (_req, res) => {
  try {
    let settings = await RaceSettings.findOne()
    if (!settings) {
      settings = await RaceSettings.create({})
    }

    // Delete circuit image file if exists
    if (settings.circuitImage) {
      const imagePath = path.join(__dirname, '../public', settings.circuitImage)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
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
})

app.put('/leaderboard/:id', isAuthorized, async (req, res) => {
  try {
    const { id } = req.params
    const { driverName, points } = req.body

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

app.delete('/leaderboard/:id', isAuthorized, async (req, res) => {
  try {
    const { id } = req.params
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

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {})
})
