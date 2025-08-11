const express = require('express')
const { passport } = require('../config/auth')
const logger = require('../utils/logger')

const router = express.Router()

// Authentication routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication
    logger.logAuth('google_callback_success', req.user)
    res.redirect('/')
  }
)

router.post('/logout', (req, res) => {
  const user = req.user
  req.logout((err) => {
    if (err) {
      logger.logError(err, { context: 'Logout failed', user: user?.email })
      return res.status(500).json({ error: 'Error logging out' })
    }
    logger.logAuth('logout', user, true)
    res.json({ message: 'Logged out successfully' })
  })
})

// Get current user info
router.get('/user', (req, res) => {
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

module.exports = router
