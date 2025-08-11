const express = require('express')
const { isAuthenticated } = require('../config/auth')
const { upload } = require('../middleware/upload')
const {
  deleteFileIfExists,
  cleanupUploadedFile,
  getPublicFilePath,
} = require('../utils/fileManager')
const { isRaceExpired } = require('../utils/database')
const RaceSettings = require('../models/raceSettings')

const router = express.Router()

// Get race settings (public route)
router.get('/', async (_req, res) => {
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
        const imagePath = getPublicFilePath(settings.circuitImage)
        deleteFileIfExists(imagePath)
      }
    }

    res.json(settings)
  } catch (_error) {
    res.status(500).json({ error: 'Error fetching race settings' })
  }
})

// Update race settings (protected endpoint)
router.put('/', isAuthenticated, async (req, res) => {
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
router.post('/circuit-image', isAuthenticated, upload.single('circuitImage'), async (req, res) => {
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
      const oldImagePath = getPublicFilePath(settings.circuitImage)
      deleteFileIfExists(oldImagePath)
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
    cleanupUploadedFile(req)
    res.status(500).json({ error: 'Error uploading circuit image' })
  }
})

// Delete circuit image (protected endpoint)
router.delete('/circuit-image', isAuthenticated, async (_req, res) => {
  try {
    const settings = await RaceSettings.findOne()
    if (!settings) {
      return res.status(404).json({ error: 'Race settings not found' })
    }

    // Delete circuit image file if exists
    if (settings.circuitImage) {
      const imagePath = getPublicFilePath(settings.circuitImage)
      deleteFileIfExists(imagePath)
    }

    // Update database to remove circuit image
    await settings.update({ circuitImage: null })

    res.json({ message: 'Circuit image deleted successfully' })
  } catch (_error) {
    res.status(500).json({ error: 'Error deleting circuit image' })
  }
})

// Clear next race (protected endpoint)
router.post('/clear-next-race', isAuthenticated, async (_req, res) => {
  try {
    let settings = await RaceSettings.findOne()
    if (!settings) {
      settings = await RaceSettings.create({})
    }

    // Delete circuit image file if exists
    if (settings.circuitImage) {
      const imagePath = getPublicFilePath(settings.circuitImage)
      try {
        deleteFileIfExists(imagePath)
      } catch (_err) {
        // Continue with clearing race settings even if file deletion fails
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

module.exports = router
