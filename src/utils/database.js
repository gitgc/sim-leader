const sequelize = require('../config/db')
const logger = require('./logger')

// Test database connection and sync models
async function initializeDatabase() {
  try {
    logger.info('Initializing database connection...')
    await sequelize.authenticate()
    logger.info('Database connection established successfully')

    // Sync database models - force update to add new profilePicture column
    logger.debug('Syncing database models...')
    await sequelize.sync({ alter: true })
    logger.info('Database models synchronized successfully')
  } catch (error) {
    logger.logError(error, { context: 'Database initialization failed' })
    throw error
  }
}

// Check if race has expired (midnight PST on race day)
function isRaceExpired(raceDate) {
  if (!raceDate) return false

  const now = new Date()
  const race = new Date(raceDate)

  // Calculate midnight PST on the race day
  // PST is UTC-8
  const racePST = new Date(race.getTime() - 8 * 60 * 60 * 1000)
  const midnightPST = new Date(racePST.getFullYear(), racePST.getMonth(), racePST.getDate() + 1)
  const midnightUTC = new Date(midnightPST.getTime() + 8 * 60 * 60 * 1000)

  return now >= midnightUTC
}

module.exports = {
  initializeDatabase,
  isRaceExpired,
}
