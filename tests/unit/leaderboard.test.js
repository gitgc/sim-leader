const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals')
const { Sequelize } = require('sequelize')
const Leaderboard = require('../../src/models/leaderboard')

describe('Leaderboard Model', () => {
  let sequelize

  beforeAll(async () => {
    // Create an in-memory SQLite database for testing
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    })

    // Initialize the model with the test database
    Leaderboard.init(Leaderboard.rawAttributes, { sequelize })

    // Sync the database
    await sequelize.sync()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    // Clear all data before each test
    await Leaderboard.destroy({ where: {} })
  })

  test('should create a new leaderboard entry', async () => {
    const driverData = {
      driverName: 'Lewis Hamilton',
      points: 100,
    }

    const driver = await Leaderboard.create(driverData)

    expect(driver.driverName).toBe('Lewis Hamilton')
    expect(driver.points).toBe(100)
    expect(driver.id).toBeDefined()
    expect(driver.profilePicture).toBeNull()
  })

  test('should require driverName field', async () => {
    await expect(Leaderboard.create({ points: 50 })).rejects.toThrow()
  })

  test('should require points field', async () => {
    await expect(Leaderboard.create({ driverName: 'Max Verstappen' })).rejects.toThrow()
  })

  test('should validate points as integer', async () => {
    const driver = await Leaderboard.create({
      driverName: 'Charles Leclerc',
      points: 75,
    })

    expect(typeof driver.points).toBe('number')
    expect(Number.isInteger(driver.points)).toBe(true)
  })

  test('should allow profile picture to be set', async () => {
    const driver = await Leaderboard.create({
      driverName: 'Carlos Sainz',
      points: 60,
      profilePicture: '/uploads/sainz.jpg',
    })

    expect(driver.profilePicture).toBe('/uploads/sainz.jpg')
  })

  test('should update driver points', async () => {
    const driver = await Leaderboard.create({
      driverName: 'George Russell',
      points: 30,
    })

    await driver.update({ points: 45 })

    expect(driver.points).toBe(45)
  })

  test('should delete driver entry', async () => {
    const driver = await Leaderboard.create({
      driverName: 'Lando Norris',
      points: 40,
    })

    await driver.destroy()

    const found = await Leaderboard.findByPk(driver.id)
    expect(found).toBeNull()
  })

  test('should find all drivers ordered by points descending', async () => {
    await Leaderboard.bulkCreate([
      { driverName: 'Driver A', points: 100 },
      { driverName: 'Driver B', points: 150 },
      { driverName: 'Driver C', points: 75 },
    ])

    const drivers = await Leaderboard.findAll({
      order: [['points', 'DESC']],
    })

    expect(drivers).toHaveLength(3)
    expect(drivers[0].driverName).toBe('Driver B')
    expect(drivers[0].points).toBe(150)
    expect(drivers[1].driverName).toBe('Driver A')
    expect(drivers[1].points).toBe(100)
    expect(drivers[2].driverName).toBe('Driver C')
    expect(drivers[2].points).toBe(75)
  })

  test('should handle duplicate driver names', async () => {
    await Leaderboard.create({
      driverName: 'Fernando Alonso',
      points: 80,
    })

    // Should allow duplicate names (different entries)
    const duplicate = await Leaderboard.create({
      driverName: 'Fernando Alonso',
      points: 90,
    })

    expect(duplicate.driverName).toBe('Fernando Alonso')
    expect(duplicate.points).toBe(90)

    const allAlonso = await Leaderboard.findAll({
      where: { driverName: 'Fernando Alonso' },
    })

    expect(allAlonso).toHaveLength(2)
  })
})
