const express = require('express')
const { passport } = require('../config/auth')

const router = express.Router()

// Authentication routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (_req, res) => {
    // Successful authentication
    res.redirect('/')
  }
)

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' })
    }
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
