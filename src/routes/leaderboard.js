const express = require('express')
const { isAuthorized } = require('../config/auth')
const { upload } = require('../middleware/upload')
const {
  deleteFileIfExists,
  cleanupUploadedFile,
  getPublicFilePath,
} = require('../utils/fileManager')
const Leaderboard = require('../models/leaderboard')

const router = express.Router()

// Public leaderboard route (no auth required)
router.get('/', async (_req, res) => {
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
router.post('/', isAuthorized, async (req, res) => {
  try {
    const { driverName, points } = req.body
    const newEntry = await Leaderboard.create({ driverName, points })
    res.status(201).json(newEntry)
  } catch (_error) {
    res.status(500).json({ error: 'Error creating leaderboard entry' })
  }
})

// Upload profile picture endpoint
router.post(
  '/:id/profile-picture',
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
        cleanupUploadedFile(req)
        return res.status(404).json({ error: 'Leaderboard entry not found' })
      }

      // Delete old profile picture if exists
      if (entry.profilePicture) {
        const oldPicturePath = getPublicFilePath(entry.profilePicture)
        deleteFileIfExists(oldPicturePath)
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
      cleanupUploadedFile(req)
      res.status(500).json({ error: 'Error uploading profile picture' })
    }
  }
)

// Delete profile picture endpoint
router.delete('/:id/profile-picture', isAuthorized, async (req, res) => {
  try {
    const { id } = req.params
    const entry = await Leaderboard.findByPk(id)

    if (!entry) {
      return res.status(404).json({ error: 'Leaderboard entry not found' })
    }

    // Delete profile picture file if exists
    if (entry.profilePicture) {
      const picturePath = getPublicFilePath(entry.profilePicture)
      deleteFileIfExists(picturePath)
    }

    // Update database to remove profile picture
    await entry.update({ profilePicture: null })

    res.json({ message: 'Profile picture deleted successfully' })
  } catch (_error) {
    res.status(500).json({ error: 'Error deleting profile picture' })
  }
})

// Update leaderboard entry
router.put('/:id', isAuthorized, async (req, res) => {
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

// Delete leaderboard entry
router.delete('/:id', isAuthorized, async (req, res) => {
  try {
    const { id } = req.params
    const entry = await Leaderboard.findByPk(id)

    if (!entry) {
      return res.status(404).json({ error: 'Leaderboard entry not found' })
    }

    // Delete profile picture file if exists
    if (entry.profilePicture) {
      const picturePath = getPublicFilePath(entry.profilePicture)
      deleteFileIfExists(picturePath)
    }

    await entry.destroy()
    res.json({ message: 'Leaderboard entry deleted successfully' })
  } catch (_error) {
    res.status(500).json({ error: 'Error deleting leaderboard entry' })
  }
})

module.exports = router
